import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Manual/admin-curated Speaking/CFP source — same posture as
 * manual-awards.ts. Verified directly against each conference's Sessionize
 * page. Call-for-speakers windows are short-lived by nature: both entries
 * below had already closed by the time they were added (checked live), and
 * that's shown honestly (deadlineState() renders them "Closed") rather than
 * omitted — a real CFP aggregator always has a mix of open and recently
 * closed calls. Replace/add entries as new calls open.
 */

const RAW: RawOpportunity[] = [
  {
    title: "PHP UK Conference 2026 — Call for Speakers",
    type: "speaking",
    description:
      "One-day PHP conference in the City of London. Welcomes proposals across the spectrum — mainstream, advanced, niche or non-technical — for audiences of all skill levels. Speakers receive complimentary attendance, accommodation and expenses.",
    organisation: "PHP UK Conference",
    website: "https://phpconference.co.uk/",
    applicationUrl: "https://sessionize.com/php-uk-conference-2026/",
    sourceUrl: "https://sessionize.com/php-uk-conference-2026/",
    country: "United Kingdom",
    city: "London",
    deadline: "2025-11-10",
    startDate: "2026-02-20",
    endDate: "2026-02-20",
  },
  {
    title: "SQLBits 2026 — Call for Speakers",
    type: "speaking",
    description:
      "SQLBits is the UK's largest data platform conference for data professionals to network, develop and share knowledge across SQL Server, Azure Data, Power BI and more.",
    organisation: "SQLBits",
    website: "https://sqlbits.com/",
    applicationUrl: "https://sessionize.com/sqlbits-2026/",
    sourceUrl: "https://sessionize.com/sqlbits-2026/",
    country: "United Kingdom",
    city: "Newport",
    deadline: "2026-01-18",
    startDate: "2026-04-22",
    endDate: "2026-04-25",
  },
];

export const manualSpeakingSource: SourceAdapter = {
  name: "manual-speaking",
  category: "speaking",
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
