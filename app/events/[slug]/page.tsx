import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Globe2,
  Linkedin,
  MapPin,
  Ticket,
} from "lucide-react";
import { provider } from "@/lib/provider";
import { queryEvents } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import {
  DeadlineBadge,
  LocationBadge,
  UnverifiedBadge,
  VerifiedBadge,
} from "@/components/badges";
import { CalendarButton, SaveButton, ShareButton } from "@/components/actions";
import { WhyMatch } from "@/components/why-match";
import { EventCard } from "@/components/event-card";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  return [] as { slug: string }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await provider.getEvent(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title: event.title, description: event.description },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await provider.getEvent(slug);
  if (!event) notFound();

  const related = (await queryEvents({ categories: event.categories }))
    .filter((e) => e.id !== event.id)
    .slice(0, 3);

  const locationText =
    event.mode === "Online"
      ? "Online"
      : `${event.venue ? event.venue + ", " : ""}${event.city ?? "UK"}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventAttendanceMode:
      event.mode === "Online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.mode === "Hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.mode === "Online"
        ? { "@type": "VirtualLocation", url: event.websiteUrl }
        : {
            "@type": "Place",
            name: event.venue ?? event.city,
            address: `${event.city}, ${event.country}`,
          },
    organizer: { "@type": "Organization", name: event.organizer },
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: event.currency,
      url: event.registrationUrl,
    },
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{event.eventType}</Badge>
            <LocationBadge
              mode={event.mode}
              city={event.city}
              country={event.country}
            />
            {event.verified ? <VerifiedBadge /> : <UnverifiedBadge />}
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-2 text-text-muted">by {event.organizer}</p>

          <Cover
            imageUrl={event.imageUrl}
            topic={`${event.eventType} ${event.categories.join(" ")} ${event.topics.join(" ")}`}
            seed={event.slug}
            gradientKey={event.imageColor}
            label={event.eventType}
            priority
            fit="contain"
            className="mt-6 aspect-[16/9] w-full rounded-2xl"
          />

          <section className="mt-8">
            <h2 className="text-xl font-bold">About</h2>
            <p className="mt-3 leading-relaxed text-text-muted">{event.about}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Topics</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...event.categories, ...event.topics].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-surface-2 px-3 py-1 text-sm text-text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {event.speakers.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Speakers</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {event.speakers.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand">
                      {s.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-text-muted">
                        {s.title}, {s.company}
                      </p>
                    </div>
                    {s.linkedin && (
                      <a
                        href={s.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.name} on LinkedIn`}
                        className="ml-auto text-text-muted hover:text-brand"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {event.schedule.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Schedule</h2>
              <ol className="mt-3 space-y-3 border-l border-border pl-5">
                {event.schedule.map((item, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {item.time}
                    </p>
                    <p className="text-sm">
                      {item.title}
                      {item.speaker && (
                        <span className="text-text-muted"> · {item.speaker}</span>
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dl className="space-y-3 text-sm">
              <Row icon={<CalendarDays className="h-4 w-4" />} label="Date">
                {formatDate(event.startDate)}
                {event.endDate.slice(0, 10) !== event.startDate.slice(0, 10) &&
                  ` – ${formatDate(event.endDate)}`}
              </Row>
              <Row icon={<Clock className="h-4 w-4" />} label="Time">
                {event.time}
              </Row>
              <Row
                icon={
                  event.mode === "Online" ? (
                    <Globe2 className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )
                }
                label="Location"
              >
                {locationText}
                <span className="block text-text-muted">{event.mode}</span>
              </Row>
              <Row icon={<Ticket className="h-4 w-4" />} label="Price">
                {formatPrice(event.price)}
              </Row>
            </dl>

            {event.registrationDeadline && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-text-muted">Registration closes</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatDate(event.registrationDeadline)}
                  </span>
                  <DeadlineBadge deadline={event.registrationDeadline} />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <ButtonLink
                href={event.registrationUrl}
                external
                size="lg"
                className="w-full"
              >
                Register for Event
              </ButtonLink>
              <CalendarButton
                title={event.title}
                description={event.description}
                location={locationText}
                start={event.startDate}
                end={event.endDate}
              />
              <div className="flex gap-2">
                <SaveButton
                  type="event"
                  slug={event.slug}
                  title={event.title}
                  variant="full"
                />
                <ShareButton
                  title={event.title}
                  path={`/events/${event.slug}`}
                  variant="full"
                />
              </div>
            </div>

            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-xs text-text-muted hover:text-text"
            >
              Official event website ↗
            </a>
          </div>

          <WhyMatch
            topics={[...event.categories, ...event.topics]}
            location={[
              event.city ?? "",
              event.mode === "Online" ? "Online" : "UK",
            ]}
          />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold">Related events</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-text-muted">{icon}</span>
      <div>
        <dt className="text-xs text-text-muted">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}
