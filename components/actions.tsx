"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, CalendarPlus, Check, Share2 } from "lucide-react";
import { useStore } from "@/app/providers";
import { buildCalendarLinks, cn } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

export function SaveButton({
  type,
  slug,
  title,
  variant = "icon",
}: {
  type: ContentType;
  slug: string;
  title?: string;
  variant?: "icon" | "full";
}) {
  const { isSaved, toggleSave, ready } = useStore();
  const saved = ready && isSaved(type, slug);

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggleSave(type, slug)}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-ring",
          saved
            ? "border-brand bg-brand/10 text-brand"
            : "border-border bg-transparent text-text hover:bg-surface-2",
        )}
      >
        {saved ? (
          <>
            <BookmarkCheck className="h-4 w-4" /> Saved
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" /> Save
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleSave(type, slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title ?? "item"} from saved` : `Save ${title ?? "item"}`}
      title={saved ? "Saved — click to remove" : "Save for later"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus-ring",
        saved
          ? "border-brand bg-brand/10 text-brand"
          : "border-border bg-surface/80 text-text-muted hover:text-text",
      )}
    >
      {saved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  );
}

export function ShareButton({
  title,
  path,
  variant = "icon",
}: {
  title: string;
  path: string;
  variant?: "icon" | "full";
}) {
  const [done, setDone] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? new URL(path, window.location.origin).toString()
        : path;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* user cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={share}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2 focus-ring"
      >
        {done ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {done ? "Link copied" : "Share"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${title}`}
      title="Share"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface/80 text-text-muted transition-colors hover:text-text focus-ring"
    >
      {done ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}

export function CalendarButton(props: {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
}) {
  const [open, setOpen] = useState(false);
  const links = buildCalendarLinks(props);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2 focus-ring"
      >
        <CalendarPlus className="h-4 w-4" /> Add to calendar
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <a
            className="block px-4 py-2.5 text-sm hover:bg-surface-2"
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Calendar
          </a>
          <a
            className="block px-4 py-2.5 text-sm hover:bg-surface-2"
            href={links.outlook}
            target="_blank"
            rel="noopener noreferrer"
          >
            Outlook
          </a>
          <a
            className="block px-4 py-2.5 text-sm hover:bg-surface-2"
            href={links.ics}
            download={`${props.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`}
          >
            Apple / iCal (.ics)
          </a>
        </div>
      )}
    </div>
  );
}
