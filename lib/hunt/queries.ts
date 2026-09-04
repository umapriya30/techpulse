import { prisma } from "@/lib/prisma";
import { daysUntil } from "@/lib/utils";
import type { HuntCategory, Opportunity } from "@/lib/hunt/types";

/**
 * Hunt's read side — the DB-backed equivalent of lib/queries.ts's
 * queryEvents/queryHackathons, but reading Postgres directly (via
 * lib/prisma.ts) instead of the fetch-and-cache DataProvider, since Hunt is
 * persisted rather than live-fetched.
 */

export interface OpportunityFilter {
  type?: HuntCategory | HuntCategory[];
  category?: string;
  location?: string; // matches city/country/location, or "remote"/"hybrid"
  deadline?: "soon" | "week" | "month" | "future" | "all";
  free?: boolean;
  eligibility?: "student" | "graduate" | "professional" | "founder";
  query?: string;
  /** Admin views only — include needs_review/pending rows, not just published. */
  includeUnpublished?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOpportunity(row: any): Opportunity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    category: row.category,
    description: row.description,
    organisation: row.organisation,
    organisationLogo: row.organisationLogo,
    website: row.website,
    applicationUrl: row.applicationUrl,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    sourceType: row.sourceType,
    location: row.location,
    country: row.country,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    remote: row.remote,
    hybrid: row.hybrid,
    startDate: row.startDate ? new Date(row.startDate).toISOString() : null,
    endDate: row.endDate ? new Date(row.endDate).toISOString() : null,
    deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
    price: row.price,
    free: row.free,
    prize: row.prize,
    eligibility: row.eligibility,
    studentEligible: row.studentEligible,
    graduateEligible: row.graduateEligible,
    professionalEligible: row.professionalEligible,
    founderEligible: row.founderEligible,
    skills: row.skills,
    technologies: row.technologies,
    industry: row.industry,
    tags: row.tags,
    image: row.image,
    status: row.status,
    verificationStatus: row.verificationStatus,
    lastVerifiedAt: row.lastVerifiedAt ? new Date(row.lastVerifiedAt).toISOString() : null,
    discoveredAt: new Date(row.discoveredAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    duplicateOf: row.duplicateOf,
    relevanceScore: row.relevanceScore ?? 0,
  };
}

export async function queryOpportunities(f: OpportunityFilter = {}): Promise<Opportunity[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = f.includeUnpublished ? {} : { status: "published" };

  if (f.type) where.type = Array.isArray(f.type) ? { in: f.type } : f.type;
  if (f.category) where.category = { has: f.category };
  if (f.free !== undefined) where.free = f.free;

  const rows = await prisma.opportunity.findMany({
    where,
    orderBy: [{ deadline: "asc" }, { discoveredAt: "desc" }],
  });

  let items = rows.map(toOpportunity);

  if (f.location) {
    const loc = f.location.toLowerCase();
    items = items.filter((o) => {
      if (loc === "remote") return o.remote;
      if (loc === "hybrid") return o.hybrid;
      return (
        o.city?.toLowerCase().includes(loc) ||
        o.country?.toLowerCase().includes(loc) ||
        o.location?.toLowerCase().includes(loc) ||
        false
      );
    });
  }

  if (f.deadline && f.deadline !== "all") {
    items = items.filter((o) => {
      if (!o.deadline) return f.deadline === "future"; // no deadline = rolling/ongoing
      const d = daysUntil(o.deadline);
      if (d < 0) return false;
      if (f.deadline === "soon") return d <= 3;
      if (f.deadline === "week") return d <= 7;
      if (f.deadline === "month") return d <= 30;
      return d > 30;
    });
  }

  if (f.eligibility) {
    const key = `${f.eligibility}Eligible` as
      | "studentEligible"
      | "graduateEligible"
      | "professionalEligible"
      | "founderEligible";
    items = items.filter((o) => o[key]);
  }

  if (f.query) {
    const terms = f.query.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((o) => {
      const haystack = opportunityText(o);
      return terms.every((t) => haystack.includes(t));
    });
  }

  return items;
}

export async function getOpportunity(slug: string): Promise<Opportunity | null> {
  const row = await prisma.opportunity.findUnique({ where: { slug } });
  return row ? toOpportunity(row) : null;
}

/** Admin "Needs Review" queue. */
export async function listNeedsReview(): Promise<Opportunity[]> {
  const rows = await prisma.opportunity.findMany({
    where: { OR: [{ status: "needs_review" }, { status: "pending" }] },
    orderBy: { discoveredAt: "desc" },
  });
  return rows.map(toOpportunity);
}

function opportunityText(o: Opportunity): string {
  return [
    o.title,
    o.description,
    o.organisation,
    o.location ?? "",
    o.country ?? "",
    o.city ?? "",
    ...o.category,
    ...o.tags,
    ...o.skills,
    ...o.technologies,
  ]
    .join(" ")
    .toLowerCase();
}
