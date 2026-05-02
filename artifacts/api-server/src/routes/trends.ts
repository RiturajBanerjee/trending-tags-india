import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── In-memory cache (30 minutes) ──────────────────────────────────────────────
const CACHE_DURATION_MS = 30 * 60 * 1000;
let cachedResult: unknown = null;
let cachedAt: Date | null = null;

// ── RSS feeds — free, no auth required ────────────────────────────────────────
// 1. Google News India (Hindi)
// 2. BBC Hindi
// 3. NDTV India
// 4. The Hindu — National
const RSS_FEEDS = [
  {
    url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi",
    source: "Google News India",
  },
  {
    url: "https://feeds.bbci.co.uk/hindi/rss.xml",
    source: "BBC Hindi",
  },
  {
    url: "https://feeds.feedburner.com/ndtvnews-india-news",
    source: "NDTV India",
  },
  {
    url: "https://www.thehindu.com/news/national/?service=rss",
    source: "The Hindu",
  },
];

// ── Tiny XML title extractor ───────────────────────────────────────────────────
// Pulls out all <title> tags from an RSS XML string, skipping the channel title.
function extractTitles(xml: string, source: string): string[] {
  const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/gs)];
  return matches
    .map((m) => (m[1] ?? m[2] ?? "").trim())
    .filter((t) => t.length > 10 && !t.toLowerCase().includes("rss") && !t.toLowerCase().includes("feed"))
    .slice(0, 20) // cap at 20 per feed
    .map((t) => `[${source}] ${t}`);
}

// ── Fetch one RSS feed safely ──────────────────────────────────────────────────
async function fetchFeed(url: string, source: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "ShareChatTrendBot/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return extractTitles(xml, source);
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
    const allHeadlines = (
      await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.source)))
    ).flat();

    if (allHeadlines.length < 5) {
      res.status(500).json({ error: "Not enough headlines fetched from RSS feeds" });
      return;
    }

    req.log.info({ count: allHeadlines.length }, "Headlines fetched, calling AI");

    // Step 2: Ask GPT to identify trends and produce Hindi metadata
    const prompt = `
You are a trending topics analyst for ShareChat, India's leading social media platform for Bharat.

Below are today's news headlines scraped from RSS feeds (Google News India, BBC Hindi, NDTV, The Hindu).
Each headline is prefixed with [SourceName].

Your job:
1. Identify the TOP 12 distinct trending topics that are most relevant to an Indian, Hindi-speaking audience TODAY.
2. Cluster related headlines into a single trend (e.g. multiple cricket articles → one #IndiaVsAustralia trend).
3. Ignore global tech/finance stories that are NOT trending in India specifically.
4. For each trend, output a JSON object.

Rules:
- titleHi: short Hindi title (5–8 words), written in Devanagari script
- tag: Hindi hashtag in Devanagari or Hinglish (e.g. #भारतVsऑस्ट्रेलिया or #DelhiMetro)
- descriptionHi: one-sentence Hindi description of why it's trending (Devanagari), max 25 words
- category: one of [sports, news, entertainment, festival, finance, tech, weather, politics, viral]
- categoryLabelHi: Hindi label for the category
- heat: integer 60–100, higher = more trending. #1 trend should be ~95-100.
- postsCount: estimated posts in thousands (integer, e.g. 240000)
- viewsCount: estimated views (integer, e.g. 15000000)
- sources: array of signal sources from [search, social, news, video, cross-platform]
- primarySource: the single most important source
- region: most relevant Indian region in Hindi (e.g. "अखिल भारत", "मुंबई", "उत्तर भारत")
- startedHoursAgo: roughly how many hours ago this started trending (integer 1–48)
- momentum: one of [rising, peaking, cooling]
- topLanguages: array of 1–3 Indian languages this is most discussed in (Hindi names, e.g. ["हिन्दी", "मराठी"])
- relatedPosts: array of exactly 2 realistic social media posts about this trend. Each post:
  - author: Hindi/Indian name of the poster
  - handle: @handle in English
  - language: language of the post in Hindi (e.g. "हिन्दी")
  - text: a realistic, engaging social media post IN HINDI (Devanagari), 20–40 words
  - likes: integer realistic likes count
  - shares: integer realistic shares count
- id: a slug ID in English kebab-case

Rank them 1–12, rank 1 being the hottest.

Headlines (${allHeadlines.length} total):
${allHeadlines.join("\n")}

Output ONLY a valid JSON array of 12 objects with these exact keys. No markdown, no explanation.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";

    // Strip any markdown code fences if the model added them
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const trends: unknown[] = JSON.parse(cleaned);

    // Add rank field based on array position (in case model forgot)
    const ranked = (trends as Array<Record<string, unknown>>).map((t, i) => ({
      ...t,
      rank: i + 1,
    }));

    const now = new Date();
    const result = {
      trends: ranked,
      fetchedAt: now.toISOString(),
      cachedUntil: new Date(now.getTime() + CACHE_DURATION_MS).toISOString(),
      headlinesUsed: allHeadlines.length,
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
