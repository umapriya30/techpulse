import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  params,
  basePath,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (pages <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const nums: number[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <PageLink
        href={hrefFor(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {nums.map((p, i) => {
        const gap = i > 0 && p - nums[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-text-muted">…</span>}
            <PageLink href={hrefFor(p)} active={p === page} aria-label={`Page ${p}`}>
              {p}
            </PageLink>
          </span>
        );
      })}
      <PageLink
        href={hrefFor(Math.min(pages, page + 1))}
        disabled={page === pages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const cls = cn(
    "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors",
    active
      ? "border-brand bg-brand text-white"
      : "border-border bg-surface text-text hover:bg-surface-2",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span className={cls} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
