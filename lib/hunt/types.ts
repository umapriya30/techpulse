// Hunt — unified opportunity discovery. Domain types for the "Opportunity"
// object described in the Hunt spec, shared by every category's adapter,
// the ingestion pipeline, and the UI.

import type { Category } from "@/lib/types";

/**
 * Every category Hunt is meant to eventually cover. Only "award" and
 * "volunteering" have adapters wired up in Phase 1 — the rest are reserved so
 * the schema, UI and pipeline never need to change shape when they're added.
 */
export type HuntCategory =
  | "award"
  | "volunteering"
  | "launch" // Launch Radar (Phase 2)
  | "hackathon" // reserved: TechPulse's existing /hackathons stays the source of truth for now
  | "event" // reserved: ditto for /events
  | "speaking"
  | "judging"
  | "mentoring"
  | "competition"
  | "grant";

export const HUNT_CATEGORIES: HuntCategory[] = [
  "award",
  "launch",
  "hackathon",
  "event",
  "volunteering",
  "speaking",
  "judging",
  "mentoring",
  "competition",
  "grant",
];

/** Categories with a live UI + at least one adapter in the current phase. */
export const ACTIVE_HUNT_CATEGORIES: HuntCategory[] = ["award", "volunteering"];

export const HUNT_CATEGORY_LABEL: Record<HuntCategory, { label: string; emoji: string }> = {
  award: { label: "Awards", emoji: "🏆" },
  launch: { label: "Product Launches", emoji: "🚀" },
  hackathon: { label: "Hackathons", emoji: "💻" },
  event: { label: "Events", emoji: "🎤" },
  volunteering: { label: "Volunteering", emoji: "🤝" },
  speaking: { label: "Speaking Opportunities", emoji: "🎙" },
  judging: { label: "Judging Opportunities", emoji: "🧑‍⚖️" },
  mentoring: { label: "Mentoring Opportunities", emoji: "🧑‍🏫" },
  competition: { label: "Startup Competitions", emoji: "💡" },
  grant: { label: "Grants / Innovation Funding", emoji: "💰" },
};

export type SourceType = "official" | "manual" | "api" | "aggregator" | "user_submission";
export type OpportunityStatus = "draft" | "published" | "pending" | "needs_review" | "expired" | "removed";
export type VerificationStatus = "verified" | "needs_review" | "expired" | "removed";

/**
 * Loose, adapter-facing shape. Adapters only need to fill in what they can
 * actually source — `normalize()` fills sensible defaults, `validate()`
 * rejects what's still missing required fields. Never invent a value here;
 * leave it undefined instead.
 */
export interface RawOpportunity {
  title: string;
  type: HuntCategory;
  category?: Category[];
  description: string;
  organisation: string;
  organisationLogo?: string;
  website: string;
  applicationUrl?: string;
  sourceUrl: string;
  location?: string;
  country?: string;
  city?: string;
  remote?: boolean;
  hybrid?: boolean;
  startDate?: string; // ISO
  endDate?: string; // ISO
  deadline?: string; // ISO — omit rather than guess
  price?: number;
  free?: boolean;
  prize?: string;
  eligibility?: string;
  studentEligible?: boolean;
  graduateEligible?: boolean;
  professionalEligible?: boolean;
  founderEligible?: boolean;
  skills?: string[];
  technologies?: string[];
  industry?: string;
  tags?: string[];
  image?: string;
}

/** Normalised shape — mirrors the Prisma `Opportunity` model. */
export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  type: HuntCategory;
  category: string[];
  description: string;
  organisation: string;
  organisationLogo: string | null;
  website: string;
  applicationUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  sourceType: SourceType;
  location: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  remote: boolean;
  hybrid: boolean;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  price: number | null;
  free: boolean;
  prize: string | null;
  eligibility: string | null;
  studentEligible: boolean;
  graduateEligible: boolean;
  professionalEligible: boolean;
  founderEligible: boolean;
  skills: string[];
  technologies: string[];
  industry: string | null;
  tags: string[];
  image: string | null;
  status: OpportunityStatus;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string | null;
  discoveredAt: string;
  updatedAt: string;
  duplicateOf: string | null;
  relevanceScore: number;
}
