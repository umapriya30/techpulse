import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { closingSoon } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { DeadlineBadge } from "@/components/badges";
import { SectionHeading } from "@/components/ui";

export async function ClosingSoon({ limit = 6 }: { limit?: number }) {
  const items = (await closingSoon(30)).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="container-page py-12">
      <SectionHeading
        eyebrow="⏰ Act fast"
        title="Closing Soon"
        action={
          <Link
            href="/hackathons?deadline=month"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={`${item.type}-${item.slug}`}>
              <Link
                href={`/${item.type === "event" ? "events" : "hackathons"}/${item.slug}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-6"
              >
                <span aria-hidden className="text-xl">
                  {item.type === "event" ? "🎤" : "🏆"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {item.title}
                  </span>
                  <span className="block text-xs text-text-muted">
                    {item.meta} · deadline {formatDate(item.deadline)}
                  </span>
                </span>
                <DeadlineBadge deadline={item.deadline} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
