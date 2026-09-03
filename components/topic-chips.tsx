import Link from "next/link";
import { TOPICS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TopicChips({
  basePath = "/news",
  active,
  className,
}: {
  basePath?: string;
  active?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {TOPICS.map((topic) => {
        const isActive = active?.toLowerCase() === topic.toLowerCase();
        return (
          <Link
            key={topic}
            href={
              isActive
                ? basePath
                : `${basePath}?topic=${encodeURIComponent(topic)}`
            }
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-text-muted hover:border-brand/40 hover:text-text",
            )}
          >
            {topic}
          </Link>
        );
      })}
    </div>
  );
}
