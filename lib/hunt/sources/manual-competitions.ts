import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/** Manual/admin-curated Startup Competitions source — same posture as manual-awards.ts. */

const RAW: RawOpportunity[] = [
  {
    title: "Venture Further Awards",
    type: "competition",
    description:
      "The University of Manchester's flagship startup competition — over £200,000 in equity-free prizes plus £150,000+ in software and tech perks, across four tracks with individual awards from £3,000 to £45,000.",
    organisation: "University of Manchester — Masood Entrepreneurship Centre",
    website: "https://www.entrepreneurship.manchester.ac.uk/venture-further/",
    applicationUrl: "https://www.entrepreneurship.manchester.ac.uk/venture-further/",
    sourceUrl: "https://www.entrepreneurship.manchester.ac.uk/venture-further/",
    country: "United Kingdom",
    city: "Manchester",
    deadline: "2026-05-04",
    prize: "Up to £45,000 per award; £200,000+ total pool",
    studentEligible: true,
    eligibility: "Current University of Manchester students, postdocs and recent alumni (graduated within 2 years); ventures trading under 2 years.",
  },
];

export const manualCompetitionsSource: SourceAdapter = {
  name: "manual-competitions",
  category: "competition",
  type: "manual",
  enabled: true,
  async fetch() {
    return RAW;
  },
  normalize(raw) {
    return normalizeDefaults(raw);
  },
  validate(raw) {
    return validateOpportunity(raw);
  },
  getSourceUrl(raw) {
    return raw.sourceUrl;
  },
};
