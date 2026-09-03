import { slugify } from "@/lib/utils";
import { getLlm, type ClassifyInput } from "@/lib/ai/provider";
import type { NewsArticle } from "@/lib/types";

/**
 * News ingestion pipeline (schematic, MVP implementation).
 *
 *   raw sources -> normalise -> dedupe -> AI classify + summarise + topics -> store
 *
 * `runNewsIngestion` runs the full pass over a batch of raw items and returns
 * ready-to-store NewsArticle records. In production the raw items come from RSS
 * / official APIs and the output is written via the data provider; here it is
 * exercised by `npm run ingest:demo` and the /api/ingest/preview route.
 */

export interface RawArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  source: string;
  imageColor?: string;
  imageUrl?: string;
  publishedAt?: string;
}

export interface IngestReport {
  fetched: number;
  deduped: number;
  stored: NewsArticle[];
}

function fingerprint(a: RawArticle): string {
  return slugify(a.title).slice(0, 60);
}

export async function runNewsIngestion(
  raw: RawArticle[],
  existingFingerprints: Set<string> = new Set(),
): Promise<IngestReport> {
  const llm = getLlm();
  const seen = new Set(existingFingerprints);
  const stored: NewsArticle[] = [];
  let deduped = 0;

  for (const item of raw) {
    // 1. normalise + 2. dedupe
    const fp = fingerprint(item);
    if (seen.has(fp)) {
      deduped++;
      continue;
    }
    seen.add(fp);

    // 3. + 4. + 5. + 6. classify / summarise / extract topics
    const input: ClassifyInput = {
      title: item.title,
      body: item.content || item.description,
      source: item.source,
    };
    const c = await llm.classifyArticle(input);

    // 7. detect trending  8. build record for storage
    stored.push({
      id: `ing-${fp}`,
      slug: slugify(item.title),
      title: item.title,
      summary: c.summary,
      content: item.content || item.description,
      imageColor: item.imageColor ?? "violet",
      imageUrl: item.imageUrl,
      source: item.source,
      sourceUrl: item.url,
      category: c.category,
      subcategory: c.subcategory,
      tags: c.tags,
      publishedAt: item.publishedAt ?? new Date().toISOString(),
      readMinutes: Math.max(
        2,
        Math.round((item.content || item.description).split(/\s+/).length / 200),
      ),
      trending: c.trending,
      verifiedSource: true,
    });
  }

  return { fetched: raw.length, deduped, stored };
}
