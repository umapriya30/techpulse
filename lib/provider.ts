import { cache } from "react";
import { unstable_cache } from "next/cache";
import { NEWS as FALLBACK_NEWS } from "@/lib/data/news";
import { EVENTS as FALLBACK_EVENTS } from "@/lib/data/events";
import { HACKATHONS as FALLBACK_HACKATHONS } from "@/lib/data/hackathons";
import { fetchLiveNews } from "@/lib/sources/news";
import { fetchLiveHackathons } from "@/lib/sources/hackathons";
import { fetchLiveEvents } from "@/lib/sources/events";
import type { Hackathon, NewsArticle, TechEvent } from "@/lib/types";

/**
 * Data provider.
 *
 * LIVE by default: news from public RSS/Atom feeds + Google News, hackathons
 * from the Devpost public API, events from Eventbrite public search data.
 * Results are cached (Next fetch cache, ~30–60 min) and de-duplicated per
 * render. If a live source is unreachable, the bundled dataset is used as a
 * fallback so the site never breaks — set TECHPULSE_LIVE=off to force it.
 */

export interface DataProvider {
  listNews(): Promise<NewsArticle[]>;
  getNews(slug: string): Promise<NewsArticle | null>;
  listEvents(): Promise<TechEvent[]>;
  getEvent(slug: string): Promise<TechEvent | null>;
  listHackathons(): Promise<Hackathon[]>;
  getHackathon(slug: string): Promise<Hackathon | null>;
}

const LIVE = process.env.TECHPULSE_LIVE !== "off";

async function withFallback<T>(
  label: string,
  live: () => Promise<T[]>,
  fallback: T[],
): Promise<{ items: T[]; live: boolean }> {
  if (!LIVE) return { items: fallback, live: false };
  try {
    const items = await live();
    if (items.length) return { items, live: true };
    throw new Error("empty");
  } catch (err) {
    console.warn(
      `[provider] live ${label} failed, using fallback:`,
      err instanceof Error ? err.message : err,
    );
    return { items: fallback, live: false };
  }
}

// unstable_cache stores the *parsed, filtered* result (small) with a 30-min TTL,
// so heavy work (4 MB event feed, RSS parsing, AI classification) runs at most
// once per window. `cache()` then dedupes within a single render.
// Bump CACHE_VERSION whenever the item shape changes so a new deploy doesn't
// serve the previous deploy's stale Data Cache entries.
const REVALIDATE = 1800;
const CACHE_VERSION = "v4-ukh";

const cachedNews = unstable_cache(
  async () => {
    const { items } = await withFallback("news", fetchLiveNews, FALLBACK_NEWS);
    return items;
  },
  [`techpulse:news:${CACHE_VERSION}`],
  { revalidate: REVALIDATE, tags: ["news"] },
);

const cachedEvents = unstable_cache(
  async () => {
    const { items } = await withFallback("events", fetchLiveEvents, FALLBACK_EVENTS);
    return items;
  },
  [`techpulse:events:${CACHE_VERSION}`],
  { revalidate: REVALIDATE, tags: ["events"] },
);

const cachedHackathons = unstable_cache(
  async () => {
    const { items } = await withFallback(
      "hackathons",
      fetchLiveHackathons,
      FALLBACK_HACKATHONS,
    );
    return items;
  },
  [`techpulse:hackathons:${CACHE_VERSION}`],
  { revalidate: REVALIDATE, tags: ["hackathons"] },
);

const loadNews = cache(async () => {
  const items = await cachedNews();
  return [...items].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );
});

const loadEvents = cache(async () => {
  const items = await cachedEvents();
  return [...items].sort(
    (a, b) => +new Date(a.startDate) - +new Date(b.startDate),
  );
});

const loadHackathons = cache(async () => {
  const items = await cachedHackathons();
  return [...items].sort(
    (a, b) =>
      +new Date(a.registrationDeadline) - +new Date(b.registrationDeadline),
  );
});

class LiveProvider implements DataProvider {
  listNews = loadNews;
  listEvents = loadEvents;
  listHackathons = loadHackathons;

  async getNews(slug: string) {
    return (await loadNews()).find((n) => n.slug === slug) ?? null;
  }
  async getEvent(slug: string) {
    return (await loadEvents()).find((e) => e.slug === slug) ?? null;
  }
  async getHackathon(slug: string) {
    return (await loadHackathons()).find((h) => h.slug === slug) ?? null;
  }
}

export const provider: DataProvider = new LiveProvider();

/** Whether the running instance is serving live data (for UI badges). */
export async function dataStatus() {
  const [news, events, hackathons] = await Promise.all([
    LIVE ? fetchLiveNews().then(() => true).catch(() => false) : Promise.resolve(false),
    LIVE ? fetchLiveEvents().then(() => true).catch(() => false) : Promise.resolve(false),
    LIVE ? fetchLiveHackathons().then(() => true).catch(() => false) : Promise.resolve(false),
  ]);
  return { news, events, hackathons };
}
