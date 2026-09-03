import type { Metadata } from "next";
import Link from "next/link";
import { globalSearch } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Search",
  description: "Search across tech news, events and hackathons.",
};

type SP = Record<string, string | undefined>;

const TABS = [
  { key: "all", label: "All" },
  { key: "news", label: "📰 News" },
  { key: "event", label: "🎤 Events" },
  { key: "hackathon", label: "🏆 Hackathons" },
];

function hrefFor(type: string, slug: string) {
  const base =
    type === "news" ? "/news" : type === "event" ? "/events" : "/hackathons";
  return `${base}/${slug}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tab = sp.type ?? "all";

  const all = q ? await globalSearch(q) : [];
  const counts = {
    all: all.length,
    news: all.filter((r) => r.type === "news").length,
    event: all.filter((r) => r.type === "event").length,
    hackathon: all.filter((r) => r.type === "hackathon").length,
  };
  const results = tab === "all" ? all : all.filter((r) => r.type === tab);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-2 text-text-muted">
        One query across news, events and hackathons.
      </p>

      <div className="mt-6 max-w-2xl">
        <SearchBar defaultValue={q} placeholder="Try “London AI” or “LLM”" />
      </div>

      {!q ? (
        <div className="mt-10">
          <EmptyState
            title="Start typing to search"
            description="Search headlines, event names, cities, organisers, technologies and tags."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
            {TABS.map((t) => {
              const count =
                t.key === "all"
                  ? counts.all
                  : counts[t.key as keyof typeof counts];
              const active = tab === t.key;
              const params = new URLSearchParams({ q });
              if (t.key !== "all") params.set("type", t.key);
              return (
                <Link
                  key={t.key}
                  href={`/search?${params.toString()}`}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-text-muted hover:text-text",
                  )}
                >
                  {t.label}{" "}
                  <span className="text-xs text-text-muted">({count})</span>
                </Link>
              );
            })}
          </div>

          {results.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={`No results for “${q}”`}
                description="Check the spelling or try a broader term."
              />
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={hrefFor(r.type, r.slug)}
                    className="card-hover flex gap-4 rounded-xl border border-border bg-surface p-4"
                  >
                    <span aria-hidden className="text-2xl">
                      {r.type === "news"
                        ? "📰"
                        : r.type === "event"
                          ? "🎤"
                          : "🏆"}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="mt-0.5 block line-clamp-2 text-sm text-text-muted">
                        {r.subtitle}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {r.meta}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
