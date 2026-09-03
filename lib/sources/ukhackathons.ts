import type { Hackathon } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Live UK hackathons from ukhackathons.com.
 *
 * ukhackathons.com is itself an aggregator (Devpost, Eventbrite, Humanitix,
 * Luma) and its robots.txt explicitly invites crawling of its content pages.
 * We read the upcoming-events cards from its homepage, cache for 6h and link
 * every item back to its ukhackathons.com/events/<slug> page (which in turn
 * links to the official registration).
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

const COLORS = ["violet", "blue", "emerald", "amber", "rose", "indigo", "lime", "slate"];

function first(re: RegExp, s: string): string | null {
  const m = s.match(re);
  return m ? m[1].trim() : null;
}
function all(re: RegExp, s: string): string[] {
  return [...s.matchAll(re)].map((m) => m[1].trim());
}
function stripEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/�/g, "·")
    .trim();
}

/** "2 Sep 2026" / "2 Sep 2026 · London" -> ISO */
function parseDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(20\d{2})/);
  if (!m) return null;
  const d = new Date(`${m[1]} ${m[2]} ${m[3]} 09:00:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parsePrize(pills: string[]): { amount: number; currency: Hackathon["currency"] } {
  for (const p of pills) {
    const m = p.replace(/[, ]/g, "").match(/([£$€])(\d+(?:\.\d+)?)(k|K)?/);
    if (m) {
      let n = parseFloat(m[2]);
      if (m[3]) n *= 1000;
      return { amount: Math.round(n), currency: m[1] === "£" ? "GBP" : m[1] === "€" ? "EUR" : "USD" };
    }
  }
  return { amount: 0, currency: "GBP" };
}

function parseMode(pills: string[]): Hackathon["mode"] {
  const j = pills.join(" ").toLowerCase();
  if (/online|virtual|remote/.test(j)) return "Online";
  if (/hybrid/.test(j)) return "Hybrid";
  return "In-Person";
}

export async function fetchUkHackathons(): Promise<Hackathon[]> {
  const res = await fetch("https://ukhackathons.com/", {
    headers: { "User-Agent": UA, Accept: "text/html" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`ukhackathons ${res.status}`);
  const html = await res.text();

  // Only the "upcoming hackathons" section (before "past events").
  const upStart = html.indexOf("upcoming hackathons");
  const upEnd = html.indexOf("past events", upStart);
  const region = html.slice(upStart, upEnd > 0 ? upEnd : undefined);

  const seen = new Set<string>();
  const out: Hackathon[] = [];
  const now = Date.now();

  for (const raw of region.split('<a class="card-link"').slice(1)) {
    const seg = raw.slice(0, 2500);
    const hrefSlug = first(/href="\/events\/([a-z0-9-]+)/, seg);
    if (!hrefSlug) continue;

    const title = stripEntities(first(/<h3[^>]*>([^<]+)<\/h3>/, seg) ?? "");
    if (!title) continue;
    const slug = slugify(title).slice(0, 80);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const datesText = stripEntities(first(/class="dates"[^>]*>([^<]+)</, seg) ?? "");
    const iso = parseDate(datesText);
    if (!iso) continue;
    if (new Date(iso).getTime() < now - 2 * 864e5) continue;

    const org = stripEntities(first(/class="org-name"[^>]*>([^<]+)</, seg) ?? "") || "See UK Hackathons";
    const loc = stripEntities(first(/class="loc"[^>]*>([^<]+)</, seg) ?? "");
    const tags = all(/class="tag"[^>]*>([^<]+)</g, seg).map(stripEntities);
    const pills = all(/class="pill"[^>]*>([^<]+)</g, seg).map(stripEntities);

    const { amount, currency } = parsePrize(pills);
    const mode = parseMode(pills);
    const online = mode === "Online";
    const url = `https://ukhackathons.com/events/${hrefSlug}`;
    const tagText = tags.join(" ").toLowerCase() + " " + title.toLowerCase();
    const isAI = /\bai\b|artificial|machine learning|\bml\b|llm|genai|agentic|data/.test(tagText);

    out.push({
      id: `ukh-${slug}`,
      slug,
      title,
      description: `${title} — ${org}${loc ? `, ${loc}` : ""}. Listed on UK Hackathons.`,
      challenge:
        "Full details, theme and rules are on the event page. This listing is synced from ukhackathons.com, which aggregates UK hackathons from Devpost, Eventbrite, Humanitix and Luma.",
      requirements: ["See the official event page for eligibility and rules"],
      organizer: org,
      technologies: tags.length ? tags.slice(0, 5) : ["Hackathon"],
      categories: isAI ? ["AI"] : ["Software"],
      region: "UK",
      country: online ? "Online" : "United Kingdom",
      mode,
      city: online ? null : loc || "UK",
      startDate: iso,
      endDate: iso,
      registrationDeadline: iso,
      durationHours: 0,
      prizePool: amount,
      currency,
      prizes: amount > 0 ? [{ place: "Prize pool", amount, note: "see event page" }] : [],
      keyDates: [{ label: "Event date", date: iso }],
      teamMin: 1,
      teamMax: 5,
      difficulty: /beginner|first[- ]?time|student/i.test(tagText) ? "Beginner" : "Intermediate",
      websiteUrl: url,
      registrationUrl: url,
      imageColor: COLORS[slug.length % COLORS.length],
      imageUrl: `https://ukhackathons.com/images/events/scraped/${hrefSlug}.webp`,
      verified: false, // link goes to the ukhackathons.com listing, not the organiser
      featured: false,
    });
  }

  return out.sort(
    (a, b) => +new Date(a.registrationDeadline) - +new Date(b.registrationDeadline),
  );
}
