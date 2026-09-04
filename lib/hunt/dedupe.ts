import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Duplicate detection (spec §16): exact/normalised URL first, then
 * organisation + title, then title similarity alone (for the same listing
 * appearing under different aggregator names). The loser is skipped rather
 * than overwritten, so the first-seen (typically the official source per
 * lib/hunt/pipeline.ts's ADAPTERS ordering) wins.
 */

export interface DedupeCandidate {
  id: string;
  title: string;
  organisation: string;
  sourceUrl: string;
}

export interface DedupeResult {
  duplicateOfId: string | null;
  reason: string | null;
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

/** Jaccard similarity over token sets — 0 (no overlap) to 1 (identical). */
function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SAME_ORG_THRESHOLD = 0.6;
const CROSS_ORG_THRESHOLD = 0.85;

export function findDuplicate(
  raw: RawOpportunity,
  existing: DedupeCandidate[],
): DedupeResult {
  const rawUrl = normalizeUrl(raw.sourceUrl);
  for (const c of existing) {
    if (normalizeUrl(c.sourceUrl) === rawUrl) {
      return { duplicateOfId: c.id, reason: "exact source URL" };
    }
  }

  const orgKey = raw.organisation.trim().toLowerCase();
  const titleTokens = tokenize(raw.title);

  for (const c of existing) {
    if (c.organisation.trim().toLowerCase() !== orgKey) continue;
    const sim = similarity(titleTokens, tokenize(c.title));
    if (sim >= SAME_ORG_THRESHOLD) {
      return { duplicateOfId: c.id, reason: `title match (${Math.round(sim * 100)}%) under the same organisation` };
    }
  }

  for (const c of existing) {
    const sim = similarity(titleTokens, tokenize(c.title));
    if (sim >= CROSS_ORG_THRESHOLD) {
      return { duplicateOfId: c.id, reason: `high title similarity (${Math.round(sim * 100)}%)` };
    }
  }

  return { duplicateOfId: null, reason: null };
}
