import type { TechEvent, EventType } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Live events from developers.events (open, GitHub-maintained global tech-event
 * dataset — https://developers.events). Plain JSON, permissive, very reliable.
 * We keep future UK + online events and link each one to its official site.
 */

interface DevEvent {
  name: string;
  date: [number, number?];
  hyperlink: string;
  location?: string;
  city?: string;
  country?: string;
  status?: string;
  cfp?: { untilDate?: number; link?: string };
  tags?: { key: string; value: string }[];
}

const UK = /\b(uk|united kingdom|england|scotland|wales|northern ireland|britain)\b/i;
const COLORS = ["violet", "blue", "emerald", "indigo", "amber", "rose", "slate", "lime"];

function typeFor(name: string): EventType {
  const n = name.toLowerCase();
  if (/summit/.test(n)) return "Summit";
  if (/workshop|masterclass/.test(n)) return "Workshop";
  if (/meet ?up|community day|brunch/.test(n)) return "Meetup";
  if (/webinar/.test(n)) return "Webinar";
  if (/hackathon|hack day/.test(n)) return "Hackathon";
  if (/training|bootcamp|course/.test(n)) return "Training";
  if (/expo|exhibition/.test(n)) return "Exhibition";
  if (/networking|mixer/.test(n)) return "Networking";
  return "Conference";
}

function mapCategories(tags: { key: string; value: string }[], name: string): TechEvent["categories"] {
  const text = (tags.map((t) => t.value).join(" ") + " " + name).toLowerCase();
  const out: TechEvent["categories"] = [];
  if (/\bai\b|artificial|machine-?learning|\bml\b|llm|genai|agentic|deep-?learning|data-?science/.test(text)) out.push("AI");
  if (/\bdata\b|analytics|data-?engineering|database|bigdata/.test(text)) out.push("Data");
  if (/\bllm\b|language-?model|gpt|prompt|rag/.test(text)) out.push("LLM");
  if (/cloud|aws|azure|gcp|kubernetes|serverless|devops|platform|sre|k8s/.test(text)) out.push("Cloud");
  if (/security|cyber|infosec|appsec|bsides|hacking/.test(text)) out.push("Cybersecurity");
  if (/robot/.test(text)) out.push("Robotics");
  if (/startup|founder|scale-?up|venture/.test(text)) out.push("Startups");
  if (/\bjs\b|javascript|python|java|dotnet|php|rust|go\b|api|frontend|web|mobile|ios|android|craft|software|engineering/.test(text))
    out.push("Software");
  if (/open-?source|oss|linux/.test(text)) out.push("Open Source");
  return out.length ? [...new Set(out)].slice(0, 4) : ["Software"];
}

const AI_DATA = /\bai\b|artificial|machine|\bml\b|llm|data|analytics|genai|agentic/i;

export async function fetchDevEvents(): Promise<TechEvent[]> {
  // 4 MB feed — too big for Next's fetch cache; the provider wraps this whole
  // function in unstable_cache instead, so fetch it fresh here.
  const res = await fetch("https://developers.events/all-events.json", {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`developers.events ${res.status}`);
  const all = (await res.json()) as DevEvent[];

  const now = Date.now();
  const seen = new Set<string>();
  const out: TechEvent[] = [];

  for (const e of all) {
    if (!e.name || !e.hyperlink || !Array.isArray(e.date) || !e.date[0]) continue;
    const start = e.date[0];
    if (start < now) continue;
    if (start > now + 220 * 864e5) continue; // within ~7 months

    const loc = `${e.location ?? ""} ${e.country ?? ""} ${e.city ?? ""}`;
    const online = /online|virtual|remote/i.test(loc) || (!e.city && !e.country);
    const uk = UK.test(loc);

    const tags = e.tags ?? [];
    const tagText = tags.map((t) => t.value).join(" ");
    const relevant =
      AI_DATA.test(tagText) ||
      AI_DATA.test(e.name) ||
      /cloud|devops|security|software|api|web|python|javascript|open-?source|kubernetes|craft|architecture/i.test(
        tagText + " " + e.name,
      );
    if (!relevant) continue;

    const slug = slugify(e.name).slice(0, 80);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const end = e.date[1] && e.date[1] > start ? e.date[1] : start + 8 * 3600_000;
    const cfpDeadline = e.cfp?.untilDate && e.cfp.untilDate > now ? e.cfp.untilDate : null;

    out.push({
      id: `de-${slug}`,
      slug,
      title: e.name.trim(),
      description: `${e.name.trim()} — ${
        online
          ? "online"
          : [e.city, e.country].filter(Boolean).join(", ") || "in person"
      }. Community-listed on developers.events.`,
      about: `${e.name.trim()} ${
        online
          ? "is an online event"
          : `takes place in ${[e.city, e.country].filter(Boolean).join(", ") || "person"}`
      } starting ${new Date(start).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}. Full programme, speakers and tickets are on the official event website${
        e.cfp?.link ? ", and a call for papers is open" : ""
      }.`,
      organizer: "See official site",
      eventType: typeFor(e.name),
      categories: mapCategories(tags, e.name),
      topics: tags
        .filter((t) => t.key === "topic" || t.key === "tech")
        .map((t) => t.value.replace(/-/g, " "))
        .slice(0, 5),
      mode: online ? "Online" : uk ? "UK In-Person" : "In-Person",
      city: online ? null : e.city ?? null,
      country: online ? "Online" : e.country ?? "International",
      venue: null,
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      time: "See official site",
      price: 0,
      currency: "GBP",
      registrationRequired: true,
      websiteUrl: e.hyperlink,
      registrationUrl: e.hyperlink,
      registrationDeadline: cfpDeadline
        ? new Date(cfpDeadline).toISOString()
        : new Date(start).toISOString(),
      imageColor: COLORS[slug.length % COLORS.length],
      verified: true,
      featured: false,
      speakers: [],
      schedule: [],
    });
  }

  // Prioritise: AI/Data events first, then soonest. Cap the list.
  return out
    .sort((a, b) => {
      const aAI = a.categories.some((c) => c === "AI" || c === "Data" || c === "LLM");
      const bAI = b.categories.some((c) => c === "AI" || c === "Data" || c === "LLM");
      if (aAI !== bAI) return aAI ? -1 : 1;
      return +new Date(a.startDate) - +new Date(b.startDate);
    })
    .slice(0, 280);
}
