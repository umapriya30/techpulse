"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { useStore } from "@/app/providers";
import { buttonClass } from "@/components/ui";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const { user, signIn, signOut, ready, pushNotification } = useStore();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!ready) {
    return <div className="h-9 w-24 rounded-lg skeleton" />;
  }

  if (user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          className="flex h-9 items-center gap-2 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-surface-2 focus-ring"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
            {user.name.charAt(0).toUpperCase()}
          </span>
          {!compact && <span className="max-w-24 truncate">{user.name}</span>}
        </button>
        {menu && (
          <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
            <Link
              href="/saved"
              onClick={() => setMenu(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-2"
            >
              <UserIcon className="h-4 w-4" /> My TechPulse
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ size: "sm", variant: "primary" })}
      >
        Sign in
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
          >
            <h2 id="signin-title" className="text-lg font-bold">
              Sign in to TECHPULSE
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Save articles, events and hackathons, and get deadline reminders.
              This demo stores your session locally in the browser.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim() || !email.includes("@")) {
                  setError("Enter a name and a valid email.");
                  return;
                }
                signIn({ name: name.trim(), email: email.trim() });
                pushNotification({
                  type: "reminder",
                  message: `👋 Welcome, ${name.trim()}. Your saved items now sync to this profile.`,
                  href: "/saved",
                });
                setOpen(false);
              }}
            >
              <div>
                <label htmlFor="signin-name" className="mb-1 block text-xs font-medium">
                  Name
                </label>
                <input
                  id="signin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-brand"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="signin-email" className="mb-1 block text-xs font-medium">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-brand"
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <button type="submit" className={buttonClass({ className: "w-full" })}>
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
