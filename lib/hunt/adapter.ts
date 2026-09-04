import type { HuntCategory, RawOpportunity, SourceType } from "@/lib/hunt/types";

/**
 * Every Hunt data source — regardless of category — implements this. The
 * pipeline (lib/hunt/pipeline.ts) only ever talks to `SourceAdapter`, so a
 * new source (or a whole new category) plugs in without touching Hunt's core.
 *
 * `name` uniquely identifies its `DataSource` row (auto-created on first
 * sync — see lib/hunt/pipeline.ts) — the admin Data Sources dashboard and the
 * pipeline's per-source stats key off it.
 */
export interface SourceAdapter {
  name: string;
  category: HuntCategory;
  type: SourceType;
  enabled: boolean;
  /** Pull raw items from the source. Throw on hard failure; return [] if the source is just empty right now. */
  fetch(): Promise<RawOpportunity[]>;
  /** Fill safe defaults (free, remote, etc.) — never invent dates, prizes or eligibility. */
  normalize(raw: RawOpportunity): RawOpportunity;
  /** Required-field check per source (§17). Returns a list of problems; empty = valid. */
  validate(raw: RawOpportunity): string[];
  getSourceUrl(raw: RawOpportunity): string;
}

/** Shared defaults so individual adapters stay short. */
export function normalizeDefaults(raw: RawOpportunity): RawOpportunity {
  return {
    ...raw,
    free: raw.free ?? raw.price === undefined,
    remote: raw.remote ?? false,
    hybrid: raw.hybrid ?? false,
    category: raw.category ?? [],
    skills: raw.skills ?? [],
    technologies: raw.technologies ?? [],
    tags: raw.tags ?? [],
  };
}
