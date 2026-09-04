"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Hackathon, NewsArticle, TechEvent } from "@/lib/types";
import type { Opportunity } from "@/lib/hunt/types";
import { HUNT_CATEGORY_LABEL } from "@/lib/hunt/types";
import { formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Metrics {
  users: number;
  news: number;
  events: number;
  hackathons: number;
  saved: number;
  pendingVerification: number;
  topTopics: string[];
}

export interface AdminDataSource {
  id: string;
  name: string;
  category: string;
  type: string;
  enabled: boolean;
  lastSyncAt: string | null;
  recordCount: number;
  errorCount: number;
  lastError: string | null;
}

type Tab = "news" | "events" | "hackathons" | "submissions" | "sources" | "review";

export function AdminPanel({
  metrics,
  news,
  events,
  hackathons,
  sources,
  needsReview,
}: {
  metrics: Metrics;
  news: NewsArticle[];
  events: TechEvent[];
  hackathons: Hackathon[];
  sources: AdminDataSource[];
  needsReview: Opportunity[];
}) {
  const [tab, setTab] = useState<Tab>("news");
  const [sourceRows, setSourceRows] = useState(sources);
  const [reviewRows, setReviewRows] = useState(needsReview);
  const [syncing, setSyncing] = useState<string | null>(null); // source name, or "*" for all
  const [rows, setRows] = useState({
    news: news.map((n) => ({ ...n })),
    events: events.map((e) => ({ ...e })),
    hackathons: hackathons.map((h) => ({ ...h })),
  });
  const [toast, setToast] = useState("");
  const [submissions, setSubmissions] = useState<
    { id: string; name: string; kind: string; submittedAt: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((d) => setSubmissions(d.queue ?? []))
      .catch(() => setSubmissions([]));
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function remove(kind: "news" | "events" | "hackathons", id: string) {
    setRows((r) => ({ ...r, [kind]: r[kind].filter((x) => x.id !== id) }));
    flash("Deleted (session only in this MVP).");
  }
  function toggleFlag(
    kind: "events" | "hackathons",
    id: string,
    flag: "verified" | "featured",
  ) {
    setRows((r) => ({
      ...r,
      [kind]: r[kind].map((x) =>
        x.id === id ? { ...x, [flag]: !x[flag] } : x,
      ),
    }));
    flash(`Toggled ${flag}.`);
  }
  function toggleNewsFlag(id: string) {
    setRows((r) => ({
      ...r,
      news: r.news.map((x) =>
        x.id === id ? { ...x, trending: !x.trending } : x,
      ),
    }));
    flash("Toggled trending.");
  }

  async function toggleSource(id: string, enabled: boolean) {
    setSourceRows((rs) => rs.map((s) => (s.id === id ? { ...s, enabled } : s)));
    try {
      await fetch(`/api/admin/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      flash(enabled ? "Source enabled." : "Source disabled.");
    } catch {
      flash("Could not update the source.");
    }
  }

  async function syncSource(name?: string) {
    setSyncing(name ?? "*");
    try {
      const res = await fetch(
        `/api/admin/hunt-sync${name ? `?source=${encodeURIComponent(name)}` : ""}`,
        { method: "POST" },
      );
      const data = await res.json();
      const reports: { source: string; stored: number; error?: string }[] = data.reports ?? [];
      const total = reports.reduce((n, r) => n + r.stored, 0);
      flash(`Synced — ${total} record${total === 1 ? "" : "s"} stored.`);

      const now = new Date().toISOString();
      setSourceRows((rs) =>
        rs.map((s) => {
          const r = reports.find((x) => x.source === s.name);
          if (!r) return s;
          return {
            ...s,
            lastSyncAt: now,
            recordCount: r.stored,
            errorCount: r.error ? s.errorCount + 1 : 0,
            lastError: r.error ?? null,
          };
        }),
      );

      const reviewRes = await fetch("/api/admin/opportunities");
      const reviewData = await reviewRes.json();
      setReviewRows(reviewData.items ?? []);
    } catch {
      flash("Sync failed — check server logs.");
    } finally {
      setSyncing(null);
    }
  }

  async function reviewOpportunity(id: string, action: "approve" | "reject") {
    setReviewRows((rs) => rs.filter((o) => o.id !== id));
    try {
      await fetch(`/api/admin/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      flash(action === "approve" ? "Published." : "Rejected.");
    } catch {
      flash("Could not update the opportunity.");
    }
  }

  return (
    <div className="container-page py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage content, run the verification workflow and feature listings. In
          this MVP changes are session-only; wire to the data provider to persist.
        </p>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Users", metrics.users.toLocaleString()],
          ["News", rows.news.length],
          ["Events", rows.events.length],
          ["Hackathons", rows.hackathons.length],
          ["Saved items", metrics.saved.toLocaleString()],
          ["Pending", metrics.pendingVerification],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-muted">Most popular topics</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {metrics.topTopics.map((t, i) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs"
            >
              #{i + 1} {t}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-border">
        {(
          [
            ["news", `News (${rows.news.length})`],
            ["events", `Events (${rows.events.length})`],
            ["hackathons", `Hackathons (${rows.hackathons.length})`],
            ["submissions", `Submissions (${submissions.length})`],
            ["sources", `Data Sources (${sourceRows.length})`],
            ["review", `Needs Review (${reviewRows.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        {tab === "news" && (
          <Table head={["Headline", "Category", "Source", "Published", ""]}>
            {rows.news.map((n) => (
              <tr key={n.id} className="border-t border-border">
                <Td>
                  <Link
                    href={`/news/${n.slug}`}
                    className="font-medium hover:text-brand"
                  >
                    {n.title}
                  </Link>
                </Td>
                <Td>{n.category}</Td>
                <Td>{n.source}</Td>
                <Td>{formatDateShort(n.publishedAt)}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <IconBtn
                      title={n.trending ? "Unfeature" : "Feature as trending"}
                      onClick={() => toggleNewsFlag(n.id)}
                      active={n.trending}
                    >
                      <Star className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      danger
                      onClick={() => remove("news", n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "events" && (
          <Table head={["Event", "Type", "Location", "Verified", "Featured", ""]}>
            {rows.events.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <Td>
                  <Link
                    href={`/events/${e.slug}`}
                    className="font-medium hover:text-brand"
                  >
                    {e.title}
                  </Link>
                </Td>
                <Td>{e.eventType}</Td>
                <Td>{e.mode === "Online" ? "Online" : e.city}</Td>
                <Td>
                  <FlagBtn
                    on={e.verified}
                    onClick={() => toggleFlag("events", e.id, "verified")}
                  />
                </Td>
                <Td>
                  <IconBtn
                    title="Toggle featured"
                    active={e.featured}
                    onClick={() => toggleFlag("events", e.id, "featured")}
                  >
                    <Star className="h-4 w-4" />
                  </IconBtn>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <IconBtn
                      title="Delete"
                      danger
                      onClick={() => remove("events", e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "hackathons" && (
          <Table head={["Hackathon", "Region", "Prize", "Verified", "Featured", ""]}>
            {rows.hackathons.map((h) => (
              <tr key={h.id} className="border-t border-border">
                <Td>
                  <Link
                    href={`/hackathons/${h.slug}`}
                    className="font-medium hover:text-brand"
                  >
                    {h.title}
                  </Link>
                </Td>
                <Td>{h.region}</Td>
                <Td>£{h.prizePool.toLocaleString()}</Td>
                <Td>
                  <FlagBtn
                    on={h.verified}
                    onClick={() => toggleFlag("hackathons", h.id, "verified")}
                  />
                </Td>
                <Td>
                  <IconBtn
                    title="Toggle featured"
                    active={h.featured}
                    onClick={() => toggleFlag("hackathons", h.id, "featured")}
                  >
                    <Star className="h-4 w-4" />
                  </IconBtn>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <IconBtn
                      title="Delete"
                      danger
                      onClick={() => remove("hackathons", h.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "submissions" && (
          <Table head={["Submission", "Type", "Received", "Status"]}>
            {submissions.length === 0 ? (
              <tr className="border-t border-border">
                <Td colSpan={4}>
                  <span className="text-text-muted">
                    No pending submissions. Try the{" "}
                    <Link href="/submit" className="text-brand hover:underline">
                      submission form
                    </Link>
                    .
                  </span>
                </Td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <Td>{s.name}</Td>
                  <Td className="capitalize">{s.kind}</Td>
                  <Td>{formatDateShort(s.submittedAt)}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber">
                      <TriangleAlert className="h-3 w-3" /> Pending
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </Table>
        )}

        {tab === "sources" && (
          <>
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2.5">
              <p className="text-xs text-text-muted">
                Sources sync automatically once a day. Trigger a run manually below.
              </p>
              <button
                type="button"
                onClick={() => syncSource()}
                disabled={syncing !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                {syncing === "*" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync all sources
              </button>
            </div>
            <Table head={["Source", "Category", "Type", "Status", "Last Sync", "Records", "Errors", ""]}>
            {sourceRows.length === 0 ? (
              <tr className="border-t border-border">
                <Td colSpan={8}>
                  <span className="text-text-muted">
                    No sources registered yet — click &ldquo;Sync all sources&rdquo; above; the first
                    run registers Hunt&apos;s manual-awards and manual-volunteering sources
                    automatically.
                  </span>
                </Td>
              </tr>
            ) : (
              sourceRows.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <Td className="font-medium">{s.name}</Td>
                  <Td className="capitalize">{s.category}</Td>
                  <Td className="capitalize">{s.type}</Td>
                  <Td>
                    <FlagBtn on={s.enabled} onClick={() => toggleSource(s.id, !s.enabled)} onLabel="Active" offLabel="Disabled" />
                  </Td>
                  <Td>{s.lastSyncAt ? formatDateShort(s.lastSyncAt) : "Never"}</Td>
                  <Td>{s.recordCount}</Td>
                  <Td>
                    {s.errorCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-danger" title={s.lastError ?? undefined}>
                        <TriangleAlert className="h-3.5 w-3.5" /> {s.errorCount}
                      </span>
                    ) : (
                      "0"
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconBtn
                        title="Sync now"
                        onClick={() => syncSource(s.name)}
                        active={syncing === s.name}
                      >
                        {syncing === s.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </IconBtn>
                    </div>
                  </Td>
                </tr>
              ))
            )}
            </Table>
          </>
        )}

        {tab === "review" && (
          <Table head={["Opportunity", "Category", "Organisation", "Discovered", ""]}>
            {reviewRows.length === 0 ? (
              <tr className="border-t border-border">
                <Td colSpan={5}>
                  <span className="text-text-muted">Nothing needs review right now.</span>
                </Td>
              </tr>
            ) : (
              reviewRows.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <Td>
                    <a
                      href={o.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-brand"
                    >
                      {o.title}
                    </a>
                  </Td>
                  <Td>
                    {HUNT_CATEGORY_LABEL[o.type].emoji} {HUNT_CATEGORY_LABEL[o.type].label}
                  </Td>
                  <Td>{o.organisation}</Td>
                  <Td>{formatDateShort(o.discoveredAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <IconBtn title="Approve & publish" onClick={() => reviewOpportunity(o.id, "approve")}>
                        <CheckCircle2 className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Reject" danger onClick={() => reviewOpportunity(o.id, "reject")}>
                        <X className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </Table>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg shadow-lg lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="bg-surface-2 text-xs uppercase text-text-muted">
        <tr>
          {head.map((h, i) => (
            <th
              key={i}
              className={cn("px-4 py-2.5 font-medium", i === head.length - 1 && "text-right")}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-surface">{children}</tbody>
    </table>
  );
}

function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={cn("px-4 py-3 align-middle", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
        active && "border-amber bg-amber/15 text-amber",
        danger
          ? "text-text-muted hover:border-danger hover:text-danger"
          : "text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function FlagBtn({
  on,
  onClick,
  onLabel = "Verified",
  offLabel = "Unverified",
}: {
  on: boolean;
  onClick: () => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        on ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-muted",
      )}
    >
      {on ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {on ? onLabel : offLabel}
    </button>
  );
}
