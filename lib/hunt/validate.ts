import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Required-field + basic sanity checks (spec §17). Anything that fails goes
 * to "needs_review" instead of being published — never silently dropped, and
 * never auto-published either.
 */
export function validateOpportunity(raw: RawOpportunity): string[] {
  const problems: string[] = [];

  if (!raw.title?.trim()) problems.push("Missing title");
  if (!raw.description?.trim()) problems.push("Missing description");
  if (!raw.organisation?.trim()) problems.push("Missing organisation");
  if (!raw.sourceUrl?.trim()) problems.push("Missing source URL");
  if (!raw.website?.trim()) problems.push("Missing website");

  for (const [field, value] of [
    ["sourceUrl", raw.sourceUrl],
    ["website", raw.website],
    ["applicationUrl", raw.applicationUrl],
  ] as const) {
    if (value && !isHttpUrl(value)) problems.push(`Invalid URL for ${field}`);
  }

  for (const [field, value] of [
    ["startDate", raw.startDate],
    ["endDate", raw.endDate],
    ["deadline", raw.deadline],
  ] as const) {
    if (value && Number.isNaN(Date.parse(value))) problems.push(`Invalid date for ${field}`);
  }

  if (raw.deadline && raw.endDate && Date.parse(raw.deadline) > Date.parse(raw.endDate) + 86_400_000) {
    problems.push("Deadline is after end date");
  }

  return problems;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
