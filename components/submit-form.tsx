"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { CATEGORIES, EVENT_TYPES } from "@/lib/types";

type Kind = "event" | "hackathon" | "award" | "volunteering";
const KINDS: Kind[] = ["event", "hackathon", "award", "volunteering"];

export function SubmitForm() {
  const params = useSearchParams();
  const requested = params.get("type") as Kind | null;
  const initialKind: Kind = requested && KINDS.includes(requested) ? requested : "event";
  const [kind, setKind] = useState<Kind>(initialKind);
  const isHunt = kind === "award" || kind === "volunteering";
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setRef(data.id);
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 p-6">
        <p className="flex items-center gap-2 text-lg font-bold text-accent">
          <Check className="h-5 w-5" /> Pending verification
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Thanks! Your {kind} submission (ref <code>{ref}</code>) is in the review
          queue. Our team checks the source, dates and links before publishing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`h-10 flex-1 rounded-lg border text-sm font-semibold capitalize transition-colors ${
              kind === k
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <Field
        label="Name"
        name="name"
        required
        placeholder={kind === "event" ? "AI & Data Summit London 2026" : kind === "hackathon" ? "Build With AI Hackathon" : kind === "award" ? "UK AI Innovation Award" : "STEM Ambassador Programme"}
      />
      <Field label="Organiser" name="organizer" required />
      <Field label="Description" name="description" required textarea placeholder="At least 20 characters." />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Category" name="category" options={CATEGORIES} required />
        {kind === "event" && <SelectField label="Event type" name="eventType" options={EVENT_TYPES} />}
        {kind === "hackathon" && (
          <SelectField label="Format" name="mode" options={["Online", "In-Person", "Hybrid"]} required />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={isHunt ? "Deadline (optional)" : "Date"}
          name="date"
          type="date"
          required={!isHunt}
        />
        {!isHunt && <Field label="Time (optional)" name="time" placeholder="09:00 – 17:00 BST" />}
      </div>

      {kind === "event" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Location type"
            name="mode"
            options={["UK In-Person", "Online", "Hybrid"]}
            required
          />
          <Field label="City / venue (optional)" name="location" placeholder="London, UK" />
        </div>
      )}

      {isHunt && <Field label="Location (optional)" name="location" placeholder="Remote, UK, London…" />}

      <Field label="Price (optional)" name="price" placeholder="Free, £25, £89…" />
      <Field label="Website URL" name="website" type="url" required placeholder="https://…" />
      <Field
        label={isHunt ? "Application / registration URL (optional)" : "Registration URL"}
        name="registrationUrl"
        type="url"
        required={!isHunt}
        placeholder="https://…"
      />
      <Field label="Contact email" name="contactEmail" type="email" required />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={state === "loading"}
        className={buttonClass({ size: "lg", className: "w-full" })}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Submit for review"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: readonly string[];
  required?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue=""
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
