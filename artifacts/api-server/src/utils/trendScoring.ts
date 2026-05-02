/**
 * Deterministic trend scoring utilities.
 *
 * These functions replace AI-generated heat/momentum values with
 * transparent, rule-based computations derived only from real signals:
 * headline volume, source diversity, freshness, and keyword repetition.
 *
 * All weights are documented below and can be tuned without touching
 * the AI prompt.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoringInput {
  headlineCount: number;
  sources: string[];
  startedHoursAgo: number;
  sourceHeadlines: string[];
}

// ── Weights (tune here) ───────────────────────────────────────────────────────

const WEIGHTS = {
  // Volume: each headline contributes up to a max of 40 points
  volumePerHeadline: 8,
  volumeCap: 40,

  // Source diversity: each unique source type adds 5 points (no cap in spec)
  sourcePerType: 5,

  // Freshness tiers (additive, not multiplied)
  freshness: {
    within6h: 20,
    within12h: 15,
    within24h: 10,
    older: 5,
  },

  // Recency penalty: older stories lose up to 10 points
  recencyPenaltyDivisor: 10,
  recencyPenaltyCap: 10,

  // Keyword repetition boost: repeated important words signal salience
  keywordRepeatMultiplier: 2,
  keywordBoostCap: 10,

  // Output clamp
  min: 60,
  max: 100,
};

// ── computeHeatScore ──────────────────────────────────────────────────────────

/**
 * Returns an integer heat score in [60, 100].
 *
 * Components:
 *   volumeScore    – reward for many headlines covering this topic
 *   sourceScore    – reward for cross-source coverage (diversity)
 *   freshnessScore – reward for recency (tiered)
 *   recencyPenalty – mild penalty for old stories
 *   keywordBoost   – reward for repeated important keywords across headlines
 */
export function computeHeatScore(trend: ScoringInput): number {
  const { headlineCount, sources, startedHoursAgo, sourceHeadlines } = trend;

  // Guard: treat missing/invalid values safely
  const safeCount = Math.max(0, headlineCount ?? 0);
  const safeSources = Array.isArray(sources) ? sources : [];
  const safeHours = Math.max(0, startedHoursAgo ?? 24);
  const safeHeadlines = Array.isArray(sourceHeadlines) ? sourceHeadlines : [];

  // 1. Volume score: more headlines → higher score, capped
  const volumeScore = Math.min(safeCount * WEIGHTS.volumePerHeadline, WEIGHTS.volumeCap);

  // 2. Source diversity score: more distinct source types → higher score
  const sourceScore = safeSources.length * WEIGHTS.sourcePerType;

  // 3. Freshness score: tiered by age
  let freshnessScore: number;
  if (safeHours <= 6) freshnessScore = WEIGHTS.freshness.within6h;
  else if (safeHours <= 12) freshnessScore = WEIGHTS.freshness.within12h;
  else if (safeHours <= 24) freshnessScore = WEIGHTS.freshness.within24h;
  else freshnessScore = WEIGHTS.freshness.older;

  // 4. Recency penalty: slowly penalise stale stories
  const recencyPenalty = Math.min(
    safeHours / WEIGHTS.recencyPenaltyDivisor,
    WEIGHTS.recencyPenaltyCap,
  );

  // 5. Keyword repetition boost: words (>4 chars) that appear many times across
  //    all sourceHeadlines signal that one topic dominates the coverage
  const allWords = safeHeadlines.join(" ").toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};
  for (const word of allWords) {
    if (word.length > 4) freq[word] = (freq[word] ?? 0) + 1;
  }
  const maxFreq = Object.values(freq).length > 0 ? Math.max(...Object.values(freq)) : 0;
  const keywordBoost = Math.min(maxFreq * WEIGHTS.keywordRepeatMultiplier, WEIGHTS.keywordBoostCap);

  // Sum and clamp
  const raw = volumeScore + sourceScore + freshnessScore - recencyPenalty + keywordBoost;
  return Math.max(WEIGHTS.min, Math.min(WEIGHTS.max, Math.round(raw)));
}

// ── computeMomentum ───────────────────────────────────────────────────────────

/**
 * Returns one of "rising" | "peaking" | "cooling" based on age + volume.
 *
 * Logic:
 *   rising  – fresh story with early coverage (≤6h, ≥3 headlines)
 *   peaking – active story at full coverage (≤24h, ≥4 headlines)
 *   cooling – older or thin coverage
 */
export function computeMomentum(trend: Pick<ScoringInput, "startedHoursAgo" | "headlineCount">): "rising" | "peaking" | "cooling" {
  const { startedHoursAgo, headlineCount } = trend;
  const safeHours = Math.max(0, startedHoursAgo ?? 24);
  const safeCount = Math.max(0, headlineCount ?? 0);

  if (safeHours <= 6 && safeCount >= 3) return "rising";
  if (safeHours <= 24 && safeCount >= 4) return "peaking";
  return "cooling";
}
