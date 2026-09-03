import type { Hackathon } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Live hackathons from the public Devpost hackathons API.
 * Endpoint: https://devpost.com/api/hackathons  (public JSON, no key)
 *
 * The list API is shallow (no full challenge/prize breakdown), so detail pages
 * show what we have and link out to the official Devpost page.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

interface DevpostHackathon {
  id: number;
  title: string;
  displayed_location?: { location?: string };
  open_state?: string;
  url: string;
  submission_period_dates?: string;
  time_left_to_submission?: string;
  themes?: { name: string }[];
  prize_amount?: string;
  registrations_count?: number;
  organization_name?: string;
  featured?: boolean;
  managed_by_devpost_badge?: boolean;
  thumbnail_url?: string;
}

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|machine learning|ml|llm|genai|generative|agent|deep learning|data|nlp|computer vision|rag)\b/i;

const COLORS = ["violet", "blue", "indigo", "rose", "emerald", "amber", "lime", "slate"];

function parsePrize(html?: string): { amount: number; currency: string } {
  if (!html) return { amount: 0, currency: "USD" };
  const num = html.replace(/<[^>]+>/g, "").replace(/[^0-9.]/g, "");
  const currency = html.includes("£") ? "GBP" : html.includes("€") ? "EUR" : "USD";
  return { amount: Math.round(Number(num) || 0), currency };
}

/** "Aug 19 - Sep 01, 2026" | "Sep 01, 2026" -> ISO end date (best effort). */
function parseDeadline(text?: string): string {
  if (!text) return new Date(Date.now() + 7 * 864e5).toISOString();
  const yearM = text.match(/\b(20\d{2})\b/);
  const year = yearM ? yearM[1] : String(new Date().getFullYear());
  const parts = text.split(/[-–]/).map((s) => s.trim());
  const last = parts[parts.length - 1].replace(/,?\s*20\d{2}/, "").trim();
  const d = new Date(`${last} ${year} 23:59:00`);
  return isNaN(d.getTime())
    ? new Date(Date.now() + 7 * 864e5).toISOString()
    : d.toISOString();
}

function regionFor(loc: string): Hackathon["region"] {
  const l = loc.toLowerCase();
  if (l === "online" || !l || /virtual|remote/.test(l)) return "Online";
  if (/\b(uk|united kingdom|london|manchester|scotland|england|wales|birmingham|leeds|glasgow|edinburgh|bristol)\b/.test(l))
    return "UK";
  if (
    /\b(germany|france|spain|italy|netherlands|europe|poland|sweden|norway|denmark|finland|ireland|portugal|belgium|austria|switzerland|czech|greece|berlin|paris|amsterdam|madrid|lisbon|munich|dublin)\b/.test(
      l,
    )
  )
    return "Europe";
  if (
    /\b(usa|united states|u\.s|america|canada|new york|san francisco|toronto|boston|seattle|austin|chicago|los angeles|mexico)\b/.test(
      l,
    )
  )
    return "North America";
  if (
    /\b(india|china|japan|singapore|indonesia|malaysia|thailand|vietnam|philippines|korea|taiwan|hong kong|pakistan|bangladesh|nepal|bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|tokyo|seoul|jakarta)\b/.test(
      l,
    )
  )
    return "Asia";
  if (/\b(uae|dubai|abu dhabi|saudi|qatar|israel|turkey|kuwait|bahrain|oman|egypt|cairo)\b/.test(l))
    return "Middle East";
  if (/\b(nigeria|kenya|south africa|ghana|rwanda|morocco|tunisia|uganda|lagos|nairobi|kigali)\b/.test(l))
    return "Africa";
  if (/\b(australia|new zealand|sydney|melbourne|auckland)\b/.test(l)) return "Oceania";
  if (/\b(brazil|argentina|chile|colombia|peru|sao paulo|buenos aires)\b/.test(l))
    return "South America";
  return "Global";
}

const ENDPOINTS = [
  "https://devpost.com/api/hackathons?order_by=deadline&status[]=open&page=1",
  "https://devpost.com/api/hackathons?order_by=deadline&status[]=open&page=2",
  "https://devpost.com/api/hackathons?order_by=deadline&status[]=open&page=3",
  "https://devpost.com/api/hackathons?order_by=deadline&status[]=open&page=4",
  "https://devpost.com/api/hackathons?challenge_type[]=online&status[]=open&order_by=recently-added&page=1",
  "https://devpost.com/api/hackathons?search=AI&status[]=open&order_by=deadline&page=1",
  "https://devpost.com/api/hackathons?search=machine%20learning&status[]=open&order_by=deadline&page=1",
];

export async function fetchLiveHackathons(): Promise<Hackathon[]> {
  const results = await Promise.allSettled(
    ENDPOINTS.map((url) =>
      fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(9000),
      }).then((r) => {
        if (!r.ok) throw new Error(`devpost ${r.status}`);
        return r.json() as Promise<{ hackathons: DevpostHackathon[] }>;
      }),
    ),
  );

  const seen = new Set<string>();
  const out: Hackathon[] = [];

  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    for (const h of res.value.hackathons ?? []) {
      const themeText = (h.themes ?? []).map((t) => t.name).join(" ");
      const isAI = AI_KEYWORDS.test(themeText) || AI_KEYWORDS.test(h.title);

      const slug = slugify(h.title).slice(0, 80);
      if (seen.has(slug)) continue;
      seen.add(slug);

      const loc = h.displayed_location?.location ?? "Online";
      const online = loc.toLowerCase() === "online";
      const { amount, currency } = parsePrize(h.prize_amount);
      let deadline = parseDeadline(h.submission_period_dates);
      // Devpost only returned open hackathons — if our date parse landed in the
      // past, treat the deadline as imminent rather than closed.
      if (new Date(deadline).getTime() < Date.now()) {
        deadline = new Date(Date.now() + 3 * 864e5).toISOString();
      }
      const themes = (h.themes ?? []).map((t) => t.name);

      out.push({
        id: `dp-${h.id}`,
        slug,
        title: h.title.trim(),
        description: `${h.title.trim()} — hosted on Devpost${
          h.organization_name ? ` by ${h.organization_name}` : ""
        }. ${loc}. ${h.time_left_to_submission ?? "Open for submissions"}.`,
        challenge:
          "Full challenge details, rules and judging criteria are on the official Devpost page. This listing is synced live from Devpost's public hackathons feed.",
        requirements: [
          "See the official Devpost page for eligibility and rules",
          h.registrations_count
            ? `${h.registrations_count.toLocaleString()} participants registered so far`
            : "Registration open on Devpost",
        ],
        organizer: h.organization_name ?? "Devpost",
        technologies: themes.length ? themes : ["Software"],
        categories: isAI ? ["AI"] : ["Software"],
        region: regionFor(loc),
        country: online ? "Online" : loc,
        mode: online ? "Online" : "In-Person",
        city: online ? null : loc,
        startDate: deadline,
        endDate: deadline,
        registrationDeadline: deadline,
        durationHours: 0,
        prizePool: amount,
        currency: currency as Hackathon["currency"],
        prizes:
          amount > 0
            ? [{ place: "Total prize pool", amount, note: "see Devpost for breakdown" }]
            : [],
        keyDates: [
          { label: "Submission deadline", date: deadline },
        ],
        teamMin: 1,
        teamMax: 4,
        difficulty: /beginner/i.test(themeText) ? "Beginner" : "Intermediate",
        websiteUrl: h.url,
        registrationUrl: h.url,
        imageColor: COLORS[h.id % COLORS.length],
        imageUrl: h.thumbnail_url
          ? h.thumbnail_url.startsWith("//")
            ? `https:${h.thumbnail_url}`
            : h.thumbnail_url
          : undefined,
        verified: true,
        featured: Boolean(h.featured),
      });
    }
  }

  if (out.length === 0) throw new Error("no live hackathons matched");
  return out
    .sort((a, b) => {
      const aAI = a.categories.includes("AI");
      const bAI = b.categories.includes("AI");
      if (aAI !== bAI) return aAI ? -1 : 1;
      return (
        +new Date(a.registrationDeadline) - +new Date(b.registrationDeadline)
      );
    })
    .slice(0, 90);
}
