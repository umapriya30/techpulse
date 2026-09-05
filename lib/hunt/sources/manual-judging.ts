import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/** Manual/admin-curated Judging source — same posture as manual-awards.ts. */

const RAW: RawOpportunity[] = [
  {
    title: "Judge for The Pitch 2026",
    type: "judging",
    description:
      "The UK and Ireland's largest pitching competition is recruiting judges to score startups at its regional events. 60 founders compete across six cities, with 12 finalists advancing to a London final.",
    organisation: "The Pitch (powered by SeedLegals)",
    website: "https://thepitch.uk/",
    applicationUrl: "https://ukbaa.org.uk/blog/2025/10/21/judge-the-pitch-2026-help-find-the-uks-next-startup-champion/",
    sourceUrl: "https://ukbaa.org.uk/blog/2025/10/21/judge-the-pitch-2026-help-find-the-uks-next-startup-champion/",
    country: "United Kingdom",
    eligibility: "Investors, founders and industry experts; email partnerships@thepitch.uk with your preferred region to apply.",
  },
];

export const manualJudgingSource: SourceAdapter = {
  name: "manual-judging",
  category: "judging",
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
