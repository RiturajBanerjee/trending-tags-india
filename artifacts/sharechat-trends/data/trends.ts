// Type definitions that mirror the OpenAPI spec.
// No static fallback data — all data comes from the live /api/trends endpoint.

export type TrendCategory =
  | "sports"
  | "news"
  | "entertainment"
  | "festival"
  | "finance"
  | "tech"
  | "weather"
  | "politics"
  | "viral";

export type TrendSource =
  | "search"
  | "social"
  | "news"
  | "video"
  | "cross-platform";

export type Trend = {
  id: string;
  rank: number;
  tag: string;
  titleHi: string;
  descriptionHi: string;
  category: TrendCategory;
  categoryLabelHi: string;
  /**
   * AI-assessed trending intensity (0–100).
   * Based on headline volume, source diversity, and editorial prominence.
   * NOT a real-time platform metric — it is derived from RSS headlines fetched live.
   */
  heat: number;
  /** Number of RSS headlines clustered into this trend */
  headlineCount: number;
  sources: TrendSource[];
  primarySource: TrendSource;
  region: string;
  /**
   * AI estimate of how many hours ago this topic began trending.
   * Inferred from headline timestamps and phrasing — not sourced from any platform API.
   */
  startedHoursAgo: number;
  momentum: "rising" | "peaking" | "cooling";
  topLanguages: string[];
  /**
   * Verbatim headline texts from the RSS feeds that were clustered into this trend.
   * These are real strings — not generated or paraphrased.
   */
  sourceHeadlines: string[];
};

export const sourceLabelsHi: Record<TrendSource, string> = {
  search: "सर्च ट्रेंड",
  social: "सोशल बज़",
  news: "न्यूज़ कवरेज",
  video: "वीडियो वायरल",
  "cross-platform": "क्रॉस-प्लेटफ़ॉर्म",
};

export const momentumLabelsHi: Record<Trend["momentum"], string> = {
  rising: "बढ़ रहा है",
  peaking: "चरम पर",
  cooling: "धीमा पड़ रहा",
};

export function formatCount(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} करोड़`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} लाख`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}
