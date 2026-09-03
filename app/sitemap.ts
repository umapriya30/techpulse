import type { MetadataRoute } from "next";
import { provider } from "@/lib/provider";

const BASE = "https://techpulse.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events, hackathons] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
  ]);

  const staticRoutes = ["", "/news", "/events", "/hackathons", "/search", "/about", "/submit"].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  return [
    ...staticRoutes,
    ...news.map((n) => ({
      url: `${BASE}/news/${n.slug}`,
      lastModified: new Date(n.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${BASE}/events/${e.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...hackathons.map((h) => ({
      url: `${BASE}/hackathons/${h.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
