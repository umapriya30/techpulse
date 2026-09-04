"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useStore } from "@/app/providers";
import type { Hackathon, NewsArticle, TechEvent } from "@/lib/types";
import type { Opportunity } from "@/lib/hunt/types";
import { HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import { NewsCard } from "@/components/news-card";
import { EventCard } from "@/components/event-card";
import { HackathonCard } from "@/components/hackathon-card";
import { OpportunityCard } from "@/components/opportunity-card";
import { PreferencesPanel } from "@/components/preferences-panel";
import { EmptyState, ButtonLink } from "@/components/ui";
import { DeadlineBadge } from "@/components/badges";
import { daysUntil, formatDate } from "@/lib/utils";

export function Dashboard({
  news,
  events,
  hackathons,
  opportunities,
}: {
  news: NewsArticle[];
  events: TechEvent[];
  hackathons: Hackathon[];
  opportunities: Opportunity[];
}) {
  const { bookmarks, ready, user, prefs } = useStore();

  if (!ready) {
    return (
      <div className="container-page py-10">
        <div className="h-8 w-48 rounded skeleton" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const savedNews = news.filter((n) =>
    bookmarks.some((b) => b.type === "news" && b.slug === n.slug),
  );
  const savedEvents = events.filter((e) =>
    bookmarks.some((b) => b.type === "event" && b.slug === e.slug),
  );
  const savedHackathons = hackathons.filter((h) =>
    bookmarks.some((b) => b.type === "hackathon" && b.slug === h.slug),
  );
  const savedOpportunities = opportunities.filter((o) =>
    bookmarks.some((b) => b.type === "opportunity" && b.slug === o.slug),
  );

  const deadlines = [
    ...savedEvents
      .filter((e) => e.registrationDeadline)
      .map((e) => ({
        title: e.title,
        href: `/events/${e.slug}`,
        date: e.registrationDeadline as string,
        kind: "🎤 Event",
      })),
    ...savedHackathons.map((h) => ({
      title: h.title,
      href: `/hackathons/${h.slug}`,
      date: h.registrationDeadline,
      kind: "🏆 Hackathon",
    })),
    ...savedOpportunities
      .filter((o) => o.deadline)
      .map((o) => ({
        title: o.title,
        href: `/hunt/${o.type}/${o.slug}`,
        date: o.deadline as string,
        kind: `${HUNT_CATEGORY_LABEL[o.type].emoji} ${HUNT_CATEGORY_LABEL[o.type].label}`,
      })),
  ]
    .filter((d) => daysUntil(d.date) >= 0)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const calendar = savedEvents
    .filter((e) => daysUntil(e.endDate) >= 0)
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));

  const totalSaved =
    savedNews.length + savedEvents.length + savedHackathons.length + savedOpportunities.length;

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          My TechPulse
        </h1>
        <p className="mt-2 text-text-muted">
          {user ? `Signed in as ${user.name}. ` : ""}
          {totalSaved === 0
            ? "Save news, events, hackathons and Hunt opportunities to build your personal dashboard."
            : `You have ${totalSaved} saved item${totalSaved === 1 ? "" : "s"}.`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          {/* Upcoming deadlines */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Upcoming deadlines</h2>
            {deadlines.length === 0 ? (
              <p className="text-sm text-text-muted">
                No deadlines from your saved items. Save a hackathon or an event
                that needs registration to track it here.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
                {deadlines.map((d) => (
                  <li key={d.href}>
                    <Link
                      href={d.href}
                      className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-surface-2"
                    >
                      <CalendarClock className="h-5 w-5 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {d.title}
                        </span>
                        <span className="text-xs text-text-muted">
                          {d.kind} · {formatDate(d.date)} ·{" "}
                          {daysUntil(d.date)} day
                          {daysUntil(d.date) === 1 ? "" : "s"} remaining
                        </span>
                      </span>
                      <DeadlineBadge deadline={d.date} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DashSection
            title="Saved News"
            empty="No saved articles yet."
            emptyHref="/news"
            emptyCta="Browse news"
            count={savedNews.length}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {savedNews.map((n) => (
                <NewsCard key={n.id} article={n} />
              ))}
            </div>
          </DashSection>

          <DashSection
            title="Saved Events"
            empty="No saved events yet."
            emptyHref="/events"
            emptyCta="Browse events"
            count={savedEvents.length}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {savedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </DashSection>

          <DashSection
            title="Saved Hackathons"
            empty="No saved hackathons yet."
            emptyHref="/hackathons"
            emptyCta="Browse hackathons"
            count={savedHackathons.length}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {savedHackathons.map((h) => (
                <HackathonCard key={h.id} hackathon={h} />
              ))}
            </div>
          </DashSection>

          <DashSection
            title="Saved from Hunt"
            empty="No saved opportunities yet."
            emptyHref="/hunt"
            emptyCta="Browse Hunt"
            count={savedOpportunities.length}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {savedOpportunities.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} />
              ))}
            </div>
          </DashSection>

          {/* My calendar */}
          <section>
            <h2 className="mb-4 text-xl font-bold">My calendar</h2>
            {calendar.length === 0 ? (
              <p className="text-sm text-text-muted">
                Saved upcoming events will appear here as a simple agenda.
              </p>
            ) : (
              <ol className="space-y-2">
                {calendar.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="shrink-0 text-center">
                      <p className="text-lg font-black leading-none">
                        {new Date(e.startDate).getDate()}
                      </p>
                      <p className="text-xs uppercase text-text-muted">
                        {new Date(e.startDate).toLocaleDateString("en-GB", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/events/${e.slug}`}
                        className="block truncate font-semibold hover:text-brand"
                      >
                        {e.title}
                      </Link>
                      <p className="text-xs text-text-muted">
                        {e.time} ·{" "}
                        {e.mode === "Online" ? "Online" : e.city}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <PreferencesPanel />
          {prefs.onboarded && (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <p className="font-semibold">Your interests</p>
              <p className="mt-1 text-text-muted">
                {prefs.topics.length
                  ? prefs.topics.join(", ")
                  : "None selected"}
              </p>
              <p className="mt-2 font-semibold">Preferred locations</p>
              <p className="mt-1 text-text-muted">
                {prefs.locations.length
                  ? prefs.locations.join(", ")
                  : "None selected"}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DashSection({
  title,
  count,
  empty,
  emptyHref,
  emptyCta,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  emptyHref: string;
  emptyCta: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">
        {title}{" "}
        <span className="text-sm font-normal text-text-muted">({count})</span>
      </h2>
      {count === 0 ? (
        <EmptyState
          title={empty}
          action={
            <ButtonLink href={emptyHref} variant="outline">
              {emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        children
      )}
    </section>
  );
}
