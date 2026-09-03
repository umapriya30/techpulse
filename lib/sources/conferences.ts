import type { TechEvent, EventType } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Tech conferences from the open-source tech-conferences/conference-data project
 * (the dataset behind confs.tech). Hosted as plain JSON on GitHub — permissive,
 * reliable, no key. We take the AI/Data/DevOps/Security/general/cloud tracks for
 * every future event, worldwide.
 */

const YEAR = new Date().getFullYear();
const TOPICS = [
  "data",
  "general",
  "devops",
  "security",
  "python",
  "javascript",
  "cloud",
  "golang",
  "rust",
  "java",
  "dotnet",
];

interface ConfEntry {
  name: string;
  url: string;
  startDate: string;
  endDate?: string;
  city?: string | null;
  country?: string | null;
  online?: boolean;
  cfpUrl?: string;
  cfpEndDate?: string;
}

const COLORS = ["indigo", "emerald", "blue", "violet", "amber", "slate", "rose"];

function typeFor(name: string): EventType {
  const n = name.toLowerCase();
  if (/summit/.test(n)) return "Summit";
  if (/workshop/.test(n)) return "Workshop";
  if (/meetup/.test(n)) return "Meetup";
  if (/webinar/.test(n)) return "Webinar";
  return "Conference";
}

function categoriesFor(text: string): TechEvent["categories"] {
  const t = text.toLowerCase();
  const out: TechEvent["categories"] = [];
  if (/\bai\b|artificial intelligence|ml|machine learning|llm|genai|agentic|intelligence/.test(t)) out.push("AI");
  if (/data|analytics/.test(t)) out.push("Data");
  if (/llm|language model|gpt/.test(t)) out.push("LLM");
  if (/cloud|kubernetes|devops|platform|sre/.test(t)) out.push("Cloud");
  if (/security|sec\b|hack/.test(t)) out.push("Cybersecurity");
  if (/python|java|api|code|software|dev/.test(t)) out.push("Software");
  return out.length ? [...new Set(out)] : ["Software"];
}

const UK = new Set([
  "uk",
  "unitedkingdom",
  "england",
  "scotland",
  "wales",
  "northernireland",
  "greatbritain",
]);

function normCountry(c?: string | null) {
  return (c ?? "").toLowerCase().replace(/[.\s]/g, "");
}

function isUk(e: ConfEntry): boolean {
  return UK.has(normCountry(e.country));
}

/** A genuinely online event: flagged online AND with no physical city. */
function isOnlineOnly(e: ConfEntry): boolean {
  return e.online === true && (!e.city || /online|virtual|remote/i.test(e.city));
}

async function fetchTopic(topic: string): Promise<ConfEntry[]> {
  const url = `https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/${YEAR}/${topic}.json`;
  const res = await fetch(url, {
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return [];
  return (await res.json()) as ConfEntry[];
}

export async function fetchConferences(): Promise<TechEvent[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const settled = await Promise.allSettled(TOPICS.map(fetchTopic));

  const seen = new Set<string>();
  const out: TechEvent[] = [];

  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const e of s.value) {
      if (!e.name || !e.url || !e.startDate) continue;
      if (e.startDate < todayIso) continue;

      const slug = slugify(e.name).slice(0, 80);
      if (seen.has(slug)) continue;
      seen.add(slug);

      const online = isOnlineOnly(e);
      const uk = isUk(e);
      const text = e.name;

      out.push({
        id: `cf-${slug}`,
        slug,
        title: e.name.trim(),
        description: `${e.name.trim()} — ${
          online ? "online" : `${e.city ?? ""}${e.country ? ", " + e.country : ""}`
        }. Listed by the confs.tech open conference dataset.`,
        about: `${e.name.trim()} takes place ${
          online ? "online" : `in ${e.city ?? e.country ?? "TBC"}`
        } starting ${e.startDate}. Full programme, speakers and tickets are on the official conference website. ${
          e.cfpUrl ? "A call for papers is open — see the site." : ""
        }`,
        organizer: "See official site",
        eventType: typeFor(e.name),
        categories: categoriesFor(text),
        topics: [],
        mode: online
          ? "Online"
          : uk
            ? "UK In-Person"
            : e.city
              ? "In-Person"
              : "Hybrid",
        city: online ? null : e.city ?? null,
        country: online ? "Online" : e.country ?? "International",
        venue: null,
        startDate: new Date(`${e.startDate}T09:00:00`).toISOString(),
        endDate: new Date(`${e.endDate ?? e.startDate}T18:00:00`).toISOString(),
        time: "See official site",
        price: 0,
        currency: "GBP",
        registrationRequired: true,
        websiteUrl: e.url,
        registrationUrl: e.url,
        registrationDeadline: e.cfpEndDate
          ? new Date(`${e.cfpEndDate}T23:59:00`).toISOString()
          : new Date(`${e.startDate}T09:00:00`).toISOString(),
        imageColor: COLORS[slug.length % COLORS.length],
        verified: true,
        featured: false,
        speakers: [],
        schedule: [],
      });
    }
  }
  return out
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
    .slice(0, 200);
}
