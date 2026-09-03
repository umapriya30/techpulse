# TECHPULSE 🚀

**"Stay Ahead. Build. Learn. Connect."**

**Live: https://techpulse-uk.vercel.app**

A UK-focused discovery platform for **tech news**, **tech events** and **AI hackathons** — everything happening in Tech, AI & Data in one place.

> If TechCrunch + Eventbrite + Devpost had a UK-focused AI/Data discovery platform.

---

## Quick start

```bash
npm install
npm run dev
# http://localhost:3000
```

The app runs with **no configuration, no database and no API keys** and serves
**live data** out of the box:

| Section | Live source | Refresh |
| --- | --- | --- |
| News | 30+ RSS/Atom feeds — press (The Verge, Ars Technica, WIRED, MIT Tech Review, VentureBeat, TechRadar, Engadget, InfoQ), labs (OpenAI, DeepMind, Google Research, Hugging Face, NVIDIA, AWS, Google Cloud, GitHub, BAIR, Import AI), data (KDnuggets, Analytics Vidhya, DEV), arXiv cs.AI/LG/CL — + Google News topic searches | ~30 min |
| Hackathons | Devpost public hackathons API — 7 queries, AI/ML/LLM/GenAI/data filtered | ~30 min |
| Events | developers.events + confs.tech open datasets + Eventbrite public search | ~30 min |

Feed list lives in `lib/sources/news.ts` (`FEEDS`), `lib/sources/devpost.ts` (`ENDPOINTS`), `lib/sources/events.ts`.

Every card links to its official source. If a source is briefly unreachable the
app falls back to a bundled snapshot (`lib/data/*`). Force the snapshot with
`TECHPULSE_LIVE=off`.

```bash
npm run build   # production build
npm start       # serve the build
npm run lint
```

---

## What's implemented

| Area | Status |
| --- | --- |
| Homepage (hero, trending topics, trending news, events, hackathons, closing soon, trending tech, newsletter) | ✅ |
| Tech News — list, filters (category / time / source), topic chips, detail pages with JSON-LD | ✅ |
| Events — list, filters (location / category / type / date / price), detail pages (speakers, schedule, add-to-calendar, Event schema) | ✅ |
| Hackathons — list, filters (technology / region / deadline / prize / difficulty / team size), detail pages (challenge, prizes, key dates), live deadline countdown | ✅ |
| Global search (`/search` + instant dropdown) across all three content types | ✅ |
| **⌘K command palette** — navigate, jump to topics, run quick filters, live search, switch theme | ✅ |
| **TechPulse Assistant** — floating chat widget + `POST /api/assistant`; natural-language queries like "hackathons closing this week", "AI events in London next month", "hackathons with £10k+ prize", "latest LLM news" → answers + linked result cards | ✅ |
| **Cover imagery** — real photo from the source; relevant topic image when there isn't one; gradient as last resort. Blur-backdrop `object-contain` on detail heroes so nothing is cropped | ✅ |
| Animated live-count stat band on the homepage; reading-progress bar on articles | ✅ |
| Bookmarking + "My TechPulse" dashboard (saved items, calendar, upcoming deadlines) | ✅ |
| Personalisation (interests + locations) and "Why you might like this" | ✅ |
| Notifications (bell + feed) | ✅ |
| Lightweight auth (local session) with sign-in modal | ✅ |
| Admin dashboard (metrics, content management, verification toggles, submission queue) | ✅ |
| Event / hackathon submission form with pending-verification workflow | ✅ |
| Newsletter subscribe endpoint | ✅ |
| REST API layer (`/api/news`, `/api/events`, `/api/hackathons`, `/api/search`, `/api/trending`, `/api/bookmarks`, `/api/submissions`, `/api/newsletter`, `/api/ingest/preview`) | ✅ |
| AI ingestion pipeline (normalise → dedupe → classify → summarise → topics → trending) with a swappable LLM layer | ✅ (heuristic provider) |
| Prisma schema + seed script for PostgreSQL | ✅ |
| Dark / light / system theme, responsive (mobile bottom-nav), skeletons, empty states, 404 | ✅ |
| SEO (metadata, canonical, OG, sitemap, robots, structured data) | ✅ |
| Baseline security (rate-limited API, security headers, zod validation) | ✅ |

---

## Architecture

```
app/                 Next.js App Router pages + API routes
  api/               REST endpoints (thin wrappers over lib/queries)
components/           ~30 reusable components (cards, grids, filters, badges, actions…)
lib/
  types.ts           Domain model
  data/              Sample dataset (news, events, hackathons)
  provider.ts        DataProvider interface + MockProvider (swap for PrismaProvider)
  queries.ts         Filtering, search, trending, "closing soon"
  ai/
    provider.ts      LlmProvider interface + heuristic classifier (no API key)
    ingest.ts        News ingestion pipeline
  utils.ts           Dates, deadlines, calendar links, formatting
prisma/
  schema.prisma      PostgreSQL schema (users, news, events, hackathons, bookmarks…)
  seed.ts            Loads the sample dataset into the DB
middleware.ts        API rate limiting + security headers
```

### Swapping in a real backend

1. `DATABASE_URL=... npx prisma db push && npm run seed`
2. Implement `PrismaProvider` against the `DataProvider` interface.
3. Change one line in `lib/provider.ts`.

The UI never imports data directly — only `lib/provider` and `lib/queries` — so no
component changes are required.

### Data ingestion (production)

Scheduled jobs (cron / serverless) every 1–3 hours:

```
RSS / official APIs → normalise → dedupe → AI classify → AI summarise
→ extract topics → detect trending → store (via DataProvider)
```

`GET /api/ingest/preview` runs the pipeline on sample raw items and shows the output.
Point the LLM layer at a real model by implementing `LlmProvider` and returning it
from `getLlm()`.

---

## Data quality

TechPulse never invents event dates, deadlines, prize amounts, speakers or
registration URLs. Every event and hackathon links to its official source and is
labelled **Verified source ✓** or **Information not verified**. The sample dataset
uses real organiser/platform domains (Devpost, Kaggle, Meetup, Eventbrite, MLH,
CNCF, Luma) with illustrative specifics for demonstration.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react ·
next-themes · Zod · Prisma (schema) · PostgreSQL (target).
