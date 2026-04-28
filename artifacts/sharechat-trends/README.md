# ShareChat Trending Tags — APM Assignment

A working mobile prototype for **automatic trending tag discovery** on the ShareChat feed,
designed for an Indian, Hindi-speaking audience.

The app is built as an Expo (React Native) project so it runs as a real mobile app
(iOS / Android via Expo Go) and as a responsive mobile-web app from the same codebase.

---

## What the prototype shows

1. **Trending Feed (home)** — a ranked list of 13 trending tags in **Hindi**, with:
   - रैंक (rank), टैग (#hashtag), श्रेणी (category)
   - हीट स्कोर (heat score 0–100, color-coded)
   - मोमेंटम (rising / peaking / cooling)
   - पोस्ट और व्यू काउंट (posts + views)
   - मुख्य सिग्नल स्रोत (primary source: search / social / news / video / cross-platform)
   - Category filter chips, pull-to-refresh, and a "हॉट" hero card for the #1 trend.
2. **Trend Detail** — tap any tag to drill in:
   - Hero with rank, region, and how long the trend has been live
   - Stats card: heat, posts, views, momentum
   - **Signal breakdown** — exactly which signal sources drove the rank
   - **Languages of discussion** — Hindi, Marathi, Bhojpuri, etc.
   - **Related posts** (the "bonus" requirement) — author, language, engagement
   - **More trends in this category** — keeps the user inside the trend graph
   - Sticky action bar: फ़ॉलो ट्रेंड + शेयर

---

## Part 1 — How the trending system decides what's trending

### Sources (raw signals)

| Source            | What it captures                                     | Why it matters in India                       |
| ----------------- | ---------------------------------------------------- | --------------------------------------------- |
| Search            | Spikes in user search queries on ShareChat + Google  | Earliest leading indicator (festivals, board results) |
| Social            | Posts/comments/shares per minute on ShareChat        | First-party engagement signal                 |
| News              | Headlines from Hindi + regional news APIs            | Mainstream validation (RBI, elections, weather) |
| Video             | Views & rewatch on Moj/short-video                   | Captures viral moments before they hit news   |
| Cross-platform    | Mentions on X / Instagram / YouTube                  | Catches global stories that *actually* matter to India |

### Pipeline

```
                ┌──────────────┐
                │   Search     │
                ├──────────────┤
                │   Social     │
   raw  ───►    │   News       │  ───►  Normalize ───►  Entity
   signals      │   Video      │        per-source       extraction
                │ Cross-plat.  │        (z-score)        (LLM + NER)
                └──────────────┘                              │
                                                              ▼
                                            ┌──────────────────────────┐
                                            │  Cluster co-occurring    │
                                            │  entities into a "tag"   │
                                            │  (#IndiaVsAustralia)     │
                                            └────────────┬─────────────┘
                                                         ▼
                                           ┌────────────────────────────┐
                                           │  Score each tag:           │
                                           │  heat = w1·search          │
                                           │       + w2·social          │
                                           │       + w3·news            │
                                           │       + w4·video           │
                                           │       + w5·cross_platform  │
                                           │       − penalties          │
                                           └────────────┬───────────────┘
                                                        ▼
                                           ┌────────────────────────────┐
                                           │  India + Hindi-audience    │
                                           │  filter (geo, language,    │
                                           │  safety, dedupe)           │
                                           └────────────┬───────────────┘
                                                        ▼
                                           ┌────────────────────────────┐
                                           │  Translate / localise tag  │
                                           │  title + description into  │
                                           │  Hindi (LLM)               │
                                           └────────────┬───────────────┘
                                                        ▼
                                            Ranked top-N tags  ──►  App
```

### Scoring logic (default weights)

```
heat = 0.30 * z(search_velocity)
     + 0.25 * z(social_post_rate)
     + 0.20 * z(news_coverage)
     + 0.15 * z(video_view_rate)
     + 0.10 * z(cross_platform_mentions)
     - 0.20 * staleness_hours
     - safety_penalty
```

Then normalised into a 0–100 **heat score**. Momentum (`rising`/`peaking`/`cooling`)
is the **derivative** of heat over the last 90 minutes.

### Per-stage tools / models

| Stage                    | What we'd use                                              | Why                                                      |
| ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| Search signals           | Internal ShareChat search logs + Google Trends API         | Internal logs are first-party; Trends gives external context |
| Social signals           | Internal post/comment streaming events (Kafka)             | Real-time, ShareChat-native                              |
| News                     | NewsAPI + GDELT + custom Hindi news scrapers               | Multilingual + free + global news graph                  |
| Video signals            | Internal Moj telemetry                                     | First-party                                              |
| Cross-platform           | X (formerly Twitter) trending API, YouTube trending feed   | Captures bleed-over virality                             |
| Entity extraction        | `gpt-4o-mini` or open-weights LLM (Llama-3.1-8B-Instruct)  | Cheap, multilingual, handles Hinglish entities well      |
| Clustering               | Embedding model (`text-embedding-3-small`) + HDBSCAN       | Groups "Ind vs Aus", "रोहित शर्मा", "क्रिकेट मैच" into one tag |
| Hindi localisation       | LLM translation (Claude / GPT-4o) with brand glossary      | Tag title + 1-line description must feel native Hindi   |
| Safety                   | Internal moderation classifier + keyword blocklist         | Filters communal / NSFW tags before display              |
| Personalisation (next)   | Per-user collaborative filter on top of the global ranking | Re-rank top 50 → top 10 per user                         |

### Filters

1. **Geography** — drop tags whose primary signal is not geographically relevant to India.
2. **Language** — boost tags with Hindi / regional-language post mass; discard tags that are
   purely English-Twitter chatter.
3. **Safety** — communal, NSFW, harassment, election misinformation tags are suppressed.
4. **Freshness** — anything older than ~48 h with cooling momentum drops off.
5. **Dedupe** — collapse near-duplicate tags (e.g. `#INDvsAUS` and `#IndiaVsAustralia`).

> Per the assignment, the prototype seeds **realistic mock signals** in `data/trends.ts` so
> the UX can be evaluated end-to-end without depending on third-party API keys.

---

## Part 2 — UX rationale

### What we optimised for

- **Scan in 2 seconds.** A user opening the feed should immediately know the #1 trend
  *and* roughly *why* it's #1. The hero card carries the title, tag, category, heat,
  and a one-line "क्यों ट्रेंड कर रहा है" description.
- **Trustworthy ranking.** Every card shows the **primary signal source**. Trending lists
  feel like magic; showing the source makes them feel honest.
- **Mobile-native, Bharat-first.** Hindi-first copy, Devanagari numerals where it matters,
  warm cream + saffron + magenta palette inspired by ShareChat's brand and Indian
  festival aesthetics — not a generic dark-mode dashboard.
- **Drill-down without friction.** Tap → detail with stats, signal breakdown, language
  breakdown, related posts, and related trends. The user can keep tapping deeper without
  ever feeling lost (sticky back + share + follow).
- **Honest empty / refresh state.** Pull-to-refresh updates the timestamp; category
  filter has its own empty state.

### What we considered and rejected

- ❌ A 3-tab layout (Trending / Categories / Search). Adds chrome before the user has
  even read one tag. Categories are filter chips at the top of the feed instead.
- ❌ Showing only the hashtag (`#IndiaVsAustralia`). Users in Tier-2/3 cities scan in
  Hindi first; the title is in Hindi (`भारत बनाम ऑस्ट्रेलिया`) with the hashtag as a
  secondary label.
- ❌ A leaderboard-style numeric heat score with no visual. We pair the number with a
  color-coded heat bar so it's understandable at a glance.
- ❌ A dark moody trending UI. ShareChat's audience associates warmth and color with
  the platform; a flat dark UI would feel off-brand.

### What we'd build next with 4 more weeks

1. **Wire real signals** — start with internal search + post events, layer in a free
   news API and X trending in week 1, and tune weights with offline back-testing.
2. **Per-user re-ranking** — re-rank the global top 50 → top 10 using a lightweight
   model on (language, region, recent watches, follow-graph).
3. **Live trend pulse** — animated heat bar that updates every 30 s on the detail page,
   plus push notifications for "ट्रेंड अब चरम पर" (followed-trend peaks).
4. **Trend → content bridge** — clicking "विस्तार से देखें" should land on a curated,
   moderation-filtered content rail (already prototyped in detail view).
5. **Language switching** — full locale switch (Hindi / Marathi / Tamil / Telugu /
   Bhojpuri) with localised heat thresholds.
6. **Editor override layer** — a small CMS for ShareChat editors to pin / suppress
   tags during sensitive events (elections, communal news).
7. **Explainability API** — `GET /trends/:id/why` returning the exact signal weights
   that produced the rank, for internal trust + external press.

---

## Stack

- **Mobile**: Expo SDK 54, React Native 0.81, Expo Router
- **Language**: TypeScript
- **State**: React Query + local React state
- **Icons**: `@expo/vector-icons` (Feather)
- **Fonts**: Inter (Devanagari rendered via system font fallback)
- **Haptics**: `expo-haptics` on tap / follow
- **Build target**: iOS, Android (Expo Go), and responsive mobile-web

## Tools used (per the assignment's GenAI disclosure)

Built with **Replit Agent** as the primary code-generation assistant. All product
decisions, copy, ranking model, UX rationale, and pipeline design are author-original.
