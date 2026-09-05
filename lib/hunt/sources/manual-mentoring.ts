import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/** Manual/admin-curated Mentoring source — same posture as manual-awards.ts. */

const RAW: RawOpportunity[] = [
  {
    title: "Become an MLH Coach",
    type: "mentoring",
    description:
      "MLH Coaches mentor hackers, support organisers, and help judging run smoothly at Major League Hacking hackathon events worldwide. An unpaid, ongoing volunteer role for experienced hackers and community members.",
    organisation: "Major League Hacking (MLH)",
    website: "https://www.mlh.com/",
    applicationUrl: "https://www.mlh.com/coaches",
    sourceUrl: "https://www.mlh.com/coaches",
    remote: true,
    professionalEligible: true,
    eligibility: "Passionate hackers/community members with experience mentoring or supporting hackathons.",
  },
];

export const manualMentoringSource: SourceAdapter = {
  name: "manual-mentoring",
  category: "mentoring",
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
