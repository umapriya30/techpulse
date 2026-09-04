import type { Hackathon, NewsArticle, TechEvent } from "@/lib/types";
import type { Opportunity } from "@/lib/hunt/types";
import { NewsCard } from "@/components/news-card";
import { EventCard } from "@/components/event-card";
import { HackathonCard } from "@/components/hackathon-card";
import { OpportunityCard } from "@/components/opportunity-card";
import { ButtonLink, EmptyState } from "@/components/ui";

const gridCls = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

export function NewsGrid({ items }: { items: NewsArticle[] }) {
  if (!items.length)
    return (
      <EmptyState
        title="No articles match your filters"
        description="Try removing a filter or broadening your time range."
        action={<ButtonLink href="/news" variant="outline">Reset filters</ButtonLink>}
      />
    );
  return (
    <div className={gridCls}>
      {items.map((a) => (
        <NewsCard key={a.id} article={a} />
      ))}
    </div>
  );
}

export function EventGrid({ items }: { items: TechEvent[] }) {
  if (!items.length)
    return (
      <EmptyState
        title="No events match your filters"
        description="Try a different city, date range or category — or check online events."
        action={<ButtonLink href="/events" variant="outline">Reset filters</ButtonLink>}
      />
    );
  return (
    <div className={gridCls}>
      {items.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

export function HackathonGrid({ items }: { items: Hackathon[] }) {
  if (!items.length)
    return (
      <EmptyState
        title="No hackathons match your filters"
        description="Try widening the deadline window or lowering the prize threshold."
        action={
          <ButtonLink href="/hackathons" variant="outline">
            Reset filters
          </ButtonLink>
        }
      />
    );
  return (
    <div className={gridCls}>
      {items.map((h) => (
        <HackathonCard key={h.id} hackathon={h} />
      ))}
    </div>
  );
}

export function OpportunityGrid({ items }: { items: Opportunity[] }) {
  if (!items.length)
    return (
      <EmptyState
        title="No opportunities match your filters"
        description="Try a different category, location or deadline window."
        action={<ButtonLink href="/hunt" variant="outline">Reset filters</ButtonLink>}
      />
    );
  return (
    <div className={gridCls}>
      {items.map((o) => (
        <OpportunityCard key={o.id} opportunity={o} />
      ))}
    </div>
  );
}
