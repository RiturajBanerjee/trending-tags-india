import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { computeHeatScore, computeMomentum, type ScoringInput } from "../utils/trendScoring.js";

const router = Router();

// ── In-memory cache (30 minutes) ──────────────────────────────────────────────
const CACHE_DURATION_MS = 30 * 60 * 1000;
let cachedResult: unknown = null;
let cachedAt: Date | null = null;

// ── RSS feeds — free, no auth required ────────────────────────────────────────
const RSS_FEEDS = [
  { url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi", source: "Google News India" },
  { url: "https://feeds.bbci.co.uk/hindi/rss.xml", source: "BBC Hindi" },
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", source: "NDTV India" },
  { url: "https://www.thehindu.com/news/national/?service=rss", source: "The Hindu" },
];

// ── RSS item: title + optional pubDate ────────────────────────────────────────
interface RssItem {
  title: string;
  source: string;
  pubDate: string | null;
}

// ── Raw trend shape returned by the AI (no heat/momentum — computed by us) ───
interface AiTrend {
  id: string;
  titleHi: string;
  tag: string;
  descriptionHi: string;
  category: string;
  categoryLabelHi: string;
  headlineCount: number;
  sources: string[];
  primarySource: string;
  region: string;
  startedHoursAgo: number;
  topLanguages: string[];
  sourceHeadlines: string[];
}

// ── Tiny XML parser ─────────────────────────────────────────────────────────
// Pulls <title> and <pubDate> pairs from an RSS XML string.
function extractItems(xml: string, source: string): RssItem[] {
  // Split on <item> boundaries so we can pair title + pubDate
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1); // skip channel header
  const results: RssItem[] = [];

  for (const block of itemBlocks) {
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ??
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const title = (titleMatch?.[1] ?? "").trim();
    if (title.length < 10) continue;

    results.push({
      title,
      source,
      pubDate: pubDateMatch ? pubDateMatch[1].trim() : null,
    });
  }
  return results.slice(0, 20); // cap per feed
}

// ── Fetch one RSS feed safely ──────────────────────────────────────────────────
async function fetchFeed(url: string, source: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "ShareChatTrendBot/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return extractItems(xml, source);
  } catch {
    return [];
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
router.get("/trends", async (req, res) => {
  // Return from cache if still fresh
  if (cachedResult && cachedAt && Date.now() - cachedAt.getTime() < CACHE_DURATION_MS) {
    req.log.info("Serving trends from cache");
    res.json(cachedResult);
    return;
  }

  try {
    // Step 1: Fetch all RSS feeds in parallel
    req.log.info("Fetching RSS feeds");
    const allItems = (
      await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.source)))
    ).flat();

    if (allItems.length < 5) {
      res.status(500).json({ error: "Not enough headlines fetched from RSS feeds" });
      return;
    }

    req.log.info({ count: allItems.length }, "Headlines fetched, calling AI");

    // Build numbered list with source + pubDate so AI can cite timestamps
    const numberedHeadlines = allItems
      .map((item, i) => {
        const date = item.pubDate ? ` (${item.pubDate})` : "";
        return `${i + 1}. [${item.source}]${date} ${item.title}`;
      })
      .join("\n");

    // Step 2: Ask GPT to cluster headlines into trending topics.
    //
    // IMPORTANT: AI handles ONLY structure + clustering.
    // heat and momentum are NOT in the prompt — they are computed
    // deterministically in Step 3 using trendScoring.ts.
    const prompt = `
You are a trending topics analyst for India's leading vernacular social media platform.

Below are ${allItems.length} real news headlines scraped RIGHT NOW from RSS feeds (Google News India, BBC Hindi, NDTV, The Hindu). Each line starts with a 1-based index number.

Your job:
1. Identify the TOP 12 distinct trending topics most relevant to an Indian, Hindi-speaking audience TODAY.
2. Cluster related headlines (same story) into one trend.
3. For each trend output a JSON object with these EXACT keys:

- id: kebab-case slug (English)
- titleHi: short Hindi title, 5–8 words, Devanagari script
- tag: Hindi hashtag (Devanagari or Hinglish, e.g. #बंगालचुनाव2026)
- descriptionHi: one Hindi sentence (Devanagari, max 25 words) explaining WHY it is trending
- category: one of [sports, news, entertainment, festival, finance, tech, weather, politics, viral]
- categoryLabelHi: Hindi label for the category (e.g. "राजनीति", "खेल")
- headlineCount: exact integer — count of headlines from the list below clustered into this trend
- sources: array of signal types inferred from headline sources. Use ONLY: [news, social, search, video, cross-platform]. Use "news" for any RSS source. Add "social" only if a headline explicitly mentions social media trend/viral. Add "video" only if a headline mentions video/YouTube.
- primarySource: the single most dominant entry from the sources array
- region: most relevant Indian region in Hindi (e.g. "अखिल भारत", "मुंबई", "पश्चिम बंगाल")
- startedHoursAgo: integer 1–72 — best estimate based on pubDates and headline framing ("breaking" vs "follow-up" vs "analysis")
- topLanguages: array of 1–3 Indian language names in Hindi (e.g. ["हिन्दी", "बंगाली"]) based on regional relevance
- sourceHeadlines: array of VERBATIM headline title texts from the input list used for this trend. EXACT COPIES only — no paraphrasing. Include 2–5 per trend.

IMPORTANT DATA INTEGRITY RULES:
- Do NOT generate heat, momentum, rank, or any engagement metrics — those are computed server-side.
- Do NOT invent post counts, view counts, likes, comments, or any platform engagement numbers.
- Do NOT generate fake social media posts or fake user names.
- sourceHeadlines must be verbatim copies of actual input headlines — never paraphrased.
- headlineCount must exactly equal the number of headlines you clustered.

Output ONLY a valid JSON array of 12 objects. No markdown, no explanation, no wrapping.

HEADLINES:
${numberedHeadlines}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const aiTrends: AiTrend[] = JSON.parse(cleaned);

    // Step 3: Post-process — compute heat + momentum deterministically,
    // then sort by heat DESC and assign final rank.
    // This means ranking is fully explainable and not a GPT black box.
    const enriched = aiTrends.map((t) => {
      const scoringInput: ScoringInput = {
        headlineCount: t.headlineCount,
        sources: t.sources,
        startedHoursAgo: t.startedHoursAgo,
        sourceHeadlines: t.sourceHeadlines,
      };
      return {
        ...t,
        heat: computeHeatScore(scoringInput),
        momentum: computeMomentum(scoringInput),
      };
    });

    // Sort hottest first, then assign 1-based rank
    const ranked = enriched
      .sort((a, b) => b.heat - a.heat)
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

    req.log.info({ count: ranked.length }, "Trends generated and cached");
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate trends");
    res.status(500).json({ error: "Failed to generate trends" });
  }
});

export default router;
