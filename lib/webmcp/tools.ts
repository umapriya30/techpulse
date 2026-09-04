/**
 * TECHPULSE's WebMCP tool layer.
 *
 * This registers a set of `document.modelContext` tools that let an AI agent
 * (ChatGPT's in-app browser, or Chrome with `chrome://flags/#enable-webmcp-testing`)
 * search news/events/hackathons, ask the site's own assistant, save items for
 * the signed-in browser, and drive navigation — all without scraping the DOM.
 *
 * Registration happens client-side in <WebMCPProvider> (components/webmcp-provider.tsx),
 * which is mounted once in app/layout.tsx. This module only *describes* the
 * tools; it has no React/Next dependency so it's easy to unit-test or reuse
 * from a future dedicated MCP server.
 */

import type { ContentType } from "@/lib/types";
import type { ModelContextTool } from "@/lib/webmcp/types";

/** The subset of app/providers.tsx's `useStore()` the tools need. */
export interface WebMCPBridge {
  listSaved: () => { type: ContentType; slug: string; savedAt: string }[];
  isSaved: (type: ContentType, slug: string) => boolean;
  toggleSave: (type: ContentType, slug: string) => void;
  /** Client-side navigation so a human watching the tab sees the agent move. */
  navigate: (href: string) => void;
}

const PATH: Record<ContentType, string> = {
  news: "/news",
  event: "/events",
  hackathon: "/hackathons",
  // Unused directly — a HuntCategory segment sits between /hunt and the slug,
  // so open_item resolves opportunity hrefs via /api/hunt/resolve instead.
  opportunity: "/hunt",
};

function text(payload: unknown): string {
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* -------------------------------------------------------------------------- */
/*  Trimmed shapes — keep tool output small and legible for a model's context. */
/* -------------------------------------------------------------------------- */

interface RawNews {
  slug: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  trending: boolean;
}
interface RawEvent {
  slug: string;
  title: string;
  description: string;
  eventType: string;
  mode: string;
  city: string | null;
  country: string;
  startDate: string;
  price: number;
  registrationDeadline?: string;
}
interface RawHackathon {
  slug: string;
  title: string;
  description: string;
  mode: string;
  region: string;
  prizePool: number;
  currency: string;
  registrationDeadline: string;
  difficulty: string;
}
interface RawOpportunity {
  slug: string;
  title: string;
  type: string;
  category: string[];
  description: string;
  organisation: string;
  city: string | null;
  country: string | null;
  remote: boolean;
  deadline: string | null;
  free: boolean;
  prize: string | null;
  verificationStatus: string;
}

const trimNews = (n: RawNews) => ({
  slug: n.slug,
  url: `/news/${n.slug}`,
  title: n.title,
  summary: n.summary,
  source: n.source,
  category: n.category,
  publishedAt: n.publishedAt,
  trending: n.trending,
});

const trimEvent = (e: RawEvent) => ({
  slug: e.slug,
  url: `/events/${e.slug}`,
  title: e.title,
  description: e.description,
  type: e.eventType,
  mode: e.mode,
  location: e.city ?? e.country,
  startDate: e.startDate,
  price: e.price,
  registrationDeadline: e.registrationDeadline,
});

const trimHackathon = (h: RawHackathon) => ({
  slug: h.slug,
  url: `/hackathons/${h.slug}`,
  title: h.title,
  description: h.description,
  mode: h.mode,
  region: h.region,
  prize: h.prizePool ? `${h.currency} ${h.prizePool.toLocaleString()}` : "No cash prize",
  registrationDeadline: h.registrationDeadline,
  difficulty: h.difficulty,
});

const trimOpportunity = (o: RawOpportunity) => ({
  slug: o.slug,
  url: `/hunt/${o.type}/${o.slug}`,
  title: o.title,
  type: o.type,
  category: o.category,
  description: o.description,
  organisation: o.organisation,
  location: o.remote ? "Remote" : o.city ?? o.country ?? "Unspecified",
  deadline: o.deadline,
  free: o.free,
  prize: o.prize,
  verification: o.verificationStatus,
});

/* -------------------------------------------------------------------------- */
/*  Tool definitions                                                          */
/* -------------------------------------------------------------------------- */

export function buildTechPulseTools(bridge: WebMCPBridge): ModelContextTool[] {
  return [
    {
      name: "search_news",
      description:
        "Search TECHPULSE's live tech/AI/data news feed (30+ RSS sources + arXiv). Use for questions like " +
        "'what's new in AI agents' or 'show me research papers from this week'.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search, e.g. 'agentic AI' or 'OpenAI'." },
          topic: { type: "string", description: "Narrow by topic/tag, e.g. 'LLMs', 'Robotics'." },
          time: {
            type: "string",
            enum: ["today", "week", "month", "all"],
            description: "How recent. Defaults to 'all'.",
          },
          trendingOnly: { type: "boolean", description: "Only return currently-trending stories." },
          limit: { type: "number", description: "Max results, default 8, max 25." },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query, topic, time, trendingOnly, limit }, { signal }) => {
        const n = Math.min(Number(limit) || 8, 25);
        const data = await getJSON<{ items: RawNews[]; total: number }>(
          `/api/news${qs({
            q: query as string | undefined,
            topic: topic as string | undefined,
            time: time as string | undefined,
            trending: trendingOnly ? "true" : undefined,
            perPage: n,
          })}`,
          signal,
        );
        return text({ total: data.total, results: data.items.slice(0, n).map(trimNews) });
      },
    },

    {
      name: "search_events",
      description:
        "Search TECHPULSE's live tech events/conferences/meetups/webinars (UK-first, worldwide coverage). " +
        "Use for 'AI conferences in London next month' style questions.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search." },
          topic: { type: "string", description: "e.g. 'Generative AI', 'Cybersecurity'." },
          location: {
            type: "string",
            description: "City, country, region (e.g. 'UK', 'Europe'), or 'online'/'in-person'/'hybrid'.",
          },
          date: {
            type: "string",
            enum: ["today", "week", "month", "next-month", "all"],
          },
          price: { type: "string", enum: ["free", "paid", "u25", "u50", "u100", "all"] },
          limit: { type: "number", description: "Max results, default 8, max 25." },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query, topic, location, date, price, limit }, { signal }) => {
        const n = Math.min(Number(limit) || 8, 25);
        const data = await getJSON<{ items: RawEvent[]; total: number }>(
          `/api/events${qs({
            q: query as string | undefined,
            topic: topic as string | undefined,
            location: location as string | undefined,
            date: date as string | undefined,
            price: price as string | undefined,
            perPage: n,
          })}`,
          signal,
        );
        return text({ total: data.total, results: data.items.slice(0, n).map(trimEvent) });
      },
    },

    {
      name: "search_hackathons",
      description:
        "Search TECHPULSE's live hackathon listings (Devpost + UK hackathon community, cash prizes, deadlines). " +
        "Use for 'AI hackathons closing this week' or 'hackathons with $10k+ prizes'.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search." },
          topic: { type: "string", description: "Technology/category, e.g. 'LLMs', 'Web'." },
          region: {
            type: "string",
            description: "e.g. 'UK', 'Europe', 'North America', 'Online', 'Global'.",
          },
          mode: { type: "string", enum: ["online", "in-person", "hybrid", "all"] },
          deadline: {
            type: "string",
            enum: ["soon", "week", "month", "future", "all"],
            description: "How soon registration closes. 'soon' = within 3 days.",
          },
          prize: { type: "string", enum: ["1k", "5k", "10k", "50k", "any"] },
          limit: { type: "number", description: "Max results, default 8, max 25." },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query, topic, region, mode, deadline, prize, limit }, { signal }) => {
        const n = Math.min(Number(limit) || 8, 25);
        const data = await getJSON<{ items: RawHackathon[]; total: number }>(
          `/api/hackathons${qs({
            q: query as string | undefined,
            topic: topic as string | undefined,
            region: region as string | undefined,
            mode: mode as string | undefined,
            deadline: deadline as string | undefined,
            prize: prize as string | undefined,
            perPage: n,
          })}`,
          signal,
        );
        return text({ total: data.total, results: data.items.slice(0, n).map(trimHackathon) });
      },
    },

    {
      name: "search_opportunities",
      description:
        "Search TECHPULSE Hunt — awards, volunteering and other tech opportunities beyond news/events/hackathons " +
        "(more categories are on the roadmap). Use for 'tech awards I can enter' or 'volunteering for developers'.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search." },
          type: { type: "string", enum: ["award", "volunteering"], description: "Hunt category." },
          location: { type: "string", description: "City, country, 'remote' or 'hybrid'." },
          deadline: { type: "string", enum: ["soon", "week", "month", "future", "all"] },
          free: { type: "boolean", description: "Only free-to-enter/apply opportunities." },
          eligibility: { type: "string", enum: ["student", "graduate", "professional", "founder"] },
          limit: { type: "number", description: "Max results, default 8, max 25." },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query, type, location, deadline, free, eligibility, limit }, { signal }) => {
        const n = Math.min(Number(limit) || 8, 25);
        const data = await getJSON<{ items: RawOpportunity[]; total: number }>(
          `/api/hunt${qs({
            q: query as string | undefined,
            type: type as string | undefined,
            location: location as string | undefined,
            deadline: deadline as string | undefined,
            free: free as boolean | undefined,
            eligibility: eligibility as string | undefined,
            perPage: n,
          })}`,
          signal,
        );
        return text({ total: data.total, results: data.items.slice(0, n).map(trimOpportunity) });
      },
    },

    {
      name: "global_search",
      description:
        "Search across everything on TECHPULSE (news, events, hackathons and Hunt opportunities) at once. Good " +
        "first tool for a vague query like 'anything about AI agents happening soon'.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          type: {
            type: "string",
            enum: ["news", "event", "hackathon", "opportunity"],
            description: "Optionally restrict to one type.",
          },
          limit: { type: "number", description: "Max results, default 10, max 30." },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query, type, limit }, { signal }) => {
        const n = Math.min(Number(limit) || 10, 30);
        const data = await getJSON(
          `/api/search${qs({ q: query as string, type: type as string | undefined, limit: n })}`,
          signal,
        );
        return text(data);
      },
    },

    {
      name: "get_trending_and_closing_soon",
      description:
        "Get right-now trending tech topics plus events/hackathons whose registration closes within 14 days. " +
        "Use for 'what's hot right now' or 'what am I about to miss'.",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number", description: "Number of trending topics, default 6." } },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ limit }, { signal }) => {
        const data = await getJSON(`/api/trending${qs({ limit: limit as number | undefined })}`, signal);
        return text(data);
      },
    },

    {
      name: "ask_techpulse_assistant",
      description:
        "Ask TECHPULSE's own natural-language assistant a free-form question ('what's closing soonest?', " +
        "'any free events in Manchester?'). Use when the structured search tools don't map cleanly to the question.",
      inputSchema: {
        type: "object",
        properties: { message: { type: "string", description: "The question, in plain English." } },
        required: ["message"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ message }, { signal }) => {
        const res = await fetch("/api/assistant", {
          method: "POST",
          signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message }),
        });
        return text(await res.json());
      },
    },

    {
      name: "list_saved_items",
      description: "List the items (news/events/hackathons/Hunt opportunities) the current visitor has saved/bookmarked on this device.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => text({ saved: bridge.listSaved() }),
    },

    {
      name: "save_item",
      description:
        "Save (bookmark) a news article, event, hackathon or Hunt opportunity for the current visitor, by its " +
        "content type and slug (get the slug from a search tool's `slug` field first).",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["news", "event", "hackathon", "opportunity"] },
          slug: { type: "string" },
        },
        required: ["type", "slug"],
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
      execute: async ({ type, slug }) => {
        const t = type as ContentType;
        const s = String(slug);
        if (!bridge.isSaved(t, s)) bridge.toggleSave(t, s);
        return `Saved ${t} "${s}".`;
      },
    },

    {
      name: "remove_saved_item",
      description: "Remove a previously saved item by content type and slug.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["news", "event", "hackathon", "opportunity"] },
          slug: { type: "string" },
        },
        required: ["type", "slug"],
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
      execute: async ({ type, slug }) => {
        const t = type as ContentType;
        const s = String(slug);
        if (bridge.isSaved(t, s)) bridge.toggleSave(t, s);
        return `Removed ${t} "${s}" from saved items.`;
      },
    },

    {
      name: "open_item",
      description:
        "Navigate the visitor's browser tab to a news article, event, hackathon or Hunt opportunity's detail " +
        "page, by content type and slug. Use this so the human watching can see what the agent found, or to hand " +
        "off a signup flow (e.g. hackathon registration) that needs a human to complete.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["news", "event", "hackathon", "opportunity"] },
          slug: { type: "string" },
        },
        required: ["type", "slug"],
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
      execute: async ({ type, slug }) => {
        const t = type as ContentType;
        const s = String(slug);
        let href: string;
        if (t === "opportunity") {
          // A HuntCategory segment sits between /hunt and the slug — resolve it first.
          const res = await fetch(`/api/hunt/resolve/${encodeURIComponent(s)}`, {
            headers: { accept: "application/json" },
          });
          if (!res.ok) throw new Error(`Could not find opportunity "${s}"`);
          ({ href } = (await res.json()) as { href: string });
        } else {
          href = `${PATH[t]}/${s}`;
        }
        bridge.navigate(href);
        return `Opened ${href}`;
      },
    },
  ];
}

/**
 * Registers every TECHPULSE tool with the browser's WebMCP runtime.
 * No-ops (and resolves immediately) if `document.modelContext` isn't present,
 * so this is always safe to call.
 */
export async function registerTechPulseTools(
  bridge: WebMCPBridge,
  signal: AbortSignal,
): Promise<void> {
  if (typeof document === "undefined" || !document.modelContext) return;
  const mc = document.modelContext;
  for (const tool of buildTechPulseTools(bridge)) {
    if (signal.aborted) return;
    await mc.registerTool(tool, { signal });
  }
}
