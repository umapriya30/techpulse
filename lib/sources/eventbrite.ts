import type { TechEvent, EventType } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Live events from Eventbrite public search pages.
 *
 * Eventbrite embeds its search results as a JSON payload (`window.__SERVER_DATA__`)
 * in the page HTML — the same data shown to every visitor. We read that payload,
 * normalise it, cache it for an hour and link every event back to Eventbrite.
 * For high-volume or commercial use, switch to the official Eventbrite API token.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

const SEARCHES: { url: string; color: string; country: string }[] = [
  { url: "https://www.eventbrite.co.uk/d/united-kingdom--london/artificial-intelligence/", color: "violet", country: "United Kingdom" },
  { url: "https://www.eventbrite.co.uk/d/united-kingdom--manchester/technology/", color: "blue", country: "United Kingdom" },
  { url: "https://www.eventbrite.com/d/online/data-science/", color: "emerald", country: "Online" },
  { url: "https://www.eventbrite.com/d/ny--new-york/artificial-intelligence/", color: "indigo", country: "United States" },
  { url: "https://www.eventbrite.com/d/ca--san-francisco/artificial-intelligence/", color: "rose", country: "United States" },
  { url: "https://www.eventbrite.com/d/germany--berlin/technology/", color: "amber", country: "Germany" },
  { url: "https://www.eventbrite.com/d/india--bengaluru/artificial-intelligence/", color: "lime", country: "India" },
  { url: "https://www.eventbrite.com/d/singapore--singapore/technology/", color: "slate", country: "Singapore" },
  { url: "https://www.eventbrite.com/d/online/machine-learning/", color: "violet", country: "Online" },
];

interface EbVenue {
  name?: string;
  address?: { city?: string; region?: string; localized_address_display?: string };
}
interface EbEvent {
  name?: string;
  summary?: string;
  url?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  is_online_event?: boolean;
  is_free?: boolean;
  primary_venue?: EbVenue;
  image?: { url?: string; original?: { url?: string } };
  ticket_availability?: { minimum_ticket_price?: { major_value?: string; currency?: string } };
  tags?: { display_name?: string }[];
}

/** Extract the first balanced {...} object after `window.__SERVER_DATA__`. */
function extractServerData(html: string): unknown | null {
  const start = html.indexOf("window.__SERVER_DATA__");
  if (start === -1) return null;
  const b = html.indexOf("{", start);
  if (b === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = b; i < html.length; i++) {
    const c = html[i];
    if (esc) {
      esc = false;
    } else if (c === "\\") {
      esc = true;
    } else if (c === '"') {
      inStr = !inStr;
    } else if (!inStr) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(b, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function findEventResults(data: unknown): EbEvent[] {
  let found: EbEvent[] = [];
  const visit = (o: unknown) => {
    if (found.length) return;
    if (Array.isArray(o)) {
      o.forEach(visit);
      return;
    }
    if (o && typeof o === "object") {
      const rec = o as Record<string, unknown>;
      const results = rec.results;
      if (
        Array.isArray(results) &&
        results.length &&
        typeof results[0] === "object" &&
        results[0] !== null &&
        "name" in (results[0] as object) &&
        ("start_date" in (results[0] as object) || "url" in (results[0] as object))
      ) {
        found = results as EbEvent[];
        return;
      }
      Object.values(rec).forEach(visit);
    }
  };
  visit(data);
  return found;
}

function classifyType(name: string): EventType {
  const n = name.toLowerCase();
  if (/\bconference\b/.test(n)) return "Conference";
  if (/\bsummit\b/.test(n)) return "Summit";
  if (/\bworkshop\b/.test(n)) return "Workshop";
  if (/\bwebinar\b/.test(n)) return "Webinar";
  if (/\bhackathon\b/.test(n)) return "Hackathon";
  if (/\bme?et ?up\b|\bmeet\b/.test(n)) return "Meetup";
  if (/\btraining\b|\bcourse\b|\bbootcamp\b/.test(n)) return "Training";
  if (/\bnetworking\b|\bmixer\b|\bdrinks\b/.test(n)) return "Networking";
  if (/\bexpo\b|\bexhibition\b|\bfair\b/.test(n)) return "Exhibition";
  return "Conference";
}

function categoriesFor(text: string): TechEvent["categories"] {
  const t = text.toLowerCase();
  const out: TechEvent["categories"] = [];
  if (/\bai\b|artificial intelligence|machine learning|\bml\b|genai|llm|agentic/.test(t)) out.push("AI");
  if (/\bdata\b|analytics|data science|data engineering/.test(t)) out.push("Data");
  if (/\bllm\b|language model|gpt|prompt/.test(t)) out.push("LLM");
  if (/cloud|aws|azure|kubernetes/.test(t)) out.push("Cloud");
  if (/security|cyber/.test(t)) out.push("Cybersecurity");
  if (/robot/.test(t)) out.push("Robotics");
  if (/startup|founder|venture/.test(t)) out.push("Startups");
  if (/software|developer|engineering|coding/.test(t)) out.push("Software");
  return out.length ? [...new Set(out)] : ["AI"];
}

function toIso(date?: string, time?: string): string {
  if (!date) return new Date().toISOString();
  const d = new Date(`${date}T${time || "09:00"}:00`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSearch(url: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return extractServerData(await res.text());
    if (res.status === 429 && attempt === 0) {
      await sleep(2500);
      continue;
    }
    throw new Error(`eventbrite ${res.status}`);
  }
  return null;
}

/** Live UK + online events scraped from Eventbrite's public search payload. */
export async function fetchEventbrite(): Promise<TechEvent[]> {
  const seen = new Set<string>();
  const out: TechEvent[] = [];

  // Sequential with a small gap — Eventbrite rate-limits bursts.
  for (const s of SEARCHES) {
    let events: EbEvent[] = [];
    try {
      events = findEventResults(await fetchSearch(s.url));
    } catch {
      continue;
    }
    await sleep(600);
    for (const e of events) {
      if (!e.name || !e.url) continue;
      const slug = slugify(e.name).slice(0, 80);
      if (seen.has(slug)) continue;
      seen.add(slug);

      const start = toIso(e.start_date, e.start_time);
      // drop past events
      if (new Date(start).getTime() < Date.now() - 864e5) continue;

      const venue = e.primary_venue;
      const online = Boolean(e.is_online_event) || s.country === "Online";
      const uk = s.country === "United Kingdom";
      const city = online
        ? null
        : venue?.address?.city ?? venue?.name ?? null;
      const priceMajor = Number(
        e.ticket_availability?.minimum_ticket_price?.major_value ?? "0",
      );
      const text = `${e.name} ${e.summary ?? ""} ${(e.tags ?? [])
        .map((t) => t.display_name)
        .join(" ")}`;

      out.push({
        id: `eb-${slug}`,
        slug,
        title: e.name.trim(),
        description: (e.summary || e.name).trim(),
        about:
          (e.summary || e.name).trim() +
          "\n\nThis event is listed on Eventbrite. Full details, agenda and tickets are on the official Eventbrite page.",
        organizer: venue?.name ?? "See Eventbrite",
        eventType: classifyType(e.name),
        categories: categoriesFor(text),
        topics: (e.tags ?? [])
          .map((t) => t.display_name)
          .filter((x): x is string => Boolean(x))
          .slice(0, 5),
        mode: online ? "Online" : uk ? "UK In-Person" : "In-Person",
        city,
        country: online ? "Online" : s.country,
        venue: online ? null : venue?.address?.localized_address_display ?? venue?.name ?? null,
        startDate: start,
        endDate: toIso(e.end_date ?? e.start_date, e.end_time ?? e.start_time),
        time: e.start_time
          ? `${e.start_time}${e.end_time ? ` – ${e.end_time}` : ""}`
          : "See Eventbrite",
        price: e.is_free ? 0 : Math.round(priceMajor),
        currency: "GBP",
        registrationRequired: true,
        websiteUrl: e.url,
        registrationUrl: e.url,
        registrationDeadline: start,
        imageColor: s.color,
        imageUrl: e.image?.original?.url ?? e.image?.url,
        verified: true,
        featured: false,
        speakers: [],
        schedule: [],
      });
    }
  }

  return out.sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
}
