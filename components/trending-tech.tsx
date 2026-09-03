import Link from "next/link";
import { trendingTopics } from "@/lib/queries";
import { SectionHeading } from "@/components/ui";

export async function TrendingTech({ limit = 6 }: { limit?: number }) {
  const topics = await trendingTopics(limit);
  const max = topics[0]?.score ?? 1;

  return (
    <section className="container-page py-12">
      <SectionHeading eyebrow="🔥 Signal" title="What's Trending?" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t, i) => (
          <Link
            key={t.topic}
            href={`/search?q=${encodeURIComponent(t.topic)}`}
            className="card-hover flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <span className="text-lg font-black text-brand">
              #{i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{t.topic}</span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                  style={{ width: `${Math.max(12, (t.score / max) * 100)}%` }}
                />
              </span>
              <span className="mt-1 block text-xs text-text-muted">
                {t.articles} articles · {t.events} events · {t.hackathons} hackathons
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
