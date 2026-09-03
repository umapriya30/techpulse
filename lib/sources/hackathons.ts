import type { Hackathon } from "@/lib/types";
import { fetchLiveHackathons as fetchDevpost } from "@/lib/sources/devpost";
import { fetchUkHackathons } from "@/lib/sources/ukhackathons";

/**
 * Live hackathons merged from:
 *  - Devpost public hackathons API (global, all technologies)
 *  - ukhackathons.com (UK-focused aggregator; crawl-friendly robots.txt)
 * De-duplicated by slug. Throws only if both sources yield nothing.
 */
export async function fetchLiveHackathons(): Promise<Hackathon[]> {
  const [dp, ukh] = await Promise.allSettled([
    fetchDevpost(),
    fetchUkHackathons(),
  ]);

  const merged: Hackathon[] = [];
  const seen = new Set<string>();
  // UK listings first so they win a slug collision (more locally relevant).
  for (const r of [ukh, dp]) {
    if (r.status !== "fulfilled") continue;
    for (const h of r.value) {
      if (seen.has(h.slug)) continue;
      seen.add(h.slug);
      merged.push(h);
    }
  }

  if (merged.length === 0) throw new Error("no live hackathons from any source");

  return merged.sort((a, b) => {
    const aAI = a.categories.includes("AI");
    const bAI = b.categories.includes("AI");
    if (aAI !== bAI) return aAI ? -1 : 1;
    return (
      +new Date(a.registrationDeadline) - +new Date(b.registrationDeadline)
    );
  });
}
