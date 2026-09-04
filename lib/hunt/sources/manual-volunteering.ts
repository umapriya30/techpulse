import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Manual/admin-curated Volunteering source — same posture as
 * manual-awards.ts (see that file's header for why this isn't a live feed
 * yet). Each entry is a real, ongoing UK programme verified directly against
 * its official page; none of these have a fixed deadline (rolling
 * recruitment), which is left `undefined` rather than invented.
 */

const RAW: RawOpportunity[] = [
  {
    title: "Volunteer your digital & tech skills",
    type: "volunteering",
    description:
      "Browse live skills-based digital and technology volunteering roles with UK charities and non-profits — from web development to data analysis, typically a few hours a month, remote-friendly.",
    organisation: "Reach Volunteering",
    website: "https://reachvolunteering.org.uk/",
    applicationUrl: "https://reachvolunteering.org.uk/search/digital-roles",
    sourceUrl: "https://reachvolunteering.org.uk/search/digital-roles",
    country: "United Kingdom",
    remote: true,
    professionalEligible: true,
    eligibility: "Best suited to people with professional digital/tech experience to offer.",
  },
  {
    title: "Become a STEM Ambassador",
    type: "volunteering",
    description:
      "Volunteer to bring real-life STEM careers into UK schools and colleges. Open to anyone aged 17+ living in the UK with a passion for sharing their knowledge — you don't need to work in STEM. Ambassadors are DBS/PVG-checked and volunteer for free.",
    organisation: "STEM Learning",
    website: "https://www.stem.org.uk/stem-ambassadors",
    applicationUrl: "https://www.stem.org.uk/stem-ambassadors/become-a-stem-ambassador",
    sourceUrl: "https://www.stem.org.uk/stem-ambassadors",
    country: "United Kingdom",
    studentEligible: true,
    professionalEligible: true,
    eligibility: "Aged 17+, living in the UK. No STEM job required.",
  },
  {
    title: "Volunteer to run a Code Club",
    type: "volunteering",
    description:
      "Run a free weekly coding club for young people in a school, library or community space. No coding experience required — the Raspberry Pi Foundation provides free training and resources to every volunteer.",
    organisation: "Raspberry Pi Foundation",
    website: "https://codeclub.org/en/",
    applicationUrl: "https://codeclub.org/en/about",
    sourceUrl: "https://codeclub.org/en/",
    country: "United Kingdom",
    studentEligible: true,
    professionalEligible: true,
    eligibility: "No coding experience required.",
  },
];

export const manualVolunteeringSource: SourceAdapter = {
  name: "manual-volunteering",
  category: "volunteering",
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
