import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Trophy, Users } from "lucide-react";
import { provider } from "@/lib/provider";
import { queryHackathons } from "@/lib/queries";
import {
  daysUntil,
  deadlineState,
  formatDate,
  formatMoney,
} from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import {
  LocationBadge,
  UnverifiedBadge,
  VerifiedBadge,
} from "@/components/badges";
import { CalendarButton, SaveButton, ShareButton } from "@/components/actions";
import { WhyMatch } from "@/components/why-match";
import { HackathonCard } from "@/components/hackathon-card";

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
  const h = await provider.getHackathon(slug);
  if (!h) return { title: "Hackathon not found" };
  return {
    title: h.title,
    description: h.description,
    alternates: { canonical: `/hackathons/${h.slug}` },
    openGraph: { title: h.title, description: h.description },
  };
}

export default async function HackathonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const h = await provider.getHackathon(slug);
  if (!h) notFound();

  const related = (await queryHackathons({ categories: h.categories }))
    .filter((x) => x.id !== h.id)
    .slice(0, 3);

  const d = deadlineState(h.registrationDeadline);
  const open = daysUntil(h.registrationDeadline) >= 0;

  return (
    <div className="container-page py-10">
      <Link
        href="/hackathons"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Hackathons
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{h.difficulty}</Badge>
            <LocationBadge mode={h.mode} city={h.city} country={h.country} />
            {h.verified ? <VerifiedBadge /> : <UnverifiedBadge />}
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {h.title}
          </h1>
          <p className="mt-2 text-text-muted">Organised by {h.organizer}</p>

          {/* Big deadline banner */}
          <div
            className={`mt-6 flex items-center gap-4 rounded-2xl border p-5 ${
              d.tone === "red"
                ? "border-danger/40 bg-danger/10"
                : d.tone === "amber"
                  ? "border-amber/40 bg-amber/10"
                  : d.tone === "green"
                    ? "border-accent/40 bg-accent/10"
                    : "border-border bg-surface"
            }`}
          >
            <CalendarClock
              className={`h-8 w-8 shrink-0 ${
                d.tone === "red"
                  ? "text-danger"
                  : d.tone === "amber"
                    ? "text-amber"
                    : "text-accent"
              }`}
            />
            <div>
              <p className="text-lg font-black uppercase tracking-tight">
                {open ? `${d.label} 🔥` : "Registration closed"}
              </p>
              <p className="text-sm text-text-muted">
                Registration deadline: {formatDate(h.registrationDeadline)}
              </p>
            </div>
          </div>

          <Cover
            imageUrl={h.imageUrl}
            topic={`hackathon ${h.categories.join(" ")} ${h.technologies.join(" ")}`}
            seed={h.slug}
            gradientKey={h.imageColor}
            label="Hackathon"
            priority
            fit="contain"
            className="mt-6 aspect-[16/9] w-full rounded-2xl"
            icon={<span className="text-3xl">🏆</span>}
          />

          <section className="mt-8">
            <h2 className="text-xl font-bold">The challenge</h2>
            <p className="mt-3 leading-relaxed text-text-muted">{h.challenge}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Requirements &amp; eligibility</h2>
            <ul className="mt-3 space-y-2">
              {h.requirements.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Prizes</h2>
            <div className="mt-3 space-y-2">
              {h.prizes.map((p) => (
                <div
                  key={p.place}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <span className="font-medium">
                    {medal(p.place)} {p.place}
                    {p.note && (
                      <span className="text-text-muted"> — {p.note}</span>
                    )}
                  </span>
                  <span className="font-bold text-amber">
                    {formatMoney(p.amount, h.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Important dates</h2>
            <ol className="mt-3 space-y-3 border-l border-border pl-5">
              {h.keyDates.map((k) => (
                <li key={k.label} className="relative">
                  <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="text-xs text-text-muted">{formatDate(k.date)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Stat
                label="Prize pool"
                value={h.prizePool > 0 ? formatMoney(h.prizePool, h.currency) : "See site"}
                icon={<Trophy className="h-4 w-4 text-amber" />}
              />
              <Stat
                label="Duration"
                value={h.durationHours > 0 ? `${h.durationHours}h` : "See site"}
              />
              <Stat label="Team size" value={`${h.teamMin}–${h.teamMax}`} icon={<Users className="h-4 w-4" />} />
              <Stat label="Difficulty" value={h.difficulty} />
              <Stat label="Region" value={h.region} />
              <Stat label="Format" value={h.mode} />
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs text-text-muted">Technologies</p>
              <div className="flex flex-wrap gap-1.5">
                {h.technologies.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <ButtonLink
                href={h.registrationUrl}
                external
                size="lg"
                className="w-full"
              >
                {open ? "Join Hackathon 🚀" : "View on organiser site"}
              </ButtonLink>
              <CalendarButton
                title={`${h.title} — registration deadline`}
                description={h.description}
                location={h.mode === "Online" ? "Online" : (h.city ?? "UK")}
                start={h.registrationDeadline}
                end={h.registrationDeadline}
              />
              <div className="flex gap-2">
                <SaveButton
                  type="hackathon"
                  slug={h.slug}
                  title={h.title}
                  variant="full"
                />
                <ShareButton
                  title={h.title}
                  path={`/hackathons/${h.slug}`}
                  variant="full"
                />
              </div>
            </div>
          </div>

          <WhyMatch
            topics={[...h.categories, ...h.technologies]}
            location={[h.city ?? "", h.region]}
          />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold">Related hackathons</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <HackathonCard key={x.id} hackathon={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function medal(place: string) {
  if (/1st|first/i.test(place)) return "🥇";
  if (/2nd|second/i.test(place)) return "🥈";
  if (/3rd|third/i.test(place)) return "🥉";
  return "🏅";
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
        {icon}
        {value}
      </dd>
    </div>
  );
}
