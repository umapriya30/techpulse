import type { Metadata } from "next";
import { queryNews, newsSources } from "@/lib/queries";
import { CATEGORIES } from "@/lib/types";
import { Filters, type FilterGroup } from "@/components/filters";
import { NewsGrid } from "@/components/grids";
import { Pagination } from "@/components/pagination";
import { TopicChips } from "@/components/topic-chips";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Tech News",
  description:
    "The latest technology, AI, data and LLM news aggregated from trusted sources, with links to every original article.",
};

const PER_PAGE = 9;

type SP = Record<string, string | undefined>;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const sources = await newsSources();

  const items = await queryNews({
    categories: sp.categories?.split(",").filter(Boolean),
    sources: sp.sources?.split(",").filter(Boolean),
    topic: sp.topic,
    time: sp.time as never,
    format: sp.format as never,
    trendingOnly: sp.trending === "yes",
    query: sp.q,
  });

  const page = Number(sp.page ?? "1");
  const pageData = paginate(items, page, PER_PAGE);

  const groups: FilterGroup[] = [
    {
      key: "categories",
      label: "Category",
      type: "multi",
      options: CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      key: "format",
      label: "Type",
      type: "single",
      options: [
        { value: "articles", label: "Articles" },
        { value: "research", label: "Research papers" },
      ],
    },
    {
      key: "trending",
      label: "Highlights",
      type: "single",
      options: [{ value: "yes", label: "🔥 Trending only" }],
    },
    {
      key: "time",
      label: "Time",
      type: "single",
      options: [
        { value: "today", label: "Today" },
        { value: "week", label: "This week" },
        { value: "month", label: "This month" },
      ],
    },
    {
      key: "sources",
      label: "Source",
      type: "multi",
      options: sources.map((s) => ({ value: s, label: s })),
    },
  ];

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          📰 Tech News
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          What happened in Tech today
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Aggregated from trusted sources across Technology, AI, Data and LLMs.
          Every card links to the original article.
        </p>
      </header>

      <div className="mb-8">
        <TopicChips basePath="/news" active={sp.topic} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filters groups={groups} resultCount={items.length} />
        <div>
          {sp.q && (
            <p className="mb-4 text-sm text-text-muted">
              Showing results for{" "}
              <span className="font-semibold text-text">“{sp.q}”</span>
            </p>
          )}
          <NewsGrid items={pageData.items} />
          <Pagination
            page={pageData.page}
            pages={pageData.pages}
            params={sp}
            basePath="/news"
          />
        </div>
      </div>
    </div>
  );
}
