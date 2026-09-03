"use client";

import { Sparkles } from "lucide-react";
import { useStore } from "@/app/providers";

export function WhyMatch({
  topics,
  location,
}: {
  topics: string[];
  location: string[];
}) {
  const { prefs, ready } = useStore();
  if (!ready) return null;

  const topicHits = prefs.topics.filter((t) =>
    topics.some(
      (x) =>
        x.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(x.toLowerCase()),
    ),
  );
  const locHits = prefs.locations.filter((l) =>
    location.some((x) => x.toLowerCase() === l.toLowerCase()),
  );
  const hits = [...new Set([...topicHits, ...locHits])];

  if (!prefs.onboarded) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand" /> Why you might like this
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Set your interests to see how well this matches what you follow.{" "}
          <a href="/saved#preferences" className="text-brand hover:underline">
            Choose interests →
          </a>
        </p>
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand" /> Why you might like this
        </p>
        <p className="mt-1 text-sm text-text-muted">
          This one is outside your current interests — a chance to explore
          something new.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand">
        <Sparkles className="h-4 w-4" /> Why you might like this
      </p>
      <p className="mt-1 text-sm">
        You follow{" "}
        <strong>
          {hits.slice(0, 3).join(" + ")}
        </strong>
        , so this matches {hits.length} of your interest
        {hits.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
