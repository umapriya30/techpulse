import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getLlm } from "@/lib/ai/provider";
import type { SourceAdapter } from "@/lib/hunt/adapter";
import { manualAwardsSource } from "@/lib/hunt/sources/manual-awards";
import { manualVolunteeringSource } from "@/lib/hunt/sources/manual-volunteering";
import { manualSpeakingSource } from "@/lib/hunt/sources/manual-speaking";
import { manualJudgingSource } from "@/lib/hunt/sources/manual-judging";
import { manualMentoringSource } from "@/lib/hunt/sources/manual-mentoring";
import { manualGrantsSource } from "@/lib/hunt/sources/manual-grants";
import { manualCompetitionsSource } from "@/lib/hunt/sources/manual-competitions";
import { validateOpportunity } from "@/lib/hunt/validate";
import { findDuplicate, type DedupeCandidate } from "@/lib/hunt/dedupe";
import type { RawOpportunity } from "@/lib/hunt/types";

/**
 * Hunt ingestion pipeline: source -> ingest -> normalise -> dedupe ->
 * validate -> store -> AI enrich -> publish. Mirrors the shape of
 * lib/ai/ingest.ts::runNewsIngestion, but persists to Postgres (via
 * lib/prisma.ts) instead of returning an in-memory array, since Hunt is the
 * first section actually backed by a real database.
 *
 * ROADMAP (spec Phases 2-7, intentionally not built in Phase 1):
 *  - Launch Radar / a gated ProductHuntSourceAdapter (needs permitted API access)
 *  - Speaking / Judging / Mentoring / Startup-Competition source adapters
 *  - Duplicate source-count UI ("Found on: ✓ Official ✓ Eventbrite ✓ University")
 *  - Real AI match-score personalisation (the `relevanceScore` column already
 *    exists on Opportunity so this slots in without a schema change)
 *  - Calendar / reminders / opportunity tracker
 * To add a new source: implement SourceAdapter (lib/hunt/adapter.ts) and add
 * it to ADAPTERS below — its DataSource row is created automatically on its
 * first sync (see the upsert at the end of syncSource()).
 */

const ADAPTERS: SourceAdapter[] = [
  manualAwardsSource,
  manualVolunteeringSource,
  manualSpeakingSource,
  manualJudgingSource,
  manualMentoringSource,
  manualGrantsSource,
  manualCompetitionsSource,
];

export interface SourceSyncReport {
  source: string;
  fetched: number;
  stored: number;
  duplicates: number;
  needsReview: number;
  error?: string;
}

export async function runHuntSync(onlySource?: string): Promise<SourceSyncReport[]> {
  const reports: SourceSyncReport[] = [];
  for (const adapter of ADAPTERS) {
    if (onlySource && adapter.name !== onlySource) continue;
    // The DB row (once it exists) is the source of truth for enabled/disabled,
    // so the admin "Enable/disable" toggle actually takes effect on the next
    // sync — not just the adapter's own hardcoded default.
    const dbSource = await prisma.dataSource.findUnique({ where: { name: adapter.name } }).catch(() => null);
    const enabled = dbSource ? dbSource.enabled : adapter.enabled;
    if (!enabled) continue;
    reports.push(await syncSource(adapter));
  }
  return reports;
}

async function syncSource(adapter: SourceAdapter): Promise<SourceSyncReport> {
  const report: SourceSyncReport = {
    source: adapter.name,
    fetched: 0,
    stored: 0,
    duplicates: 0,
    needsReview: 0,
  };

  try {
    const raws = await adapter.fetch();
    report.fetched = raws.length;

    const existing: DedupeCandidate[] = await prisma.opportunity.findMany({
      where: { type: adapter.category },
      select: { id: true, title: true, organisation: true, sourceUrl: true },
    });

    const llm = getLlm();

    for (const item of raws) {
      const normalized = adapter.normalize(item);

      const dupe = findDuplicate(normalized, existing);
      if (dupe.duplicateOfId) {
        report.duplicates++;
        continue; // first-seen record already stored; skip the repeat rather than overwrite it
      }

      const problems = [...adapter.validate(normalized), ...validateOpportunity(normalized)];
      const enrichment = await llm.classifyOpportunity({
        title: normalized.title,
        description: normalized.description,
        type: normalized.type,
      });

      const slug = slugify(`${normalized.title}-${adapter.name}`);
      const status = problems.length ? "needs_review" : "published";
      const verificationStatus = adapter.type === "official" && problems.length === 0 ? "verified" : "needs_review";

      const row = {
        title: normalized.title,
        type: normalized.type,
        category: [...new Set([...(normalized.category ?? []), ...enrichment.category])],
        description: normalized.description,
        organisation: normalized.organisation,
        organisationLogo: normalized.organisationLogo ?? null,
        website: normalized.website,
        applicationUrl: normalized.applicationUrl ?? null,
        sourceUrl: adapter.getSourceUrl(normalized),
        sourceName: adapter.name,
        sourceType: adapter.type,
        location: normalized.location ?? null,
        country: normalized.country ?? null,
        city: normalized.city ?? null,
        remote: normalized.remote ?? false,
        hybrid: normalized.hybrid ?? false,
        startDate: normalized.startDate ? new Date(normalized.startDate) : null,
        endDate: normalized.endDate ? new Date(normalized.endDate) : null,
        deadline: normalized.deadline ? new Date(normalized.deadline) : null,
        price: normalized.price ?? null,
        free: normalized.free ?? true,
        prize: normalized.prize ?? null,
        eligibility: normalized.eligibility ?? null,
        studentEligible: normalized.studentEligible ?? enrichment.eligibilityGuess.studentEligible,
        graduateEligible: normalized.graduateEligible ?? enrichment.eligibilityGuess.graduateEligible,
        professionalEligible: normalized.professionalEligible ?? enrichment.eligibilityGuess.professionalEligible,
        founderEligible: normalized.founderEligible ?? enrichment.eligibilityGuess.founderEligible,
        skills: normalized.skills ?? [],
        technologies: normalized.technologies ?? [],
        industry: normalized.industry ?? null,
        tags: [...new Set([...(normalized.tags ?? []), ...enrichment.tags])],
        image: normalized.image ?? null,
        status,
        verificationStatus,
        lastVerifiedAt: verificationStatus === "verified" ? new Date() : null,
      };

      const saved = await prisma.opportunity.upsert({
        where: { slug },
        update: row,
        create: { slug, ...row },
      });
      existing.push({
        id: saved.id,
        title: saved.title,
        organisation: saved.organisation,
        sourceUrl: saved.sourceUrl,
      });

      report.stored++;
      if (status === "needs_review") report.needsReview++;
    }

    await prisma.dataSource.upsert({
      where: { name: adapter.name },
      update: { lastSyncAt: new Date(), recordCount: report.stored, errorCount: 0, lastError: null },
      create: {
        name: adapter.name,
        category: adapter.category,
        type: adapter.type,
        enabled: adapter.enabled,
        lastSyncAt: new Date(),
        recordCount: report.stored,
      },
    });
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
    await prisma.dataSource
      .upsert({
        where: { name: adapter.name },
        update: { lastError: report.error, errorCount: { increment: 1 } },
        create: {
          name: adapter.name,
          category: adapter.category,
          type: adapter.type,
          enabled: adapter.enabled,
          errorCount: 1,
          lastError: report.error,
        },
      })
      .catch(() => {
        /* DB unreachable — the caller's report.error already surfaces the failure */
      });
  }

  return report;
}

/** Runs the single-item pipeline path for a manual admin add or an approved user submission. */
export async function ingestSingleOpportunity(
  raw: RawOpportunity,
  sourceName: string,
  sourceType: SourceAdapter["type"],
): Promise<{ slug: string; status: string }> {
  const normalized = { ...raw, category: raw.category ?? [], skills: raw.skills ?? [], technologies: raw.technologies ?? [], tags: raw.tags ?? [] };
  const problems = [...validateOpportunity(normalized)];
  const llm = getLlm();
  const enrichment = await llm.classifyOpportunity({
    title: normalized.title,
    description: normalized.description,
    type: normalized.type,
  });
  const slug = slugify(`${normalized.title}-${sourceName}-${Date.now().toString(36)}`);
  const status = problems.length ? "needs_review" : "pending";

  await prisma.opportunity.create({
    data: {
      slug,
      title: normalized.title,
      type: normalized.type,
      category: [...new Set([...normalized.category, ...enrichment.category])],
      description: normalized.description,
      organisation: normalized.organisation,
      website: normalized.website,
      applicationUrl: normalized.applicationUrl ?? null,
      sourceUrl: normalized.sourceUrl,
      sourceName,
      sourceType,
      location: normalized.location ?? null,
      country: normalized.country ?? null,
      city: normalized.city ?? null,
      remote: normalized.remote ?? false,
      hybrid: normalized.hybrid ?? false,
      startDate: normalized.startDate ? new Date(normalized.startDate) : null,
      endDate: normalized.endDate ? new Date(normalized.endDate) : null,
      deadline: normalized.deadline ? new Date(normalized.deadline) : null,
      price: normalized.price ?? null,
      free: normalized.free ?? true,
      prize: normalized.prize ?? null,
      eligibility: normalized.eligibility ?? null,
      studentEligible: normalized.studentEligible ?? false,
      graduateEligible: normalized.graduateEligible ?? false,
      professionalEligible: normalized.professionalEligible ?? false,
      founderEligible: normalized.founderEligible ?? false,
      skills: normalized.skills,
      technologies: normalized.technologies,
      tags: [...new Set([...normalized.tags, ...enrichment.tags])],
      status,
      verificationStatus: "needs_review",
    },
  });

  return { slug, status };
}
