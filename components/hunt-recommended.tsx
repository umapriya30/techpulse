"use client";

import { useStore } from "@/app/providers";
import type { Opportunity } from "@/lib/hunt/types";
import { OpportunityGrid } from "@/components/grids";
import { SectionHeading, ButtonLink } from "@/components/ui";

/**
 * Real personalisation, not literal ML (per plan): a viewer's saved interests
 * (`Preferences.topics`, set in My TechPulse) are matched against each
 * opportunity's category/tags/skills/technologies. The `relevanceScore`
 * column exists on Opportunity for a future, richer scoring model.
 */
export function HuntRecommended({ items }: { items: Opportunity[] }) {
  const { ready, prefs } = useStore();
  if (!ready) return null;

  const topics = prefs.topics.map((t) => t.toLowerCase());
  if (!topics.length) {
    return (
      <section className="mb-12">
        <SectionHeading
          eyebrow="🎯 Recommended For You"
          title="Personalise your Hunt feed"
          action={
            <ButtonLink href="/saved" variant="outline">
              Set your interests
            </ButtonLink>
          }
        />
        <p className="text-sm text-text-muted">
          Pick your interests in My TechPulse to see opportunities matched to you here.
        </p>
      </section>
    );
  }

  const recommended = items
    .filter((o) =>
      [...o.category, ...o.tags, ...o.skills, ...o.technologies].some((t) =>
        topics.includes(t.toLowerCase()),
      ),
    )
    .slice(0, 6);

  if (!recommended.length) return null;

  return (
    <section className="mb-12">
      <SectionHeading eyebrow="🎯 Recommended For You" title="Matched to your interests" />
      <OpportunityGrid items={recommended} />
    </section>
  );
}
