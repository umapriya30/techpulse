import type { Metadata } from "next";
import { provider } from "@/lib/provider";
import { AdminPanel } from "@/components/admin-panel";
import { trendingTopics } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage news, events, hackathons and submissions.",
  robots: { index: false },
};

export default async function AdminPage() {
  const [news, events, hackathons, topics] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
    trendingTopics(6),
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
    />
  );
}
