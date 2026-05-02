import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { computeHeatScore, computeMomentum, type ScoringInput } from "../utils/trendScoring.js";

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
  startedHoursAgo: number;
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

// ── Tiny XML parser ───────────────────────────────────────────────────────────
function extractItems(xml: string, source: string): RssItem[] {
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  const results: RssItem[] = [];
  for (const block of itemBlocks) {
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ??
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const title = (titleMatch?.[1] ?? "").trim();
    if (title.length < 10) continue;
    results.push({ title, source, pubDate: pubDateMatch ? pubDateMatch[1].trim() : null });
  }
  return results.slice(0, 20); // 20 per feed × 4 feeds = up to 80 headlines
}

// ── Fetch one RSS feed safely ──────────────────────────────────────────────────
async function fetchFeed(url: string, source: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "ShareChatTrendBot/1.0" },
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
- startedHoursAgo: integer 1–72, estimated from pubDates and headline framing
- topLanguages: array of 1–2 Indian language names in Hindi (e.g. ["हिन्दी"])

STRICT RULES:
- sourceHeadlines must be VERBATIM copies of input headline text — never paraphrase or rewrite
- headlineCount must equal the actual number of headlines you clustered (not just sourceHeadlines.length)
- Do NOT include heat, rank, momentum, engagement metrics, or invented data of any kind

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
    .filter((c) => Array.isArray(c.sourceHeadlines) && c.sourceHeadlines.length > 0 && c.headlineCount > 0)
    .map((c, i) => {
      const sources = deriveSources(c.sourceHeadlines);
      const scoringInput: ScoringInput = {
        headlineCount:   c.headlineCount,
        sources,
        startedHoursAgo: c.startedHoursAgo,
        sourceHeadlines: c.sourceHeadlines,
      };
      return {
        // Language fields from AI ────────────────────────────────────────────
        titleHi:         c.titleHi,
        tag:             c.tag,
        descriptionHi:   c.descriptionHi,
        category:        c.category,
        region:          c.region,
        startedHoursAgo: c.startedHoursAgo,
        topLanguages:    Array.isArray(c.topLanguages) ? c.topLanguages : [],
        sourceHeadlines: c.sourceHeadlines,
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
