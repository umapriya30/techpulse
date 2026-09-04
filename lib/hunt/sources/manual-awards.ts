import type { SourceAdapter } from "@/lib/hunt/adapter";
import { normalizeDefaults } from "@/lib/hunt/adapter";
import { validateOpportunity } from "@/lib/hunt/validate";
import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Manual/admin-curated Awards source.
 *
 * Per the Hunt spec's own sourcing rules (§8, §28), an aggregator is
 * discovery-only — the *official award website* is the source of truth for
 * deadline/eligibility/prize/entry fee. There's no compliant zero-key public
 * API for UK tech awards today, so this Phase 1 adapter is a small,
 * hand-verified list rather than a live feed: every entry below was checked
 * directly against its official site (see the WebFetch trail in the PR/commit
 * that added this file). Where a current-cycle date wasn't stated on the
 * official page, `deadline`/dates are left undefined rather than guessed —
 * the pipeline marks those `needs_review` instead of `verified`.
 *
 * To add a live adapter later (e.g. once an award body offers an official
 * CFP/API), implement SourceAdapter the same way and register it in
 * lib/hunt/pipeline.ts's ADAPTERS list — nothing else changes.
 */

const RAW: RawOpportunity[] = [
  {
    title: "UK Business Tech Awards",
    type: "award",
    description:
      "UK-wide awards celebrating startups, scaleups, incubators, investors and organisations driving innovation across fintech, AI, healthtech and digital platforms.",
    organisation: "Don't Panic Events",
    website: "https://businesstechawards.com/",
    applicationUrl: "https://businesstechawards.com/",
    sourceUrl: "https://businesstechawards.com/",
    country: "United Kingdom",
    deadline: "2026-05-07",
    startDate: "2026-07-08",
    endDate: "2026-07-08",
    eligibility: "Open to UK technology startups, scaleups, incubators, investors and enterprises.",
  },
  {
    title: "National Technology Awards",
    type: "award",
    description:
      "The UK's National Technology Awards celebrate the pioneers of technology across the industry, organised by National Technology News (Perspective Publishing) and now in its 10th year.",
    organisation: "National Technology News",
    website: "https://nationaltechnologyawards.co.uk/",
    applicationUrl: "https://nationaltechnologyawards.co.uk/",
    sourceUrl: "https://nationaltechnologyawards.co.uk/",
    country: "United Kingdom",
    // No current-cycle entry deadline was stated on the official site at the
    // time this was added — left blank rather than guessed.
  },
  {
    title: "2026 Technology Awards",
    type: "award",
    description:
      "Business Awards UK's Technology Awards recognise innovators and leaders in AI, cloud technology, startup innovation and sustainable tech solutions. Free to enter — winners pay an award-acceptance fee for their trophy, and there is no ceremony.",
    organisation: "Business Awards UK",
    website: "https://business-awards.uk/technology-awards/",
    applicationUrl: "https://business-awards.uk/technology-awards/",
    sourceUrl: "https://business-awards.uk/technology-awards/",
    country: "United Kingdom",
    deadline: "2026-03-16",
    free: true,
    eligibility: "Open internationally to organisations that conduct significant business with UK-based companies.",
  },
];

export const manualAwardsSource: SourceAdapter = {
  name: "manual-awards",
  category: "award",
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
