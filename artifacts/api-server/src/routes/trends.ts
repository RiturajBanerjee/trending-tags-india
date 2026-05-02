import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { computeHeatScore, computeMomentum, type ScoringInput } from "../utils/trendScoring.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── In-memory cache (30 minutes) ──────────────────────────────────────────────
const CACHE_DURATION_MS = 30 * 60 * 1000;
let cachedResult: unknown = null;
let cachedAt: Date | null = null;

// ── In-flight deduplication ────────────────────────────────────────────────────
// If multiple requests arrive while the AI call is running, they all share
// this single promise instead of each spawning a separate AI call.
let inFlight: Promise<unknown> | null = null;

// ── RSS feeds — free, no auth required ────────────────────────────────────────
const RSS_FEEDS = [
  { url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi", source: "Google News India" },
  { url: "https://feeds.bbci.co.uk/hindi/rss.xml", source: "BBC Hindi" },
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", source: "NDTV India" },
  { url: "https://www.thehindu.com/news/national/?service=rss", source: "The Hindu" },
];

// ── Category → Hindi label (server-side map, no AI) ──────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  sports:        "खेल",
  news:          "समाचार",
  entertainment: "मनोरंजन",
  festival:      "त्योहार",
  finance:       "वित्त",
  tech:          "तकनीक",
  weather:       "मौसम",
  politics:      "राजनीति",
  viral:         "वायरल",
};

// Hindi words that appear in category labels — used to detect compound/mashup tags
const CATEGORY_HINDI_WORDS = ["खेल", "समाचार", "मनोरंजन", "त्योहार", "वित्त", "तकनीक", "मौसम", "राजनीति", "वायरल", "खबर"];

/** Returns true if the tag appears to be a concatenation of two category label words */
function isMashupTag(tag: string): boolean {
  const bare = tag.replace(/^#/, "");
  let hits = 0;
  for (const word of CATEGORY_HINDI_WORDS) {
    if (bare.includes(word)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  return false;
}

// ── AI cluster — only language-understanding fields (9 fields) ────────────────
// id, categoryLabelHi, sources, primarySource, heat, momentum, rank
// are all derived/computed server-side and must NOT appear in AI output.
interface AiCluster {
  titleHi:         string;
  tag:             string;
  descriptionHi:   string;
  category:        string;
  headlineCount:   number;
  sourceHeadlines: string[];
  region:          string;
  topLanguages:    string[];
}

// ── Derive source signal types from headline text (deterministic) ─────────────
// All feeds are RSS news → "news" is always present.
// "social"/"video"/"search" only added when explicitly mentioned in text.
function deriveSources(headlines: string[]): string[] {
  const text = headlines.join(" ").toLowerCase();
  const sources = new Set<string>(["news"]);
  if (/viral|trend|twitter|instagram|facebook|whatsapp|social\s*media/.test(text)) sources.add("social");
  if (/youtube|video|reel|clip/.test(text)) sources.add("video");
  if (/google|search\s*trend/.test(text)) sources.add("search");
  return Array.from(sources);
}

// ── RSS item ──────────────────────────────────────────────────────────────────
interface RssItem {
  title:   string;
  source:  string;
  pubDate: string | null;
}

// ── Strip CDATA wrapper if present ────────────────────────────────────────────
function stripCdata(raw: string): string {
  return raw.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

// ── Tiny XML parser ───────────────────────────────────────────────────────────
function extractItems(xml: string, source: string): RssItem[] {
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  const results: RssItem[] = [];
  for (const block of itemBlocks) {
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ??
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const pubDateRaw = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const title = (titleMatch?.[1] ?? "").trim();
    if (title.length < 10) continue;
    // Always strip CDATA from pubDate — some feeds (e.g. NDTV) wrap it
    const pubDate = pubDateRaw ? stripCdata(pubDateRaw[1].trim()) : null;
    results.push({ title, source, pubDate });
  }
  return results.slice(0, 20); // 20 per feed × 4 feeds = up to 80 headlines
}

// ── Server-side startedHoursAgo: match sourceHeadlines → pubDates ─────────────
// After AI returns verbatim sourceHeadlines, find them in allItems to get
// actual pubDates. The cluster's age = hours since the EARLIEST headline in it.
// This replaces the AI-estimated startedHoursAgo entirely.
function computeStartedHoursAgo(sourceHeadlines: string[], allItems: RssItem[]): number {
  const now = Date.now();
  const ages: number[] = [];
  for (const headline of sourceHeadlines) {
    const item = allItems.find((it) => it.title === headline || it.title.includes(headline.slice(0, 30)));
    if (!item?.pubDate) continue;
    const ts = Date.parse(item.pubDate);
    if (!isNaN(ts)) ages.push((now - ts) / 3_600_000);
  }
  if (ages.length === 0) return 12; // fallback if no dates matched
  return Math.max(1, Math.round(Math.min(...ages))); // earliest headline = trend start
}

// ── Fetch one RSS feed safely ──────────────────────────────────────────────────
async function fetchFeed(url: string, source: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "TrendBot/1.0" },
    });
    if (!res.ok) return [];
    return extractItems(await res.text(), source);
  } catch {
    return [];
  }
}

// ── Core pipeline: fetch RSS → AI clusters → score → select top 12 ───────────
async function fetchAndScore(): Promise<unknown> {
  // ── Step 1: Fetch RSS headlines ───────────────────────────────────────────
  const allItems = (
    await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.source)))
  ).flat();

  if (allItems.length < 5) {
    throw new Error("Not enough headlines fetched from RSS feeds");
  }

  const numberedHeadlines = allItems
    .map((item, i) => {
      const date = item.pubDate ? ` (${item.pubDate})` : "";
      return `${i + 1}. [${item.source}]${date} ${item.title}`;
    })
    .join("\n");

  // ── Step 2: AI extracts clusters (language understanding only) ────────────
  //
  // AI role: cluster headlines into distinct topics and return the 9 fields
  // that require language understanding (Hindi text, category, region, age).
  //
  // AI does NOT decide importance or rank. We ask for 15 candidates so there
  // is a pool larger than 12. The backend scores all candidates and picks the
  // actual top 12 purely by heat score in Step 3.
  //
  // Fields NOT in the prompt (all computed server-side):
  //   id, categoryLabelHi, sources, primarySource, heat, momentum, rank
  const prompt = `
You are a news clustering engine for India's leading Hindi-language social media platform.

Below are ${allItems.length} real news headlines scraped RIGHT NOW from RSS feeds (Google News India, BBC Hindi, NDTV, The Hindu). Each line starts with a 1-based index.

Identify 15 distinct topics from these headlines and cluster related headlines together.

For each cluster output a JSON object with EXACTLY these keys:
- titleHi: short Hindi title, 4–7 words, Devanagari script
- tag: one Hindi hashtag (e.g. #बंगालचुनाव2026)
- descriptionHi: one Hindi sentence, max 15 words, explaining what happened
- category: one of [sports, news, entertainment, festival, finance, tech, weather, politics, viral]
- headlineCount: exact integer — count of headlines from the list clustered here
- sourceHeadlines: array of 2–3 VERBATIM headline titles from the input (exact copies only)
- region: most relevant Indian region in Hindi (e.g. "अखिल भारत", "मुंबई")
- topLanguages: array of 1–2 Indian language names in Hindi (e.g. ["हिन्दी"])

STRICT RULES:
- sourceHeadlines must be VERBATIM copies of input headline text — never paraphrase or rewrite
- headlineCount must equal the actual number of headlines you clustered (not just sourceHeadlines.length)
- Do NOT include heat, rank, momentum, engagement metrics, or invented data of any kind
- Each cluster must cover ONE specific topic or event — never merge two unrelated topics into one cluster
- The tag must describe the SPECIFIC EVENT or PERSON, not the category. WRONG: #मनोरंजनखेल #न्यूजखेल #खेलसमाचार. RIGHT: #IPL2025 #विराटकोहली #बजट2025
- NEVER concatenate two category words (sports, news, entertainment, politics, etc.) to form a tag
- If sports and entertainment headlines cover different events, create SEPARATE clusters for each

Output ONLY a valid JSON array of 15 objects. No markdown, no explanation, no extra text.

HEADLINES:
${numberedHeadlines}
  `.trim();

  // Use streaming so the HTTP connection stays alive during the AI call.
  // We do NOT set max_completion_tokens: gpt-5-mini is a reasoning model that
  // uses internal thinking tokens. Capping output tokens causes it to exhaust
  // its budget on reasoning and return empty content. Let the model self-manage.
  const stream = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let rawContent = "";
  let finishReason: string | null = null;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) rawContent += delta;
    const reason = chunk.choices[0]?.finish_reason;
    if (reason) finishReason = reason;
  }

  const raw = rawContent.trim();
  if (!raw) {
    throw new Error(`AI returned empty response (finish_reason=${finishReason})`);
  }

  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const clusters: AiCluster[] = JSON.parse(cleaned);

  // ── Step 3: Server-side enrichment ───────────────────────────────────────
  // Derive id, categoryLabelHi, sources, primarySource from factual signals.
  // Compute heat and momentum deterministically via trendScoring.ts.
  const enriched = clusters
    .filter((c) => {
      if (!Array.isArray(c.sourceHeadlines) || c.sourceHeadlines.length === 0 || c.headlineCount <= 0) return false;
      if (isMashupTag(c.tag ?? "")) {
        logger.warn({ tag: c.tag }, "Dropping cluster with mashup tag");
        return false;
      }
      return true;
    })
    .map((c, i) => {
      // Strip "[Source] (date) " prefix AI copies verbatim — do this first so
      // deriveSources and computeStartedHoursAgo both work on clean title text
      const cleanHeadlines = c.sourceHeadlines.map((h) =>
        h.replace(/^\[\w[^\]]*\]\s*(\([^)]*\)\s*)?/, "").trim()
      );
      const sources = deriveSources(cleanHeadlines);
      // Compute startedHoursAgo from actual RSS pubDates by matching clean titles
      const startedHoursAgo = computeStartedHoursAgo(cleanHeadlines, allItems);
      const scoringInput: ScoringInput = {
        headlineCount:   c.headlineCount,
        sources,
        startedHoursAgo,
        sourceHeadlines: cleanHeadlines,
      };
      return {
        // Language fields from AI ────────────────────────────────────────────
        titleHi:         c.titleHi,
        tag:             c.tag,
        descriptionHi:   c.descriptionHi,
        category:        c.category,
        region:          c.region,
        startedHoursAgo,
        topLanguages:    Array.isArray(c.topLanguages) ? c.topLanguages : [],
        sourceHeadlines: cleanHeadlines,
        headlineCount:   c.headlineCount,
        // Derived server-side — no AI ────────────────────────────────────────
        id:              `trend-${i + 1}`,
        categoryLabelHi: CATEGORY_LABELS[c.category] ?? "समाचार",
        sources,
        primarySource:   sources[0] as string,
        // Deterministic scoring — no AI ──────────────────────────────────────
        heat:     computeHeatScore(scoringInput),
        momentum: computeMomentum(scoringInput),
      };
    });

  // ── Step 4: Heat score picks the top 12; rank follows that order ──────────
  // This is the ONLY place the "top 12" decision is made — entirely by the
  // scoring function, not by AI output order.
  const ranked = enriched
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 12)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  const now = new Date();
  const result = {
    trends: ranked,
    fetchedAt: now.toISOString(),
    cachedUntil: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
    headlinesUsed: allItems.length,
  };

  cachedResult = result;
  cachedAt = now;

  return result;
}

// ── Request handler ───────────────────────────────────────────────────────────
router.get("/trends", async (req, res) => {
  // Serve from cache if still fresh
  if (cachedResult && cachedAt && Date.now() - cachedAt.getTime() < CACHE_DURATION_MS) {
    req.log.info("Serving trends from cache");
    res.json(cachedResult);
    return;
  }

  // Deduplicate concurrent requests — all wait on the same in-flight promise
  if (!inFlight) {
    req.log.info({ headlineFeeds: RSS_FEEDS.length }, "Starting fresh fetch");
    inFlight = fetchAndScore().finally(() => {
      inFlight = null;
    });
  } else {
    req.log.info("Joining in-flight fetch");
  }

  try {
    const result = await inFlight;
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate trends");
    res.status(500).json({ error: "Failed to generate trends" });
  }
});

export default router;
