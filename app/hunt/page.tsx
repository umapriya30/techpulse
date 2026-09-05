import type { Metadata } from "next";
import Link from "next/link";
import { queryOpportunities } from "@/lib/hunt/queries";
import { trendingTopics } from "@/lib/queries";
import { daysUntil } from "@/lib/utils";
import { ACTIVE_HUNT_CATEGORIES, HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import { OpportunityGrid } from "@/components/grids";
import { SectionHeading, ButtonLink, EmptyState } from "@/components/ui";
import { HuntRecommended } from "@/components/hunt-recommended";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hunt",
  description:
    "Your personal radar for everything happening in tech — awards, hackathons, volunteering, speaking and more, all in one place.",
};

export default async function HuntPage() {
  const [items, topics] = await Promise.all([
    // Hunt is DB-backed (unlike the rest of TechPulse) — degrade to an empty
    // feed rather than crashing the page if the database isn't configured
    // or reachable, same fallback philosophy as lib/provider.ts.
    queryOpportunities({ type: ACTIVE_HUNT_CATEGORIES }).catch((err) => {
      console.warn("[HuntPage] queryOpportunities failed:", err instanceof Error ? err.message : err);
      return [];
    }),
    trendingTopics(8).catch(() => []),
  ]);

  const closing = items
    .filter((o) => o.deadline && daysUntil(o.deadline) >= 0 && daysUntil(o.deadline) <= 30)
    .sort((a, b) => daysUntil(a.deadline as string) - daysUntil(b.deadline as string))
    .slice(0, 6);

  const newlyAdded = [...items]
    .sort((a, b) => +new Date(b.discoveredAt) - +new Date(a.discoveredAt))
    .slice(0, 6);

  const topicNames = new Set(topics.map((t) => t.topic.toLowerCase()));
  const trending = items
    .filter((o) => [...o.category, ...o.tags].some((t) => topicNames.has(t.toLowerCase())))
    .slice(0, 6);

  return (
    <div className="container-page py-10">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">🎯 Hunt</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Your personal radar for everything happening in tech
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          What can I apply for? Attend? Win? Volunteer for? Speak at? Build?
          Every opportunity links back to its real source — nothing here is
          invented.
        </p>
      </header>

      {/* Only categories with real data get a chip — no "Coming soon" clutter. */}
      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Hunt categories">
        {ACTIVE_HUNT_CATEGORIES.map((c) => {
          const meta = HUNT_CATEGORY_LABEL[c];
          return (
            <Link
              key={c}
              href={`/hunt/${c}`}
              className="rounded-full border border-brand bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/15"
            >
              {meta.emoji} {meta.label}
            </Link>
          );
        })}
      </nav>

      <HuntRecommended items={items} />

      <section className="mb-12">
        <SectionHeading eyebrow="🔥 Trending" title="Trending in tech right now" />
        {trending.length ? (
          <OpportunityGrid items={trending} />
        ) : (
          <EmptyState
            title="Nothing trending yet"
            description="Trending is based on today's site-wide tech topics — check back as more sources sync."
          />
        )}
      </section>

      <section className="mb-12">
        <SectionHeading eyebrow="⏰ Closing Soon" title="Don't miss these deadlines" />
        {closing.length ? (
          <OpportunityGrid items={closing} />
        ) : (
          <EmptyState title="Nothing closing in the next 30 days" />
        )}
      </section>

      <section className="mb-12">
        <SectionHeading eyebrow="🆕 Newly Added" title="Fresh on Hunt" />
        {newlyAdded.length ? (
          <OpportunityGrid items={newlyAdded} />
        ) : (
          <EmptyState title="No opportunities yet" description="Sources sync daily — check back soon." />
        )}
      </section>

      {ACTIVE_HUNT_CATEGORIES.map((c) => {
        const meta = HUNT_CATEGORY_LABEL[c];
        const catItems = items.filter((o) => o.type === c).slice(0, 6);
        return (
          <section key={c} className="mb-12">
            <SectionHeading
              eyebrow={`${meta.emoji} ${meta.label}`}
              title={meta.label}
              action={
                <ButtonLink href={`/hunt/${c}`} variant="outline">
                  See all
                </ButtonLink>
              }
            />
            {catItems.length ? (
              <OpportunityGrid items={catItems} />
            ) : (
              <EmptyState title={`No ${meta.label.toLowerCase()} yet`} />
            )}
          </section>
        );
      })}
    </div>
  );
}
