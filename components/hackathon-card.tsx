import Link from "next/link";
import { Clock, Trophy, Users } from "lucide-react";
import type { Hackathon } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import {
  DeadlineBadge,
  LocationBadge,
  UnverifiedBadge,
  VerifiedBadge,
} from "@/components/badges";
import { SaveButton, ShareButton } from "@/components/actions";

export function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const h = hackathon;
  return (
    <article className="group card-hover flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <Link
        href={`/hackathons/${h.slug}`}
        className="relative block"
        aria-label={h.title}
      >
        <Cover
          imageUrl={h.imageUrl}
          topic={`hackathon ${h.categories.join(" ")} ${h.technologies.join(" ")}`}
          seed={h.slug}
          gradientKey={h.imageColor}
          label="Hackathon"
          className="h-32 w-full"
          icon={<span className="text-2xl">🏆</span>}
        />
        <div className="absolute left-3 top-3">
          <DeadlineBadge deadline={h.registrationDeadline} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{h.difficulty}</Badge>
          <LocationBadge mode={h.mode} city={h.city} country={h.country} />
        </div>

        <h3 className="mt-2 line-clamp-2 font-bold leading-snug">
          <Link
            href={`/hackathons/${h.slug}`}
            className="transition-colors hover:text-brand focus-ring rounded"
          >
            {h.title}
          </Link>
        </h3>

        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0" />{" "}
            {h.durationHours > 0 ? `${h.durationHours}h` : h.region}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0" /> {h.teamMin}–{h.teamMax}
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 shrink-0 text-amber" />
            <span className="font-semibold text-text">
              {h.prizePool > 0
                ? `${formatMoney(h.prizePool, h.currency)} prize pool`
                : "See site for prizes"}
            </span>
          </div>
        </dl>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-text-muted">
          {h.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {h.technologies.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-2 text-xs text-text-muted">
          Deadline: {formatDate(h.registrationDeadline)} ·{" "}
          {h.verified ? <VerifiedBadge className="align-middle" /> : <UnverifiedBadge className="align-middle" />}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ButtonLink href={`/hackathons/${h.slug}`} size="sm">
              View
            </ButtonLink>
            <ButtonLink
              href={h.registrationUrl}
              size="sm"
              variant="outline"
              external
            >
              Register
            </ButtonLink>
          </div>
          <div className="flex gap-1.5">
            <SaveButton type="hackathon" slug={h.slug} title={h.title} />
            <ShareButton title={h.title} path={`/hackathons/${h.slug}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
