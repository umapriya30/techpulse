import { provider } from "@/lib/provider";
import { daysUntil } from "@/lib/utils";
import { REGIONS, regionForCountry } from "@/lib/types";
import type {
  Hackathon,
  NewsArticle,
  SearchResult,
  TechEvent,
} from "@/lib/types";
import { queryOpportunities } from "@/lib/hunt/queries";
import { HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import type { Opportunity } from "@/lib/hunt/types";

/* ----------------------------- News ----------------------------- */

export interface NewsFilter {
  category?: string;
  categories?: string[];
  sources?: string[];
  topic?: string;
  time?: "today" | "week" | "month" | "all";
  format?: "articles" | "research" | "all";
  query?: string;
  trendingOnly?: boolean;
}

export async function queryNews(f: NewsFilter = {}): Promise<NewsArticle[]> {
  let items = await provider.listNews();
  const cats = [
    ...(f.categories ?? []),
    ...(f.category ? [f.category] : []),
  ].map((c) => c.toLowerCase());

  if (cats.length) {
    items = items.filter((n) => cats.includes(n.category.toLowerCase()));
  }
  if (f.sources?.length) {
    const set = new Set(f.sources.map((s) => s.toLowerCase()));
    items = items.filter((n) => set.has(n.source.toLowerCase()));
  }
  if (f.topic) {
    const t = f.topic.toLowerCase();
    items = items.filter(
      (n) =>
        n.tags.some((tag) => tag.toLowerCase().includes(t)) ||
        n.category.toLowerCase().includes(t) ||
        n.subcategory.toLowerCase().includes(t) ||
        n.title.toLowerCase().includes(t),
    );
  }
  if (f.time && f.time !== "all") {
    const maxDays = f.time === "today" ? 1 : f.time === "week" ? 7 : 31;
    items = items.filter((n) => -daysUntil(n.publishedAt) <= maxDays);
  }
  if (f.format === "research")
    items = items.filter((n) => /arxiv|research|paper/i.test(n.source));
  else if (f.format === "articles")
    items = items.filter((n) => !/arxiv/i.test(n.source));
  if (f.trendingOnly) items = items.filter((n) => n.trending);
  if (f.query) items = items.filter((n) => matchesText(f.query!, newsText(n)));
  return items;
}

export async function newsSources(): Promise<string[]> {
  const items = await provider.listNews();
  return [...new Set(items.map((n) => n.source))].sort();
}

/* ----------------------------- Events ----------------------------- */

export interface EventFilter {
  categories?: string[];
  types?: string[];
  location?: string; // "UK" | city | region | "Online" | "Hybrid"
  format?: "online" | "in-person" | "hybrid" | "all";
  date?: "today" | "week" | "month" | "next-month" | "all";
  price?: "free" | "paid" | "u25" | "u50" | "u100" | "all";
  topic?: string;
  query?: string;
  upcomingOnly?: boolean;
}

export async function queryEvents(f: EventFilter = {}): Promise<TechEvent[]> {
  let items = await provider.listEvents();

  if (f.categories?.length) {
    const set = new Set(f.categories.map((c) => c.toLowerCase()));
    items = items.filter((e) =>
      e.categories.some((c) => set.has(c.toLowerCase())),
    );
  }
  if (f.types?.length) {
    const set = new Set(f.types.map((t) => t.toLowerCase()));
    items = items.filter((e) => set.has(e.eventType.toLowerCase()));
  }
  if (f.format && f.format !== "all") {
    items = items.filter((e) => {
      if (f.format === "online") return e.mode === "Online";
      if (f.format === "hybrid") return e.mode === "Hybrid";
      return e.mode === "UK In-Person" || e.mode === "In-Person"; // in-person
    });
  }
  if (f.location && f.location !== "all") {
    const loc = f.location.toLowerCase();
    const knownRegions = new Set(REGIONS.map((r) => r.toLowerCase()));
    items = items.filter((e) => {
      if (loc === "uk") return e.mode === "UK In-Person" || e.mode === "Hybrid";
      if (loc === "online") return e.mode === "Online" || e.mode === "Hybrid";
      if (loc === "hybrid") return e.mode === "Hybrid";
      if (loc === "in-person" || loc === "in person")
        return e.mode !== "Online";
      if (knownRegions.has(loc)) {
        return regionForCountry(e.country).toLowerCase() === loc;
      }
      // treat as a city OR country substring match
      return (
        e.city?.toLowerCase().includes(loc) ||
        e.country?.toLowerCase().includes(loc) ||
        false
      );
    });
  }
  if (f.price && f.price !== "all") {
    items = items.filter((e) => {
      if (f.price === "free") return e.price === 0;
      if (f.price === "paid") return e.price > 0;
      if (f.price === "u25") return e.price < 25;
      if (f.price === "u50") return e.price < 50;
      if (f.price === "u100") return e.price < 100;
      return true;
    });
  }
  if (f.date && f.date !== "all") {
    items = items.filter((e) => withinDate(e.startDate, f.date!));
  }
  if (f.topic) {
    const t = f.topic.toLowerCase();
    items = items.filter(
      (e) =>
        e.topics.some((x) => x.toLowerCase().includes(t)) ||
        e.categories.some((c) => c.toLowerCase().includes(t)) ||
        e.title.toLowerCase().includes(t),
    );
  }
  if (f.upcomingOnly) items = items.filter((e) => daysUntil(e.endDate) >= 0);
  if (f.query) items = items.filter((e) => matchesText(f.query!, eventText(e)));

  // UK first (unless the user explicitly filtered to another region/country),
  // then by soonest start date.
  const ukPinned = !f.location || /uk|united kingdom|online/i.test(f.location);
  return items.sort((a, b) => {
    if (ukPinned) {
      const aUk = isUkEvent(a);
      const bUk = isUkEvent(b);
      if (aUk !== bUk) return aUk ? -1 : 1;
    }
    return +new Date(a.startDate) - +new Date(b.startDate);
  });
}

function isUkEvent(e: TechEvent): boolean {
  return (
    e.mode === "UK In-Person" ||
    /united kingdom|\buk\b|england|scotland|wales|northern ireland/i.test(
      e.country ?? "",
    )
  );
}

/* --------------------------- Hackathons --------------------------- */

export interface HackathonFilter {
  technologies?: string[];
  categories?: string[];
  region?: string; // Region name
  mode?: "online" | "in-person" | "hybrid" | "all";
  deadline?: "soon" | "week" | "month" | "future" | "all";
  prize?: "1k" | "5k" | "10k" | "50k" | "any";
  hasPrize?: boolean;
  difficulty?: string[];
  teamSize?: "solo" | "small" | "large" | "any";
  topic?: string;
  query?: string;
  openOnly?: boolean;
}

export async function queryHackathons(
  f: HackathonFilter = {},
): Promise<Hackathon[]> {
  let items = await provider.listHackathons();

  if (f.technologies?.length) {
    const set = new Set(f.technologies.map((t) => t.toLowerCase()));
    items = items.filter((h) =>
      h.technologies.some((t) => set.has(t.toLowerCase())),
    );
  }
  if (f.categories?.length) {
    const set = new Set(f.categories.map((c) => c.toLowerCase()));
    items = items.filter((h) =>
      h.categories.some((c) => set.has(c.toLowerCase())),
    );
  }
  if (f.region && f.region !== "all") {
    items = items.filter((h) => h.region.toLowerCase() === f.region!.toLowerCase());
  }
  if (f.mode && f.mode !== "all") {
    items = items.filter((h) => {
      if (f.mode === "online") return h.mode === "Online";
      if (f.mode === "hybrid") return h.mode === "Hybrid";
      return h.mode === "In-Person";
    });
  }
  if (f.hasPrize) items = items.filter((h) => h.prizePool > 0);
  if (f.prize && f.prize !== "any") {
    const min =
      f.prize === "1k" ? 1000 : f.prize === "5k" ? 5000 : f.prize === "10k" ? 10000 : 50000;
    items = items.filter((h) => h.prizePool >= min);
  }
  if (f.difficulty?.length) {
    const set = new Set(f.difficulty.map((d) => d.toLowerCase()));
    items = items.filter((h) => set.has(h.difficulty.toLowerCase()));
  }
  if (f.teamSize && f.teamSize !== "any") {
    items = items.filter((h) => {
      if (f.teamSize === "solo") return h.teamMin <= 1;
      if (f.teamSize === "small") return h.teamMax >= 2 && h.teamMax <= 4;
      if (f.teamSize === "large") return h.teamMax >= 5;
      return true;
    });
  }
  if (f.deadline && f.deadline !== "all") {
    items = items.filter((h) => {
      const d = daysUntil(h.registrationDeadline);
      if (d < 0) return false;
      if (f.deadline === "soon") return d <= 3;
      if (f.deadline === "week") return d <= 7;
      if (f.deadline === "month") return d <= 30;
      return d > 30;
    });
  }
  if (f.openOnly) {
    items = items.filter((h) => daysUntil(h.registrationDeadline) >= 0);
  }
  if (f.topic) {
    const t = f.topic.toLowerCase();
    items = items.filter(
      (h) =>
        h.technologies.some((x) => x.toLowerCase().includes(t)) ||
        h.categories.some((c) => c.toLowerCase().includes(t)) ||
        h.title.toLowerCase().includes(t),
    );
  }
  if (f.query) items = items.filter((h) => matchesText(f.query!, hackText(h)));

  // UK first (unless filtered to another region), then AI, then soonest deadline.
  const ukPinned = !f.region || /uk|online/i.test(f.region);
  return items.sort((a, b) => {
    if (ukPinned && (a.region === "UK") !== (b.region === "UK"))
      return a.region === "UK" ? -1 : 1;
    const aAI = a.categories.includes("AI");
    const bAI = b.categories.includes("AI");
    if (aAI !== bAI) return aAI ? -1 : 1;
    return (
      +new Date(a.registrationDeadline) - +new Date(b.registrationDeadline)
    );
  });
}

/* --------------------------- Closing soon --------------------------- */

export interface ClosingItem {
  type: "event" | "hackathon";
  slug: string;
  title: string;
  deadline: string;
  days: number;
  meta: string;
}

export async function closingSoon(maxDays = 30): Promise<ClosingItem[]> {
  const [events, hackathons] = await Promise.all([
    provider.listEvents(),
    provider.listHackathons(),
  ]);
  const out: ClosingItem[] = [];
  for (const e of events) {
    if (!e.registrationDeadline) continue;
    const days = daysUntil(e.registrationDeadline);
    if (days < 0 || days > maxDays) continue;
    out.push({
      type: "event",
      slug: e.slug,
      title: e.title,
      deadline: e.registrationDeadline,
      days,
      meta: `${e.eventType} · ${e.mode === "Online" ? "Online" : e.city ?? "UK"}`,
    });
  }
  for (const h of hackathons) {
    const days = daysUntil(h.registrationDeadline);
    if (days < 0 || days > maxDays) continue;
    out.push({
      type: "hackathon",
      slug: h.slug,
      title: h.title,
      deadline: h.registrationDeadline,
      days,
      meta: `Hackathon · ${h.region}`,
    });
  }
  return out.sort((a, b) => a.days - b.days);
}

/* --------------------------- Trending tech --------------------------- */

export interface TrendingTopic {
  topic: string;
  score: number;
  articles: number;
  events: number;
  hackathons: number;
}

export async function trendingTopics(limit = 6): Promise<TrendingTopic[]> {
  const [news, events, hackathons] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
  ]);
  const tally = new Map<string, TrendingTopic>();
  const bump = (
    raw: string,
    key: "articles" | "events" | "hackathons",
    weight: number,
  ) => {
    const topic = normaliseTopic(raw);
    if (!topic) return;
    const cur =
      tally.get(topic) ??
      { topic, score: 0, articles: 0, events: 0, hackathons: 0 };
    cur.score += weight;
    cur[key] += 1;
    tally.set(topic, cur);
  };
  for (const n of news) {
    n.tags.forEach((t) => bump(t, "articles", n.trending ? 3 : 1.5));
    bump(n.category, "articles", 1);
  }
  for (const e of events) {
    e.topics.forEach((t) => bump(t, "events", 2));
    e.categories.forEach((c) => bump(c, "events", 1));
  }
  for (const h of hackathons) {
    h.technologies.forEach((t) => bump(t, "hackathons", 2.5));
  }
  return [...tally.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const TOPIC_ALIASES: Record<string, string> = {
  ai: "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  llm: "LLMs",
  llms: "LLMs",
  "agentic ai": "Agentic AI",
  "ai agents": "Agentic AI",
  genai: "Generative AI",
  "generative ai": "Generative AI",
  rag: "RAG",
  "machine learning": "Machine Learning",
  ml: "Machine Learning",
  "data engineering": "Data Engineering",
  "data science": "Data Science",
  "ai infrastructure": "AI Infrastructure",
  "developer tools": "Developer Tools",
  "computer vision": "Computer Vision",
  nlp: "NLP",
  cloud: "Cloud",
  cybersecurity: "Cybersecurity",
  robotics: "Robotics",
  "open source": "Open Source",
  startups: "Startups",
};

function normaliseTopic(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (TOPIC_ALIASES[key]) return TOPIC_ALIASES[key];
  if (["software", "web", "typescript", "python", "c++", "ci/cd"].includes(key))
    return null;
  return raw.trim();
}

/* ----------------------------- Search ----------------------------- */

export async function globalSearch(qRaw: string): Promise<SearchResult[]> {
  const q = qRaw.trim();
  if (!q) return [];
  const [news, events, hackathons, opportunities] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
    queryOpportunities({ query: q }).catch((err) => {
      // Hunt is DB-backed (unlike the rest of TechPulse) — if the database
      // isn't configured/reachable yet, degrade to search over everything
      // else rather than breaking search entirely.
      console.warn("[globalSearch] Hunt query failed, omitting from results:", err instanceof Error ? err.message : err);
      return [] as Opportunity[];
    }),
  ]);
  const results: SearchResult[] = [];

  for (const o of opportunities) {
    results.push({
      type: "opportunity",
      id: o.id,
      slug: o.slug,
      title: o.title,
      subtitle: o.description,
      meta: `${HUNT_CATEGORY_LABEL[o.type].emoji} ${HUNT_CATEGORY_LABEL[o.type].label} · ${o.organisation}`,
      href: `/hunt/${o.type}/${o.slug}`,
    });
  }

  for (const n of news) {
    if (matchesText(q, newsText(n))) {
      results.push({
        type: "news",
        id: n.id,
        slug: n.slug,
        title: n.title,
        subtitle: n.summary,
        meta: `${n.source} · ${n.category}`,
      });
    }
  }
  for (const e of events) {
    if (matchesText(q, eventText(e))) {
      results.push({
        type: "event",
        id: e.id,
        slug: e.slug,
        title: e.title,
        subtitle: e.description,
        meta: `${e.eventType} · ${e.mode === "Online" ? "Online" : e.city ?? "UK"}`,
      });
    }
  }
  for (const h of hackathons) {
    if (matchesText(q, hackText(h))) {
      results.push({
        type: "hackathon",
        id: h.id,
        slug: h.slug,
        title: h.title,
        subtitle: h.description,
        meta: `Hackathon · ${h.region}`,
      });
    }
  }
  return results;
}

/* ----------------------------- Helpers ----------------------------- */

function matchesText(query: string, haystack: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const h = haystack.toLowerCase();
  return terms.every((t) => h.includes(t));
}

function newsText(n: NewsArticle) {
  return [n.title, n.summary, n.content, n.source, n.category, n.subcategory, ...n.tags].join(" ");
}
function eventText(e: TechEvent) {
  return [
    e.title,
    e.description,
    e.about,
    e.organizer,
    e.eventType,
    e.city ?? "",
    e.mode,
    ...e.categories,
    ...e.topics,
    ...e.speakers.map((s) => `${s.name} ${s.company}`),
  ].join(" ");
}
function hackText(h: Hackathon) {
  return [
    h.title,
    h.description,
    h.challenge,
    h.organizer,
    h.region,
    h.mode,
    h.city ?? "",
    h.difficulty,
    ...h.categories,
    ...h.technologies,
  ].join(" ");
}

function withinDate(iso: string, bucket: string): boolean {
  const d = daysUntil(iso);
  const now = new Date();
  if (bucket === "today") return d === 0;
  if (bucket === "week") return d >= 0 && d <= 7;
  if (bucket === "month")
    return (
      d >= 0 &&
      new Date(iso).getMonth() === now.getMonth() &&
      new Date(iso).getFullYear() === now.getFullYear()
    );
  if (bucket === "next-month") {
    const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return (
      new Date(iso).getMonth() === nm.getMonth() &&
      new Date(iso).getFullYear() === nm.getFullYear()
    );
  }
  return true;
}
