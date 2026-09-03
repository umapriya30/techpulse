import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Shared primitives */

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "brand" | "green" | "amber" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-text-muted",
    brand: "bg-brand/12 text-brand",
    green: "bg-accent/15 text-accent",
    amber: "bg-amber/15 text-amber",
    red: "bg-danger/15 text-danger",
    blue: "bg-brand-2/15 text-brand-2",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none";
const btnSizes = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-base",
};
const btnVariants = {
  primary: "bg-brand text-white hover:bg-brand/90",
  secondary: "bg-surface-2 text-text hover:bg-border",
  outline: "border border-border bg-transparent text-text hover:bg-surface-2",
  ghost: "text-text-muted hover:bg-surface-2 hover:text-text",
};

export function buttonClass(opts?: {
  variant?: keyof typeof btnVariants;
  size?: keyof typeof btnSizes;
  className?: string;
}) {
  return cn(
    btnBase,
    btnSizes[opts?.size ?? "md"],
    btnVariants[opts?.variant ?? "primary"],
    opts?.className,
  );
}

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof btnVariants;
  size?: keyof typeof btnSizes;
  className?: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ variant, size, className })}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}


export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-xl">
        🔍
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
