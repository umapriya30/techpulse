import {
  queryEvents,
  queryHackathons,
  queryNews,
  trendingTopics,
  closingSoon,
} from "@/lib/queries";
import { daysUntil, deadlineState, formatDate, formatMoney } from "@/lib/utils";
import { parseQuery, type ParsedQuery } from "@/lib/assistant/parse";

export interface AssistantResult {
  type: "news" | "event" | "hackathon" | "topic";
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}

export interface AssistantAnswer {
  reply: string;
  results: AssistantResult[];
  intent: string;
  suggestions: string[];
}

const SUGGESTIONS = [
  "Hackathons closing this week",
  "AI events in London next month",
  "Latest LLM news",
  "Free online data science events",
  "Hackathons with £10k+ prize",
  "What's trending in tech?",
];

export async function answer(message: string): Promise<AssistantAnswer> {
  const q = parseQuery(message);

  if (q.intent === "greeting") {
    return {
      reply:
        "Hi! I'm the TechPulse assistant. Ask me about tech news, UK & online events, or AI hackathons — try “hackathons closing today”, “AI conferences in London next month”, or “latest LLM news”.",
      results: [],
      intent: "greeting",
      suggestions: SUGGESTIONS,
    };
  }

  if (q.intent === "help") {
    return {
      reply:
        "I search live data across three areas:\n• 📰 Tech news (The Verge, Ars Technica, WIRED, Google News)\n• 🎤 Events (UK + online conferences, meetups, workshops)\n• 🏆 Hackathons (Devpost)\n\nYou can filter by topic (AI, LLM, data, cloud, security…), location (London, Manchester, online…), time (today, this week, next month) and deadline. Try one of the suggestions below.",
      results: [],
      intent: "help",
      suggestions: SUGGESTIONS,
    };
  }

  if (q.intent === "trending") {
    const topics = await trendingTopics(6);
    return {
      reply: `Here's what's trending across news, events and hackathons right now:\n${topics
        .map((t, i) => `${i + 1}. ${t.topic} — ${t.articles} articles, ${t.events} events, ${t.hackathons} hackathons`)
        .join("\n")}`,
      results: topics.map((t) => ({
        type: "topic" as const,
        title: t.topic,
        subtitle: `${t.articles} articles · ${t.events} events · ${t.hackathons} hackathons`,
        meta: "Trending",
        href: `/search?q=${encodeURIComponent(t.topic)}`,
      })),
      intent: "trending",
      suggestions: SUGGESTIONS,
    };
  }

  if (q.intent === "closing") {
    return closingAnswer(q);
  }

  const wantNews = q.types.includes("news") || q.intent === "news" || q.intent === "mixed";
  const wantEvents = q.types.includes("event") || q.intent === "events" || q.intent === "mixed";
  const wantHack =
    q.types.includes("hackathon") || q.intent === "hackathons" || q.intent === "mixed";

  const blocks: string[] = [];
  const results: AssistantResult[] = [];

  if (wantHack) {
    const h = await runHackathons(q);
    results.push(...h.results);
    blocks.push(h.line);
  }
  if (wantEvents) {
    const e = await runEvents(q);
    results.push(...e.results);
    blocks.push(e.line);
  }
  if (wantNews) {
    const n = await runNews(q);
    results.push(...n.results);
    blocks.push(n.line);
  }

  const filterBits = describeFilters(q);
  let reply = blocks.filter(Boolean).join("\n");
  if (!reply) {
    reply = `I couldn't find anything matching ${filterBits || "that"}. Try broadening the topic, location or time range.`;
  } else if (filterBits) {
    reply = `Results for ${filterBits}:\n${reply}`;
  }

  return {
    reply,
    results: results.slice(0, 12),
    intent: q.intent,
    suggestions: SUGGESTIONS,
  };
}

/* ------------------------------ runners ------------------------------ */

async function runHackathons(q: ParsedQuery) {
  const REGION_NAMES = [
    "Online",
    "UK",
    "Europe",
    "North America",
    "Asia",
    "Middle East",
    "Africa",
    "Oceania",
    "South America",
    "Global",
  ];
  let items = await queryHackathons({
    topic: q.topics[0],
    region:
      q.location && REGION_NAMES.includes(q.location) ? q.location : undefined,
    prize:
      q.minPrize && q.minPrize >= 50000
        ? "50k"
        : q.minPrize && q.minPrize >= 10000
          ? "10k"
          : q.minPrize && q.minPrize >= 5000
            ? "5k"
            : q.minPrize
              ? "1k"
              : undefined,
    deadline:
      q.deadlineWindow === "3days"
        ? "soon"
        : q.deadlineWindow === "week"
          ? "week"
          : q.deadlineWindow === "month"
            ? "month"
            : undefined,
    openOnly: true,
  });
  if (q.topics.length > 1) {
    items = items.filter((h) =>
      q.topics.some((t) =>
        [...h.technologies, ...h.categories].some((x) =>
          x.toLowerCase().includes(t.toLowerCase()),
        ),
      ),
    );
  }
  if (q.deadlineWindow === "today") {
    items = items.filter((h) => daysUntil(h.registrationDeadline) === 0);
  }
  const results = items.slice(0, 6).map((h) => ({
    type: "hackathon" as const,
    title: h.title,
    subtitle: `${deadlineState(h.registrationDeadline).label} · deadline ${formatDate(h.registrationDeadline)}`,
    meta:
      h.prizePool > 0
        ? `${formatMoney(h.prizePool, h.currency)} · ${h.region}`
        : h.region,
    href: `/hackathons/${h.slug}`,
  }));
  const line = items.length
    ? `🏆 ${items.length} hackathon${items.length === 1 ? "" : "s"} — showing ${results.length}.`
    : q.wantsCount
      ? "🏆 0 hackathons match."
      : "";
  return { results, line, count: items.length };
}

async function runEvents(q: ParsedQuery) {
  const items = await queryEvents({
    topic: q.topics[0],
    categories: q.topics.filter((t) =>
      ["AI", "Data", "LLM", "Cloud", "Cybersecurity", "Robotics", "Software", "Startups"].includes(t),
    ),
    location: q.location ?? undefined,
    date:
      q.timeframe === "today"
        ? "today"
        : q.timeframe === "week"
          ? "week"
          : q.timeframe === "month"
            ? "month"
            : q.timeframe === "next-month"
              ? "next-month"
              : undefined,
    price: q.price === "free" ? "free" : q.price === "paid" ? "paid" : undefined,
    upcomingOnly: true,
  });
  const results = items.slice(0, 6).map((e) => ({
    type: "event" as const,
    title: e.title,
    subtitle: `${formatDate(e.startDate)} · ${e.mode === "Online" ? "Online" : e.city ?? "UK"}`,
    meta: `${e.eventType}${e.price === 0 ? " · Free" : ""}`,
    href: `/events/${e.slug}`,
  }));
  const line = items.length
    ? `🎤 ${items.length} event${items.length === 1 ? "" : "s"} — showing ${results.length}.`
    : q.wantsCount
      ? "🎤 0 events match."
      : "";
  return { results, line, count: items.length };
}

async function runNews(q: ParsedQuery) {
  const items = await queryNews({
    topic: q.topics[0],
    time:
      q.timeframe === "today"
        ? "today"
        : q.timeframe === "week"
          ? "week"
          : q.timeframe === "month"
            ? "month"
            : undefined,
  });
  const results = items.slice(0, 6).map((n) => ({
    type: "news" as const,
    title: n.title,
    subtitle: n.summary.slice(0, 120),
    meta: `${n.source} · ${n.category}`,
    href: `/news/${n.slug}`,
  }));
  const line = items.length
    ? `📰 ${items.length} article${items.length === 1 ? "" : "s"} — showing ${results.length}.`
    : q.wantsCount
      ? "📰 0 articles match."
      : "";
  return { results, line, count: items.length };
}

async function closingAnswer(q: ParsedQuery): Promise<AssistantAnswer> {
  const windowDays =
    q.deadlineWindow === "today"
      ? 0
      : q.deadlineWindow === "3days"
        ? 3
        : q.deadlineWindow === "week"
          ? 7
          : 30;
  let items = await closingSoon(Math.max(windowDays, 30));
  if (q.deadlineWindow === "today") items = items.filter((i) => i.days === 0);
  else items = items.filter((i) => i.days <= windowDays);

  if (q.types.includes("hackathon") && !q.types.includes("event"))
    items = items.filter((i) => i.type === "hackathon");
  if (q.types.includes("event") && !q.types.includes("hackathon"))
    items = items.filter((i) => i.type === "event");

  const label =
    q.deadlineWindow === "today"
      ? "closing today"
      : q.deadlineWindow === "3days"
        ? "closing within 3 days"
        : q.deadlineWindow === "week"
          ? "closing this week"
          : "closing within 30 days";

  return {
    reply: items.length
      ? `⏰ ${items.length} thing${items.length === 1 ? "" : "s"} ${label}:`
      : `Nothing is ${label} right now. Ask me for “closing this month” to widen the window.`,
    results: items.slice(0, 10).map((i) => ({
      type: i.type,
      title: i.title,
      subtitle: `${i.meta} · deadline ${formatDate(i.deadline)}`,
      meta: i.days === 0 ? "Closes today 🔴" : `${i.days} day${i.days === 1 ? "" : "s"} left`,
      href: `/${i.type === "event" ? "events" : "hackathons"}/${i.slug}`,
    })),
    intent: "closing",
    suggestions: SUGGESTIONS,
  };
}

function describeFilters(q: ParsedQuery): string {
  const bits: string[] = [];
  if (q.topics.length) bits.push(q.topics.join(" + "));
  if (q.location) bits.push(`in ${q.location}`);
  if (q.timeframe === "today") bits.push("today");
  else if (q.timeframe === "week") bits.push("this week");
  else if (q.timeframe === "month") bits.push("this month");
  else if (q.timeframe === "next-month") bits.push("next month");
  if (q.price === "free") bits.push("free");
  if (q.minPrize) bits.push(`prize ≥ ${formatMoney(q.minPrize)}`);
  return bits.join(", ");
}
