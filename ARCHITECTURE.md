# TECHPULSE — Architecture

A UK-focused discovery platform for tech news, events and AI hackathons, built
with Next.js 16 (App Router, Turbopack), React 19, TypeScript and Tailwind CSS v4.
Data is live (public RSS/APIs, no keys), with a bundled snapshot as fallback.
As of 2026-09-03 it also exposes a **WebMCP** tool layer so AI agents can use
the site directly (see [WebMCP layer](#webmcp-layer) below). As of 2026-09-04
it also has **Hunt**, a unified opportunity-discovery section (awards,
volunteering and more) that is the first part of TechPulse actually backed by
Postgres — see [§11](#11-hunt--unified-opportunity-discovery).

Live: https://techpulse-uk.vercel.app

---

## 1. Stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| Styling    | Tailwind CSS v4, `lucide-react` icons, `next-themes` (light/dark) |
| Validation | Zod |
| Parsing    | `fast-xml-parser` (RSS/Atom) |
| Data       | News/Events/Hackathons: live public sources, `unstable_cache`, Prisma schema written but unwired. Hunt: Postgres via Prisma (`lib/prisma.ts`) — see §11. |
| Hosting    | Vercel (`ministryof-wizard/techpulse-uk`) |

No API keys anywhere — `.env.local` only holds Vercel's auto OIDC token.
`TECHPULSE_LIVE=off` forces the bundled fallback dataset (useful offline/in CI).

---

## 2. High-level architecture

```
                        ┌─────────────────────────────────────────────┐
                        │              External sources                │
                        │  RSS/Atom feeds · Google News · arXiv ·      │
                        │  Devpost API · ukhackathons.com ·            │
                        │  developers.events · confs.tech · Eventbrite │
                        └───────────────────┬───────────────────────────┘
                                            │ fetch() (AbortSignal.timeout)
                                            ▼
                        ┌─────────────────────────────────────────────┐
                        │   lib/sources/*  (per-source fetch+normalise) │
                        └───────────────────┬───────────────────────────┘
                                            ▼
                        ┌─────────────────────────────────────────────┐
                        │   lib/ai/ingest.ts + lib/ai/provider.ts       │
                        │   (dedupe → heuristic classify → summarise)   │
                        └───────────────────┬───────────────────────────┘
                                            ▼
                        ┌─────────────────────────────────────────────┐
                        │   lib/provider.ts — DataProvider              │
                        │   unstable_cache (30 min) + React cache()     │
                        │   falls back to lib/data/* snapshot on error  │
                        └───────────────────┬───────────────────────────┘
                                            ▼
                        ┌─────────────────────────────────────────────┐
                        │   lib/queries.ts — filter/search/sort/trend   │
                        │   shared by pages AND /api/* routes           │
                        └──────┬───────────────────────┬────────────────┘
                               ▼                        ▼
                     app/**/page.tsx (SSR/SSG)    app/api/**/route.ts (REST)
                               │                        │
                               ▼                        ▼
                        React Server Components   fetch() from client code
                               │                   AND from WebMCP tool
                               │                   `execute()` handlers
                               ▼
                     components/* (client + server)
                               │
              ┌────────────────┼─────────────────────┐
              ▼                ▼                      ▼
     app/providers.tsx   components/assistant.tsx  components/webmcp-provider.tsx
     (localStorage store:  (NL Q&A widget, calls    (registers WebMCP tools with
      bookmarks/prefs/      POST /api/assistant)      document.modelContext)
      notifications/auth)
```

Two audiences read the same `lib/queries.ts` filtering logic: humans via
Next.js pages, and agents via `/api/*` JSON routes called from the WebMCP
tools. Nothing is duplicated between "the app" and "the agent-facing layer."

---

## 3. Data sources (`lib/sources/*`)

All sources are public, unauthenticated (no API keys), and every listing
links back to its original/official page.

| File | Feeds | Notes |
|---|---|---|
| `rss.ts` | — | Shared RSS2/Atom parser built on `fast-xml-parser`. |
| `news.ts` | 30+ RSS feeds (`FEEDS[]`): OpenAI, DeepMind, Google Research, HuggingFace, NVIDIA, AWS, GitHub, BAIR, Import AI blogs + KDnuggets/Analytics Vidhya/DEV + arXiv cs.AI/LG/CL + Google News topic searches | Pipes raw items through `lib/ai/ingest.ts` for classify/dedupe/summarise before returning `NewsArticle[]`. ~110 articles. |
| `devpost.ts` | Devpost public hackathons API (`devpost.com/api/hackathons`, 7 query URLs) | Global hackathons, all technologies (AI sorted first). List API is shallow — detail pages link out to the official Devpost page. |
| `ukhackathons.ts` | ukhackathons.com homepage (`<article class="card">`) | Astro site; its `robots.txt` explicitly invites crawling. ~40 UK hackathons. |
| `hackathons.ts` | Merges `devpost.ts` + `ukhackathons.ts` | De-duplicated by slug; throws only if both sources yield nothing (triggers provider fallback). |
| `devevents.ts` | `developers.events/all-events.json` | Open, GitHub-maintained global tech-event dataset. |
| `conferences.ts` | tech-conferences / confs.tech GitHub JSON dataset | AI/Data/DevOps/Security/general/cloud tracks, future events, worldwide. |
| `eventbrite.ts` | Eventbrite public search pages (`window.__SERVER_DATA__` payload) | **Off by default** — Eventbrite's ToS forbids scraping. Gated behind `TECHPULSE_EVENTBRITE=on`; kept in the repo for anyone with an official arrangement. |
| `events.ts` | Merges `devevents.ts` + `conferences.ts` (+ `eventbrite.ts` if enabled) | De-duplicated; ~150–250 worldwide events. |

**Compliance**: no scraping of ToS-restricted sites is on by default; the
footer carries a full "independent tool, not affiliated" disclaimer.

---

## 4. Data & domain layer (`lib/`)

- **`lib/types.ts`** — core domain types: `NewsArticle`, `TechEvent`,
  `Hackathon`, `SearchResult`, `Preferences`, `AppNotification`, `Region`
  (+ `regionForCountry()`), `Category`, `Topic`, `ContentType`.
- **`lib/provider.ts`** — `DataProvider` interface (`listNews`/`getNews`,
  `listEvents`/`getEvent`, `listHackathons`/`getHackathon`). `LiveProvider`
  wraps each live fetch in `unstable_cache` (30-min TTL, `CACHE_VERSION`
  tagged) + React `cache()` for per-render dedup, falling back to the
  `lib/data/*` snapshot on any failure. **This is the sole swap point for a
  real database** — implement a `PrismaProvider` against the schema in
  `prisma/schema.prisma` and nothing above this layer needs to change.
- **`lib/queries.ts`** — all filtering/search/sort/trending logic:
  `queryNews`, `queryEvents`, `queryHackathons`, `globalSearch`,
  `trendingTopics`, `closingSoon`. UK-first sort by default. Shared by every
  page and every `/api/*` route (and, transitively, by the WebMCP tools).
- **`lib/ai/provider.ts`** — `LlmProvider` interface (`classifyArticle`).
  Ships a deterministic, regex-based heuristic classifier so the MVP needs no
  API key; swap in a real model by implementing the interface.
- **`lib/ai/ingest.ts`** — news ingestion pipeline: normalise → dedupe
  (title-fingerprint) → classify/summarise/tag via `lib/ai/provider.ts` →
  `NewsArticle[]`.
- **`lib/assistant/parse.ts`** — regex intent/entity parser (intent, content
  types, topics, location, timeframe, deadline window, price, min prize) —
  no LLM call.
- **`lib/assistant/answer.ts`** — runs the parsed query back through
  `lib/queries.ts` and formats a reply + result cards + follow-up
  suggestions. Backs both the floating chat widget and the
  `ask_techpulse_assistant` WebMCP tool.
- **`prisma/schema.prisma`** — production target schema (`User`,
  `UserPreference`, `News`, `Event`, `Hackathon`, `Bookmark`, `Notification`,
  …) for Postgres. Not wired up yet — `npx prisma generate` works with no
  `DATABASE_URL`.

---

## 5. Application (`app/`)

| Route | Purpose |
|---|---|
| `/` | Homepage — hero, stat band, trending, closing-soon. |
| `/news`, `/news/[slug]` | News listing (filters: category/topic/format/trending/time) + detail. |
| `/events`, `/events/[slug]` | Events listing (filters: category/type/location/format/date/price) + detail. |
| `/hackathons`, `/hackathons/[slug]` | Hackathons listing (filters: technology/region/mode/deadline/prize) + detail. |
| `/hunt`, `/hunt/[category]`, `/hunt/[category]/[slug]` | Unified opportunity discovery — Awards, Volunteering, Speaking/CFP, Judging, Mentoring, Grants and Startup Competitions are live; Product Launches is roadmap-only. See §11. |
| `/search` | Global search across all four content types (news/events/hackathons/Hunt). |
| `/saved` | The current browser's bookmarked items, including Hunt opportunities. |
| `/submit` | Community submission form (event/hackathon/award/volunteering suggestions). |
| `/about`, `/admin` | Static about page; admin panel (ingestion preview + Hunt Data Sources/Needs Review tabs). |

Detail routes use `dynamicParams=false` (so unknown slugs 404) with
`revalidate=1800` on `[slug]` pages.

**API routes** (`app/api/*/route.ts`) — all thin wrappers around
`lib/queries.ts`, returning JSON; these are the routes both the browser UI
*and* the WebMCP tools call:

| Route | Method | Delegates to |
|---|---|---|
| `/api/news` | GET | `queryNews` (+ `paginate`) |
| `/api/events` | GET | `queryEvents` (+ `paginate`) |
| `/api/hackathons` | GET | `queryHackathons` (+ `paginate`) |
| `/api/search` | GET | `globalSearch` |
| `/api/trending` | GET | `trendingTopics` + `closingSoon` + trending news |
| `/api/assistant` | POST | `lib/assistant/answer.ts` |
| `/api/bookmarks` | POST/DELETE | Server contract for a future signed-in bookmarks backend (bookmarks themselves are client-side today) |
| `/api/newsletter` | POST | Newsletter signup |
| `/api/submissions` | POST | Community submission form (award/volunteering kinds also run `ingestSingleOpportunity`) |
| `/api/ingest/preview` | GET | Admin preview of the news ingestion pipeline |
| `/api/hunt` | GET | `queryOpportunities` (+ `paginate`) |
| `/api/hunt/[category]/[slug]` | GET | `getOpportunity` |
| `/api/hunt/resolve/[slug]` | GET | Slug-only lookup, used by the `open_item` WebMCP tool |
| `/api/hunt/sync` | GET/POST | `runHuntSync` — protected by `CRON_SECRET`; also Vercel Cron's daily target (`vercel.json`) |
| `/api/admin/hunt-sync` | POST | Same sync, unauthenticated server-side call for the admin "Sync now" button |
| `/api/admin/sources/[id]` | PATCH | Enable/disable a `DataSource` |
| `/api/admin/opportunities` | GET/POST | Needs-review queue / manual "Add Opportunity" |
| `/api/admin/opportunities/[id]` | PATCH | Approve (publish) or reject a needs-review row |

---

## 6. Client state (`app/providers.tsx`)

No auth backend yet — bookmarks, preferences, notifications and a
lightweight "signed-in" user are all stored client-side in `localStorage`
(`tp:bookmarks`, `tp:preferences`, `tp:notifications`, `tp:user`) behind a
`useStore()` React context (`Store` provider, wrapped in `next-themes`'
`ThemeProvider`). `/api/bookmarks` mirrors the shape this would take once a
real backend exists.

Key store methods: `isSaved(type, slug)`, `toggleSave(type, slug)`,
`prefs`/`setPrefs`, `notifications`/`markAllRead`/`pushNotification`,
`user`/`signIn`/`signOut`. **These are exactly the methods the WebMCP bridge
calls into** — see below.

---

## 7. Components (`components/`)

Selected highlights (most are self-explanatory from the name):

- `navbar.tsx`, `footer.tsx`, `logo.tsx` — chrome/branding (Space Grotesk font, pulse-wave mark).
- `hero.tsx`, `stat-band.tsx`, `trending-tech.tsx`, `closing-soon.tsx` — homepage sections.
- `news-card.tsx`, `event-card.tsx`, `hackathon-card.tsx`, `grids.tsx`, `pagination.tsx`, `skeletons.tsx` — listing UI.
- `filters.tsx`, `search-bar.tsx`, `command-palette.tsx` (⌘K/Ctrl+K) — discovery UI.
- `cover.tsx` — `<Cover>`: 3-stage image fallback (source image → curated topic photo → gradient).
- `badges.tsx` — `VerifiedBadge`/`UnverifiedBadge` (blue tick for official-source listings, e.g. Devpost/devevents/conferences; muted for aggregator-only listings like ukhackathons).
- `assistant.tsx` — floating chat widget, calls `POST /api/assistant`.
- `dashboard.tsx`, `preferences-panel.tsx`, `notification-bell.tsx`, `auth-button.tsx` — the `/saved` / personalisation surface, all backed by `useStore()`.
- `submit-form.tsx`, `newsletter.tsx` — community submission and signup forms.
- `admin-panel.tsx` — ingestion pipeline preview.
- `theme-toggle.tsx`, `reading-progress.tsx` — light/dark switch; scroll progress bar on news detail pages.
- **`webmcp-provider.tsx`** — registers the WebMCP tool layer (see below). Renders nothing.

---

## 8. WebMCP layer

Added 2026-09-03 for Devpost's "WebMCP Challenge." Lets an AI agent — Chrome
146+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT's in-app
browser — call TECHPULSE's functionality directly via
`document.modelContext.registerTool(...)`, instead of scraping the DOM.

### 8.1 Files

| File | Role |
|---|---|
| `lib/webmcp/types.ts` | Ambient TypeScript types for the `document.modelContext` browser API (`ModelContextTool`, `ModelContextToolExecute`, `RegisterToolOptions`, etc.) — no official `@types` package exists yet for this emerging W3C standard. Also exports `hasWebMCP()`. |
| `lib/webmcp/tools.ts` | `buildTechPulseTools(bridge)` — the tool definitions (name/description/`inputSchema`/`execute`/`annotations`). `registerTechPulseTools(bridge, signal)` — registers them all against `document.modelContext`; safely no-ops if unsupported. Framework-agnostic (no React/Next import), so it's reusable from a future dedicated MCP server. |
| `components/webmcp-provider.tsx` | Client component mounted once in `app/layout.tsx`. Bridges the tools to live app state — `useStore()` for bookmarks, `useRouter()` for navigation — via a ref kept current in a `useEffect` (so tools always see fresh state without needing to re-register, since `registerTool` has no update/replace API). Registers on mount with an `AbortController`; aborting unregisters. |

### 8.2 Registered tools

All tools call the existing `/api/*` routes (or the local bookmarks store /
router) — the agent-facing layer is a thin wrapper over the same
`lib/queries.ts` logic the human UI uses, not a separate implementation.
Read-only tools return a small **trimmed** JSON shape (slug, url, title,
summary, a few key fields) rather than full DB rows, to keep agent context
usage low.

| Tool | Purpose | Key inputs | Backing route/state |
|---|---|---|---|
| `search_news` | Search live tech/AI/data news | `query`, `topic`, `time`, `trendingOnly`, `limit` | `GET /api/news` |
| `search_events` | Search live events/conferences/meetups | `query`, `topic`, `location`, `date`, `price`, `limit` | `GET /api/events` |
| `search_hackathons` | Search live hackathons | `query`, `topic`, `region`, `mode`, `deadline`, `prize`, `limit` | `GET /api/hackathons` |
| `global_search` | Search news+events+hackathons at once | `query` (required), `type`, `limit` | `GET /api/search` |
| `get_trending_and_closing_soon` | "What's hot" + deadlines within 14 days | `limit` | `GET /api/trending` |
| `ask_techpulse_assistant` | Free-form NL question | `message` (required) | `POST /api/assistant` |
| `list_saved_items` | List the visitor's bookmarks | — | `useStore().bookmarks` |
| `save_item` | Bookmark an item | `type`, `slug` (required) | `useStore().toggleSave` |
| `remove_saved_item` | Un-bookmark an item | `type`, `slug` (required) | `useStore().toggleSave` |
| `open_item` | Navigate the tab to a detail page (so a human watching sees what the agent found, or can complete a human-only step like hackathon registration) | `type`, `slug` (required) | `useRouter().push` |

Every tool declares `annotations` (`readOnlyHint`, `idempotentHint`,
`destructiveHint`) per the WebMCP spec, and all `inputSchema`s are standard
JSON Schema objects.

### 8.3 Registration flow

```
app/layout.tsx
  └─ <WebMCPProvider />                         (mounted once, renders null)
       └─ useEffect (mount):
            if (!document.modelContext) return    // feature-detect, safe no-op
            registerTechPulseTools(bridge, controller.signal)
              └─ for each tool in buildTechPulseTools(bridge):
                   await document.modelContext.registerTool(tool, { signal })
       └─ cleanup: controller.abort()             // unregisters all tools
```

The `bridge` object is the only thing `lib/webmcp/tools.ts` needs from the
React app: `listSaved()`, `isSaved()`, `toggleSave()`, `navigate()`. This
keeps the tool layer testable and decoupled from React/Next internals.

---

## 9. Deployment

- Vercel project `ministryof-wizard/techpulse-uk` → https://techpulse-uk.vercel.app (public alias; the per-deployment URL has Vercel's protection screen).
- Redeploy: `npx vercel deploy --prod --yes` from the repo root.
- `next.config.ts`: `images.unoptimized` + `remotePatterns: ['https://**']` (source images come from many arbitrary hosts).
- Vercel Hobby tier — non-commercial use only.

## 10. Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build       # production build (must pass clean)
npm run lint         # ESLint
```

`TECHPULSE_LIVE=off` forces the bundled snapshot dataset (no live fetches).
`TECHPULSE_EVENTBRITE=on` opts back into the Eventbrite source (off by
default — see §3).

---

## 11. Hunt — unified opportunity discovery

Added 2026-09-04. Hunt is a second, independent content pillar — "your
personal radar for everything happening in tech" beyond news/events/
hackathons: awards, volunteering, and (on the roadmap) product launches,
speaking/judging/mentoring opportunities, startup competitions and grants.
Unlike everything above, **Hunt is the first section actually backed by a
database** rather than the live-fetch-and-cache `DataProvider` pattern —
source data is ingested and persisted, not re-fetched per request.

### 11.1 Why a different pattern

News/Events/Hackathons work because their sources are live public APIs/feeds
that are cheap to re-fetch and cache for 30 minutes. Hunt's Phase-1 categories
(Awards, Volunteering) don't have that: per the sourcing rules below, an
aggregator is discovery-only and the *official site* is the source of truth,
so there's no compliant zero-key live feed to poll. Instead, Hunt runs a real
ingestion pipeline against a small set of hand-verified sources and stores
the result, so the admin dashboard's "last synced"/"records"/"errors" are
real, not simulated.

### 11.2 Files (`lib/hunt/`)

| File | Role |
|---|---|
| `types.ts` | `HuntCategory` (8 values — Hackathons/Events deliberately excluded since they have their own sections; `ACTIVE_HUNT_CATEGORIES` = everything except `launch`), `HUNT_CATEGORY_LABEL`, `RawOpportunity` (adapter-facing) and `Opportunity` (normalised, mirrors the Prisma model) interfaces. |
| `adapter.ts` | `SourceAdapter` interface (`name`, `category`, `type`, `enabled`, `fetch/normalize/validate/getSourceUrl`) — every source, in any category, implements this. |
| `sources/manual-*.ts` | One adapter per live category (awards, volunteering, speaking, judging, mentoring, grants, competitions): a small list of real organisations/programmes, each hand-verified against its official page (URLs, and dates where the official site stated one — never guessed; closed cycles are shown honestly as "Closed", not misrepresented as open). `sourceType: "manual"`. |
| `validate.ts` | Required-field/URL/date sanity checks — failures route to `needs_review`, never silently dropped or auto-published. |
| `dedupe.ts` | Exact/normalised source-URL match → organisation+title similarity → title-only similarity (Jaccard over tokens). The first-seen record wins; repeats are skipped. |
| `pipeline.ts` | `runHuntSync(onlySource?)` — orchestrates fetch → normalise → dedupe → validate → AI-enrich → upsert per adapter, and updates that adapter's `DataSource` row. `ingestSingleOpportunity()` — the single-item path for admin manual-adds and accepted user submissions. |
| `queries.ts` | `queryOpportunities(filter)` / `getOpportunity(slug)` / `listNeedsReview()` — Hunt's read side, querying Postgres directly (the DB-backed equivalent of `lib/queries.ts`'s `queryEvents`/`queryHackathons`). |

`lib/prisma.ts` is the one new low-level primitive: a cached `PrismaClient`
singleton, used only by Hunt today.

### 11.3 Data model (`prisma/schema.prisma`)

- **`Opportunity`** — the unified schema (title, type, category[], location
  fields, dates, eligibility flags, `status`, `verificationStatus`,
  `lastVerifiedAt`, `duplicateOf`, `relevanceScore`, …).
- **`DataSource`** — one row per adapter (`name`, `category`, `type`,
  `enabled`, `lastSyncAt`, `recordCount`, `errorCount`, `lastError`). Created
  automatically by `runHuntSync` on a source's first run — no separate seed
  step needed.

Verification states (`VerificationStatusBadge` in `components/badges.tsx`):
✓ Verified · ⚠ Needs Review · 🔴 Expired · ❌ Removed.

### 11.4 Sync

- `POST/GET /api/hunt/sync` — checks `Authorization: Bearer $CRON_SECRET`,
  calls `runHuntSync()`. `vercel.json` points a daily Vercel Cron at it
  (Vercel auto-attaches that header when `CRON_SECRET` is set).
- `POST /api/admin/hunt-sync` — same call, used by the admin panel's
  "Sync now" buttons (per-source and "Sync all"), no secret needed since it
  never leaves the server.
- `runHuntSync` checks each source's **`DataSource.enabled`** flag (not the
  adapter's hardcoded default) once that row exists, so the admin
  enable/disable toggle actually takes effect on the next sync.

### 11.5 AI enrichment & cross-cutting hooks

- `lib/ai/provider.ts`'s heuristic `LlmProvider` gained `classifyOpportunity()`
  — same zero-API-key regex approach as `classifyArticle`, deriving
  category/tags/eligibility from title+description text only (never
  inventing facts).
- `ContentType` (`lib/types.ts`) gained `"opportunity"`, which is all that was
  needed to make `useStore()` bookmarks, the `/saved` dashboard, and the
  WebMCP bridge work for Hunt with no further changes to those systems.
- `globalSearch` (`lib/queries.ts`) also queries `queryOpportunities`,
  degrading to empty (not failing) if the database isn't reachable — same
  fallback philosophy as `lib/provider.ts`.
- WebMCP gained `search_opportunities`; `save_item`/`remove_saved_item`/
  `open_item` now accept `type: "opportunity"` (`open_item` resolves the
  right `/hunt/<category>/<slug>` path via `/api/hunt/resolve/[slug]`, since
  a bare `ContentType` doesn't carry the `HuntCategory`).

### 11.6 Roadmap (not built in Phase 1)

Product Launch Radar (incl. a gated `ProductHuntSourceAdapter` — Product
Hunt's API disallows commercial use without a licensing arrangement),
Speaking/Judging/Mentoring/Startup-Competition adapters, a duplicate
source-count UI ("Found on: ✓ Official ✓ Eventbrite ✓ University"), real
AI match-score personalisation (the `relevanceScore` column already exists),
and a calendar/reminders/opportunity tracker. Documented at the top of
`lib/hunt/pipeline.ts` too.
