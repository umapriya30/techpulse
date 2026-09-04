import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryOpportunities } from "@/lib/hunt/queries";
import { ACTIVE_HUNT_CATEGORIES, HUNT_CATEGORIES, HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import type { HuntCategory } from "@/lib/hunt/types";
import { Filters, type FilterGroup } from "@/components/filters";
import { OpportunityGrid } from "@/components/grids";
import { Pagination } from "@/components/pagination";
import { EmptyState, ButtonLink } from "@/components/ui";
import { paginate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 9;
type SP = Record<string, string | undefined>;

function isHuntCategory(v: string): v is HuntCategory {
  return (HUNT_CATEGORIES as string[]).includes(v);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isHuntCategory(category)) return {};
  const meta = HUNT_CATEGORY_LABEL[category];
  return {
    title: `Hunt · ${meta.label}`,
    description: `${meta.label} opportunities on TechPulse Hunt — real sources, verified where possible.`,
  };
}

export default async function HuntCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SP>;
}) {
  const { category } = await params;
  if (!isHuntCategory(category)) notFound();
  const meta = HUNT_CATEGORY_LABEL[category];
  const sp = await searchParams;

  if (!ACTIVE_HUNT_CATEGORIES.includes(category)) {
    return (
      <div className="container-page py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {meta.emoji} Hunt
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{meta.label}</h1>
        </header>
        <EmptyState
          title="Coming soon"
          description={`${meta.label} is on the Hunt roadmap — a source adapter for this category hasn't been wired up yet.`}
          action={
            <ButtonLink href="/hunt" variant="outline">
              Back to Hunt
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const items = await queryOpportunities({
    type: category,
    location: sp.location,
    deadline: sp.deadline as never,
    free: sp.free === "true" ? true : sp.free === "false" ? false : undefined,
    eligibility: sp.eligibility as never,
    query: sp.q,
  }).catch((err) => {
    console.warn("[HuntCategoryPage] queryOpportunities failed:", err instanceof Error ? err.message : err);
    return [];
  });

  const page = Number(sp.page ?? "1");
  const pageData = paginate(items, page, PER_PAGE);

  const groups: FilterGroup[] = [
    {
      key: "location",
      label: "Location",
      type: "single",
      options: [
        { value: "remote", label: "Remote" },
        { value: "hybrid", label: "Hybrid" },
        { value: "United Kingdom", label: "UK" },
      ],
    },
    {
      key: "deadline",
      label: "Deadline",
      type: "single",
      options: [
        { value: "soon", label: "Closing soon" },
        { value: "week", label: "This week" },
        { value: "month", label: "This month" },
        { value: "future", label: "Later / rolling" },
      ],
    },
    {
      key: "eligibility",
      label: "Eligibility",
      type: "single",
      options: [
        { value: "student", label: "Students" },
        { value: "graduate", label: "Graduates" },
        { value: "professional", label: "Professionals" },
        { value: "founder", label: "Founders" },
      ],
    },
    {
      key: "free",
      label: "Cost",
      type: "single",
      options: [
        { value: "true", label: "Free" },
        { value: "false", label: "Paid" },
      ],
    },
  ];

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          {meta.emoji} Hunt
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{meta.label}</h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Real opportunities from official organisers, verified where possible. Every card
          links back to its source.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filters groups={groups} resultCount={items.length} />
        <div>
          <OpportunityGrid items={pageData.items} />
          <Pagination
            page={pageData.page}
            pages={pageData.pages}
            params={sp}
            basePath={`/hunt/${category}`}
          />
        </div>
      </div>
    </div>
  );
}
