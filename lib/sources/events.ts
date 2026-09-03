import type { TechEvent } from "@/lib/types";
import { fetchConferences } from "@/lib/sources/conferences";
import { fetchDevEvents } from "@/lib/sources/devevents";
import { fetchEventbrite } from "@/lib/sources/eventbrite";

/**
 * Live events, merged & de-duplicated from open, reuse-friendly datasets:
 *  - developers.events             (open GitHub tech-event dataset — primary)
 *  - confs.tech / tech-conferences  (open GitHub conference dataset)
 *
 * Eventbrite is OFF by default: their Terms of Service prohibit scraping and
 * this project is meant to be shared publicly. Set TECHPULSE_EVENTBRITE=on
 * only if you have permission / an official API arrangement.
 *
 * Throws only if every source yields nothing, so the provider can fall back.
 */
export async function fetchLiveEvents(): Promise<TechEvent[]> {
  const tasks = [fetchDevEvents(), fetchConferences()];
  if (process.env.TECHPULSE_EVENTBRITE === "on") tasks.push(fetchEventbrite());

  const settled = await Promise.allSettled(tasks);

  const merged: TechEvent[] = [];
  const seen = new Set<string>();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const e of r.value) {
      if (seen.has(e.slug)) continue;
      seen.add(e.slug);
      merged.push(e);
    }
  }

  if (merged.length === 0) throw new Error("no live events from any source");
  return merged.sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
}
