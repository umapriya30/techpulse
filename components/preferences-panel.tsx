"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/app/providers";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "AI",
  "Data Science",
  "Data Engineering",
  "LLMs",
  "Generative AI",
  "Agentic AI",
  "Cloud",
  "Software Engineering",
  "Cybersecurity",
  "Robotics",
  "Startups",
  "Open Source",
];

const LOCATIONS = [
  "UK",
  "London",
  "Manchester",
  "Liverpool",
  "Birmingham",
  "Edinburgh",
  "Online",
  "Global",
];

export function PreferencesPanel() {
  const { prefs, setPrefs } = useStore();
  const [saved, setSaved] = useState(false);

  function toggle(list: "topics" | "locations", value: string) {
    const set = new Set(prefs[list]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setPrefs({ ...prefs, [list]: [...set], onboarded: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function toggleNotif(key: keyof typeof prefs.notifications) {
    setPrefs({
      ...prefs,
      notifications: {
        ...prefs.notifications,
        [key]: !prefs.notifications[key],
      },
    });
  }

  return (
    <div id="preferences" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Personalise TechPulse</h2>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-text-muted">
        We use this to highlight matching news, events and hackathons and to show
        &ldquo;Why you might like this&rdquo; on detail pages.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">What are you interested in?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={prefs.topics.includes(t)}
              onClick={() => toggle("topics", t)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">
          What locations do you prefer?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={prefs.locations.includes(l)}
              onClick={() => toggle("locations", l)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Notify me about</legend>
        <div className="mt-2 space-y-2">
          {(
            [
              ["news", "New AI & tech news in my topics"],
              ["hackathons", "New hackathons"],
              ["eventsSoon", "Events starting soon"],
              ["deadlines", "Hackathon deadlines approaching"],
              ["savedReminders", "Reminders for events I saved"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={prefs.notifications[key]}
                onChange={() => toggleNotif(key)}
                className="h-4 w-4 rounded border-border accent-[var(--brand)]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {!prefs.onboarded && (
        <button
          type="button"
          onClick={() => setPrefs({ ...prefs, onboarded: true })}
          className={buttonClass({ className: "mt-5" })}
        >
          Save preferences
        </button>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-bg text-text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}
