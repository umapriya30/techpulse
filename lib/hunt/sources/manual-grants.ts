import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Manual/admin-curated Grants source. Unlike Awards/Volunteering, individual
 * Innovate UK funding competitions open and close on a matter of weeks, so a
 * single dated entry goes stale almost immediately. Instead this points to
 * the Innovation Funding Service's own live competition finder — always
 * current by construction, since it's the organiser's own always-on listing
 * rather than a snapshot TechPulse would have to keep re-verifying.
 */

const RAW: RawOpportunity[] = [
  {
    title: "Browse open Innovate UK funding competitions",
    type: "grant",
    description:
      "UK Research and Innovation's live directory of open and upcoming Innovate UK grant competitions — spanning advanced manufacturing, digital technologies, healthcare, engineering biology and more, from £500k to £25m+ per competition.",
    organisation: "Innovate UK (UKRI)",
    website: "https://www.ukri.org/councils/innovate-uk/",
    applicationUrl: "https://apply-for-innovation-funding.service.gov.uk/competition/search",
    sourceUrl: "https://apply-for-innovation-funding.service.gov.uk/competition/search",
    country: "United Kingdom",
    free: true,
    eligibility: "Varies per competition — mostly UK-registered businesses, often with academic/industry collaboration options.",
  },
];

export const manualGrantsSource: SourceAdapter = {
  name: "manual-grants",
  category: "grant",
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
