"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setState("done");
      setMessage(data.message);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-surface to-brand-2/10 p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Don&apos;t miss what&apos;s happening in Tech.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">
            The weekly TechPulse digest: 5 AI stories you should know, 7 upcoming
            events and 3 hackathons closing soon.
          </p>

          {state === "done" ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent/15 px-4 py-3 text-sm font-medium text-accent">
              <Check className="h-4 w-4" /> {message}
            </p>
          ) : (
            <form
              onSubmit={submit}
              className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 flex-1 rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className={buttonClass({ size: "lg" })}
              >
                {state === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}
          {state === "error" && (
            <p className="mt-3 text-sm text-danger">{message}</p>
          )}
          <p className="mt-3 text-xs text-text-muted">
            No spam. Unsubscribe anytime. See our privacy note.
          </p>
        </div>
      </div>
    </section>
  );
}
