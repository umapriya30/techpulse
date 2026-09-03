"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types";

const TYPE_META: Record<string, { icon: string; label: string; href: string }> = {
  news: { icon: "📰", label: "News", href: "/news" },
  event: { icon: "🎤", label: "Event", href: "/events" },
  hackathon: { icon: "🏆", label: "Hackathon", href: "/hackathons" },
};

function hrefFor(r: SearchResult) {
  const base = r.type === "news" ? "/news" : r.type === "event" ? "/events" : "/hackathons";
  return `${base}/${r.slug}`;
}

export function SearchBar({
  size = "lg",
  autoFocus = false,
  placeholder = "Search news, events, hackathons…",
  defaultValue = "",
}: {
  size?: "sm" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border bg-surface transition-colors focus-within:border-brand",
            size === "lg" ? "h-14 px-4 shadow-sm" : "h-10 px-3",
          )}
        >
          <Search
            className={cn(
              "shrink-0 text-text-muted",
              size === "lg" ? "h-5 w-5" : "h-4 w-4",
            )}
          />
          <input
            type="search"
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder={placeholder}
            aria-label="Search"
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-text-muted",
              size === "lg" ? "text-base" : "text-sm",
            )}
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />
          )}
          {q && !loading && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setResults([]);
              }}
              aria-label="Clear search"
              className="shrink-0 rounded p-1 text-text-muted hover:text-text focus-ring"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              No matches for “{q.trim()}”.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={hrefFor(r)}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <span aria-hidden className="text-lg">
                      {TYPE_META[r.type].icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {r.meta}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={submit}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-brand hover:bg-surface-2"
                >
                  See all results for “{q.trim()}” →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
