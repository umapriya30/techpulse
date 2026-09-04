import type { Metadata } from "next";
import { provider } from "@/lib/provider";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin-panel";
import { trendingTopics } from "@/lib/queries";
import { listNeedsReview } from "@/lib/hunt/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage news, events, hackathons, submissions and Hunt data sources.",
  robots: { index: false },
};

export default async function AdminPage() {
  const [news, events, hackathons, topics, sources, needsReview] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
    trendingTopics(6),
    prisma.dataSource.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    listNeedsReview().catch(() => []),
  ]);

  const metrics = {
    users: 1284,
    news: news.length,
    events: events.length,
    hackathons: hackathons.length,
    saved: 3720,
    pendingVerification:
      events.filter((e) => !e.verified).length +
      hackathons.filter((h) => !h.verified).length,
    topTopics: topics.map((t) => t.topic),
  };

  return (
    <AdminPanel
      metrics={metrics}
      news={news}
      events={events}
      hackathons={hackathons}
      sources={sources.map((s) => ({
        ...s,
        lastSyncAt: s.lastSyncAt ? s.lastSyncAt.toISOString() : null,
      }))}
      needsReview={needsReview}
    />
  );
}
