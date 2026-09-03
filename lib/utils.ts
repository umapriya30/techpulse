import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DAY = 1000 * 60 * 60 * 24;

/** Whole days from now until the given ISO date (negative == in the past). */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = new Date(iso).getTime();
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(new Date(target).getFullYear(), new Date(target).getMonth(), new Date(target).getDate()).getTime();
  return Math.round((end - start) / DAY);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${Math.round(months / 12)} year${months < 24 ? "" : "s"} ago`;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPrice(amount: number, currency = "GBP"): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoney(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface DeadlineState {
  label: string;
  tone: "green" | "amber" | "red" | "grey";
  days: number;
  urgent: boolean;
}

export function deadlineState(iso: string): DeadlineState {
  const days = daysUntil(iso);
  if (days < 0) return { label: "Closed", tone: "grey", days, urgent: false };
  if (days === 0) return { label: "Closes today", tone: "red", days, urgent: true };
  if (days <= 3) return { label: `${days} day${days === 1 ? "" : "s"} left`, tone: "red", days, urgent: true };
  if (days <= 7) return { label: `${days} days left`, tone: "amber", days, urgent: true };
  if (days <= 30) return { label: `${days} days left`, tone: "green", days, urgent: false };
  return { label: `${days}+ days left`, tone: "green", days, urgent: false };
}

/** Deterministic gradient classes for generated cover art. */
export const GRADIENTS: Record<string, string> = {
  violet: "from-violet-500 via-purple-500 to-fuchsia-500",
  blue: "from-sky-500 via-blue-500 to-indigo-500",
  emerald: "from-emerald-400 via-teal-500 to-cyan-500",
  amber: "from-amber-400 via-orange-500 to-rose-500",
  rose: "from-rose-500 via-pink-500 to-fuchsia-500",
  slate: "from-slate-600 via-slate-700 to-zinc-800",
  lime: "from-lime-400 via-green-500 to-emerald-500",
  indigo: "from-indigo-500 via-violet-600 to-purple-700",
};

export function gradientFor(key: string): string {
  return GRADIENTS[key] ?? GRADIENTS.violet;
}

export function buildCalendarLinks(opts: {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
}) {
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = fmt(opts.start);
  const end = fmt(opts.end);
  const google = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    opts.title,
  )}&dates=${start}/${end}&details=${encodeURIComponent(opts.description)}&location=${encodeURIComponent(
    opts.location,
  )}`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    opts.title,
  )}&startdt=${new Date(opts.start).toISOString()}&enddt=${new Date(
    opts.end,
  ).toISOString()}&body=${encodeURIComponent(opts.description)}&location=${encodeURIComponent(opts.location)}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:${opts.description}`,
    `LOCATION:${opts.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
  const icsHref = `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
  return { google, outlook, ics: icsHref };
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: current,
    pages,
    total,
  };
}
