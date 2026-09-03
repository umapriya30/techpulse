"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Result {
  type: "news" | "event" | "hackathon" | "topic";
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}
interface Msg {
  role: "user" | "assistant";
  text: string;
  results?: Result[];
  suggestions?: string[];
}

const ICON: Record<string, string> = {
  news: "📰",
  event: "🎤",
  hackathon: "🏆",
  topic: "🔥",
};

const GREETING: Msg = {
  role: "assistant",
  text: "Hi — I'm the TechPulse assistant. Ask me about tech news, UK & online events, or AI hackathons.",
  suggestions: [
    "Hackathons closing this week",
    "AI events in London next month",
    "Latest LLM news",
    "Hackathons with £10k+ prize",
  ],
};

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.reply ?? "Sorry, I couldn't answer that.",
          results: data.results,
          suggestions: data.suggestions,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error — please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open TechPulse assistant"}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 focus-ring",
          "bottom-20 right-4 lg:bottom-6 lg:right-6",
          "bg-gradient-to-br from-brand to-brand-2",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl
            bottom-36 right-4 left-4 top-20
            sm:left-auto sm:top-auto sm:h-[560px] sm:w-[400px] sm:bottom-24 sm:right-6
            lg:bottom-24"
          role="dialog"
          aria-label="TechPulse assistant"
        >
          <header className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-brand/10 to-brand-2/10 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white">
              <Bot className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">TechPulse Assistant</p>
              <p className="text-[11px] text-text-muted">
                Live news · events · hackathons
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-brand text-white"
                      : "bg-surface-2 text-text",
                  )}
                >
                  {m.text}
                </div>

                {m.results && m.results.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {m.results.map((r, j) => (
                      <li key={j}>
                        <Link
                          href={r.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-xl border border-border bg-bg p-2.5 transition-colors hover:border-brand/50"
                        >
                          <span className="flex items-start gap-2">
                            <span aria-hidden>{ICON[r.type]}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">
                                {r.title}
                              </span>
                              <span className="block truncate text-xs text-text-muted">
                                {r.subtitle}
                              </span>
                              <span className="mt-0.5 block text-[11px] font-medium text-brand">
                                {r.meta}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-brand/50 hover:text-text"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching live data…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg pl-3 pr-1.5 focus-within:border-brand">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about news, events, hackathons…"
                aria-label="Message the assistant"
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
