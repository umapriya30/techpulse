import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Trophy } from "lucide-react";
import { getOpportunity, queryOpportunities } from "@/lib/hunt/queries";
import { HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import { formatDate } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import { DeadlineBadge, VerificationStatusBadge } from "@/components/badges";
import { SaveButton, ShareButton } from "@/components/actions";
import { OpportunityCard } from "@/components/opportunity-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const o = await getOpportunity(slug).catch(() => null);
  if (!o) return { title: "Opportunity not found" };
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: `/hunt/${o.type}/${o.slug}` },
    openGraph: { title: o.title, description: o.description },
  };
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const o = await getOpportunity(slug).catch((err) => {
    console.warn("[OpportunityPage] getOpportunity failed:", err instanceof Error ? err.message : err);
    return null;
  });
  if (!o) notFound();

  const meta = HUNT_CATEGORY_LABEL[o.type];
  const related = (await queryOpportunities({ type: o.type }).catch(() => []))
    .filter((x) => x.id !== o.id)
    .slice(0, 3);

  const locationText = o.remote
    ? "Remote"
    : [o.city, o.country].filter(Boolean).join(", ") || null;

  return (
    <div className="container-page py-10">
      <Link
        href="/hunt"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Hunt
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              {meta.emoji} {meta.label}
            </Badge>
            {o.remote && <Badge tone="blue">Remote</Badge>}
            {o.hybrid && <Badge tone="brand">Hybrid</Badge>}
            <VerificationStatusBadge status={o.verificationStatus} />
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {o.title}
          </h1>
          <p className="mt-2 text-text-muted">by {o.organisation}</p>

          <Cover
            imageUrl={o.image ?? undefined}
            topic={`${meta.label} ${o.category.join(" ")}`}
            seed={o.slug}
            gradientKey="violet"
            label={meta.label}
            priority
            fit="contain"
            className="mt-6 aspect-[16/9] w-full rounded-2xl"
          />

          <section className="mt-8">
            <h2 className="text-xl font-bold">About</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-text-muted">
              {o.description}
            </p>
          </section>

          {o.eligibility && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Eligibility</h2>
              <p className="mt-3 leading-relaxed text-text-muted">{o.eligibility}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.studentEligible && <Badge tone="green">Students</Badge>}
                {o.graduateEligible && <Badge tone="green">Graduates</Badge>}
                {o.professionalEligible && <Badge tone="green">Professionals</Badge>}
                {o.founderEligible && <Badge tone="green">Founders</Badge>}
              </div>
            </section>
          )}

          {(o.category.length > 0 || o.tags.length > 0) && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set([...o.category, ...o.tags])].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-2 px-3 py-1 text-sm text-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dl className="space-y-3 text-sm">
              {locationText && (
                <Row icon={<MapPin className="h-4 w-4" />} label="Location">
                  {locationText}
                </Row>
              )}
              {o.startDate && (
                <Row icon={<CalendarDays className="h-4 w-4" />} label="Date">
                  {formatDate(o.startDate)}
                  {o.endDate && o.endDate.slice(0, 10) !== o.startDate.slice(0, 10)
                    ? ` – ${formatDate(o.endDate)}`
                    : ""}
                </Row>
              )}
              {o.prize && (
                <Row icon={<Trophy className="h-4 w-4" />} label="Prize">
                  {o.prize}
                </Row>
              )}
            </dl>

            {o.deadline && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-text-muted">Deadline</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{formatDate(o.deadline)}</span>
                  <DeadlineBadge deadline={o.deadline} />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <ButtonLink href={o.applicationUrl ?? o.website} external size="lg" className="w-full">
                Apply / Learn more
              </ButtonLink>
              <div className="flex gap-2">
                <SaveButton type="opportunity" slug={o.slug} title={o.title} variant="full" />
                <ShareButton title={o.title} path={`/hunt/${o.type}/${o.slug}`} variant="full" />
              </div>
            </div>

            <a
              href={o.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-text-muted hover:text-text"
            >
              Source: {o.sourceType === "manual" ? "Official organiser" : o.sourceName} — View
              original <ExternalLink className="h-3 w-3" />
            </a>
            {o.lastVerifiedAt && (
              <p className="mt-2 text-center text-[11px] text-text-muted">
                Last verified: {formatDate(o.lastVerifiedAt)}
              </p>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold">More {meta.label}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <OpportunityCard key={r.id} opportunity={r} />
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
