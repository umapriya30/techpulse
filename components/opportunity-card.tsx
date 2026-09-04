import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Opportunity } from "@/lib/hunt/types";
import { HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import { DeadlineBadge, VerificationStatusBadge } from "@/components/badges";
import { SaveButton, ShareButton } from "@/components/actions";

export function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  const meta = HUNT_CATEGORY_LABEL[o.type];
  const locationText = o.remote
    ? "Remote"
    : o.hybrid
      ? `Hybrid${o.city ? ` · ${o.city}` : ""}`
      : o.city || o.country || "Location TBC";
  const href = `/hunt/${o.type}/${o.slug}`;

  return (
    <article className="group card-hover flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <Link href={href} className="relative block" aria-label={o.title}>
        <Cover
          imageUrl={o.image ?? undefined}
          topic={`${meta.label} ${o.category.join(" ")}`}
          seed={o.slug}
          gradientKey="violet"
          label={meta.label}
          className="h-36 w-full"
          icon={
            <span className="text-2xl">
              {meta.emoji} <span className="align-middle text-xs">{meta.label}</span>
            </span>
          }
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{meta.label}</Badge>
          <Badge tone="neutral">
            <MapPin className="h-3 w-3" /> {locationText}
          </Badge>
        </div>

        <h3 className="mt-2 line-clamp-2 font-bold leading-snug">
          <Link href={href} className="transition-colors hover:text-brand focus-ring rounded">
            {o.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-text-muted">by {o.organisation}</p>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-text-muted">{o.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {o.category.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted">
              {c}
            </span>
          ))}
          <VerificationStatusBadge status={o.verificationStatus} />
        </div>

        {o.deadline && (
          <div className="mt-3">
            <DeadlineBadge deadline={o.deadline} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ButtonLink href={href} size="sm">
              View
            </ButtonLink>
            <ButtonLink href={o.applicationUrl ?? o.website} size="sm" variant="outline" external>
              Apply
            </ButtonLink>
          </div>
          <div className="flex gap-1.5">
            <SaveButton type="opportunity" slug={o.slug} title={o.title} />
            <ShareButton title={o.title} path={href} />
          </div>
        </div>
      </div>
    </article>
  );
}
