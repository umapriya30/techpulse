"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Bookmark,
  Command as CommandIcon,
  Home,
  Loader2,
  Moon,
  Newspaper,
  Search,
  Send,
  Sun,
  Ticket,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types";

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const staticItems = useMemo<Item[]>(
    () => [
      { id: "home", label: "Home", icon: <Home className="h-4 w-4" />, run: () => go("/"), group: "Go to" },
      { id: "news", label: "Tech News", icon: <Newspaper className="h-4 w-4" />, run: () => go("/news"), group: "Go to" },
      { id: "events", label: "Events", icon: <Ticket className="h-4 w-4" />, run: () => go("/events"), group: "Go to" },
      { id: "hack", label: "Hackathons", icon: <Trophy className="h-4 w-4" />, run: () => go("/hackathons"), group: "Go to" },
      { id: "saved", label: "My TechPulse", icon: <Bookmark className="h-4 w-4" />, run: () => go("/saved"), group: "Go to" },
      { id: "submit", label: "Submit an event or hackathon", icon: <Send className="h-4 w-4" />, run: () => go("/submit"), group: "Go to" },
      { id: "t-ai", label: "AI news", hint: "topic", icon: <ArrowRight className="h-4 w-4" />, run: () => go("/news?topic=Artificial%20Intelligence"), group: "Topics" },
      { id: "t-llm", label: "LLMs", hint: "topic", icon: <ArrowRight className="h-4 w-4" />, run: () => go("/news?topic=LLMs"), group: "Topics" },
      { id: "t-agentic", label: "Agentic AI", hint: "topic", icon: <ArrowRight className="h-4 w-4" />, run: () => go("/news?topic=Agentic%20AI"), group: "Topics" },
      { id: "t-data", label: "Data engineering", hint: "topic", icon: <ArrowRight className="h-4 w-4" />, run: () => go("/news?topic=Data%20Engineering"), group: "Topics" },
      { id: "closing", label: "Hackathons closing this week", icon: <Trophy className="h-4 w-4" />, run: () => go("/hackathons?deadline=week"), group: "Quick filters" },
      { id: "free", label: "Free online events", icon: <Ticket className="h-4 w-4" />, run: () => go("/events?format=online&price=free"), group: "Quick filters" },
      { id: "research", label: "Research papers (arXiv)", icon: <Newspaper className="h-4 w-4" />, run: () => go("/news?format=research"), group: "Quick filters" },
      { id: "light", label: "Light theme", icon: <Sun className="h-4 w-4" />, run: () => { setTheme("light"); setOpen(false); }, group: "Theme" },
      { id: "dark", label: "Dark theme", icon: <Moon className="h-4 w-4" />, run: () => { setTheme("dark"); setOpen(false); }, group: "Theme" },
    ],
    [go, setTheme],
  );

  // global hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // live search
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
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const filteredStatic = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return staticItems;
    return staticItems.filter((i) => i.label.toLowerCase().includes(term));
  }, [q, staticItems]);

  const resultItems = useMemo<Item[]>(
    () =>
      results.map((r) => {
        const base =
          r.type === "news" ? "/news" : r.type === "event" ? "/events" : "/hackathons";
        return {
          id: `${r.type}-${r.id}`,
          label: r.title,
          hint: r.meta,
          icon: <span className="text-sm">{r.type === "news" ? "📰" : r.type === "event" ? "🎤" : "🏆"}</span>,
          run: () => go(`${base}/${r.slug}`),
          group: "Results",
        };
      }),
    [results, go],
  );

  const all = useMemo(() => [...resultItems, ...filteredStatic], [resultItems, filteredStatic]);

  useEffect(() => setCursor(0), [q, results.length]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, all.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (all[cursor]) all[cursor].run();
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  if (!open) return null;

  let idx = -1;
  const groups = [...new Set(all.map((i) => i.group))];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {all.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-text-muted">
              Press Enter to search TechPulse for “{q.trim()}”.
            </p>
          )}
          {groups.map((group) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {group}
              </p>
              {all
                .filter((i) => i.group === group)
                .map((item) => {
                  idx++;
                  const active = idx === cursor;
                  const myIdx = idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setCursor(myIdx)}
                      onClick={item.run}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                        active ? "bg-brand text-white" : "hover:bg-surface-2",
                      )}
                    >
                      <span className={active ? "text-white" : "text-text-muted"}>
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span
                          className={cn(
                            "shrink-0 truncate text-xs",
                            active ? "text-white/80" : "text-text-muted",
                          )}
                        >
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <CommandIcon className="h-3 w-3" /> K to toggle
          </span>
          <span>↑↓ navigate · ↵ select · esc close</span>
        </div>
      </div>
    </div>
  );
}
