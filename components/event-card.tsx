import Link from "next/link";
import { CalendarDays, Ticket } from "lucide-react";
import type { TechEvent } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import {
  DeadlineBadge,
  LocationBadge,
  UnverifiedBadge,
  VerifiedBadge,
} from "@/components/badges";
import { SaveButton, ShareButton } from "@/components/actions";

const TYPE_EMOJI: Record<string, string> = {
  Conference: "🎤",
  Summit: "🏔",
  Meetup: "👥",
  Workshop: "🛠",
  Webinar: "💻",
  Hackathon: "🏆",
  Networking: "🤝",
  Training: "🎓",
  Exhibition: "🏛",
};

export function EventCard({ event }: { event: TechEvent }) {
  return (
    <article className="group card-hover flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <Link
        href={`/events/${event.slug}`}
        className="relative block"
        aria-label={event.title}
      >
        <Cover
          imageUrl={event.imageUrl}
          topic={`${event.eventType} ${event.categories.join(" ")} ${event.topics.join(" ")}`}
          seed={event.slug}
          gradientKey={event.imageColor}
          label={event.eventType}
          className="h-36 w-full"
          icon={
            <span className="text-2xl">
              {TYPE_EMOJI[event.eventType] ?? "🎤"}{" "}
              <span className="align-middle text-xs">{event.eventType}</span>
            </span>
          }
        />
        {event.featured && (
          <Badge className="absolute right-3 top-3 bg-black/40 text-white backdrop-blur">
            ★ Featured
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{event.eventType}</Badge>
          <LocationBadge
            mode={event.mode}
            city={event.city}
            country={event.country}
          />
        </div>

        <h3 className="mt-2 line-clamp-2 font-bold leading-snug">
          <Link
            href={`/events/${event.slug}`}
            className="transition-colors hover:text-brand focus-ring rounded"
          >
            {event.title}
          </Link>
        </h3>

        <dl className="mt-2 space-y-1 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <dd>{formatDate(event.startDate)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 shrink-0" />
            <dd>
              {formatPrice(event.price)}
              {event.registrationRequired ? " · Registration required" : ""}
            </dd>
          </div>
        </dl>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-text-muted">
          {event.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted"
            >
              {c}
            </span>
          ))}
          {event.verified ? <VerifiedBadge /> : <UnverifiedBadge />}
        </div>

        {event.registrationDeadline && (
          <div className="mt-3">
            <DeadlineBadge deadline={event.registrationDeadline} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ButtonLink href={`/events/${event.slug}`} size="sm">
              View Event
            </ButtonLink>
            <ButtonLink
              href={event.registrationUrl}
              size="sm"
              variant="outline"
              external
            >
              Register
            </ButtonLink>
          </div>
          <div className="flex gap-1.5">
            <SaveButton type="event" slug={event.slug} title={event.title} />
            <ShareButton title={event.title} path={`/events/${event.slug}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
