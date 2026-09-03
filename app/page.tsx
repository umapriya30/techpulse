import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { TopicChips } from "@/components/topic-chips";
import { SectionHeading } from "@/components/ui";
import { NewsCard } from "@/components/news-card";
import { EventCard } from "@/components/event-card";
import { HackathonCard } from "@/components/hackathon-card";
import { ClosingSoon } from "@/components/closing-soon";
import { TrendingTech } from "@/components/trending-tech";
import { Newsletter } from "@/components/newsletter";
import { StatBand } from "@/components/stat-band";
import { closingSoon, queryEvents, queryHackathons, queryNews } from "@/lib/queries";

export default async function HomePage() {
  const [trending, moreNews, events, hackathons, closing] = await Promise.all([
    queryNews({ trendingOnly: true }),
    queryNews(),
    queryEvents({ upcomingOnly: true }),
    queryHackathons({ openOnly: true }),
    closingSoon(7),
  ]);

  const trendingStories = trending.slice(0, 5);
  const secondary = moreNews
    .filter((n) => !trendingStories.some((t) => t.id === n.id))
    .slice(0, 3);

  return (
    <>
      <Hero />

      {/* Live counts */}
      <section className="container-page -mt-6 pb-4">
        <StatBand
          stats={[
            { label: "News articles", value: moreNews.length, icon: "📰" },
            { label: "Upcoming events", value: events.length, icon: "🎤" },
            { label: "Open hackathons", value: hackathons.length, icon: "🏆" },
            { label: "Closing this week", value: closing.length, icon: "⏰" },
          ]}
        />
      </section>

      {/* Trending topics */}
      <section className="container-page py-8">
        <SectionHeading eyebrow="📈 Explore" title="Trending Topics" />
        <TopicChips basePath="/news" />
      </section>

      {/* Trending news */}
      <section className="container-page py-4">
        <SectionHeading
          eyebrow="🔥 Trending Today"
          title="The stories shaping Tech right now"
          action={
            <Link
              href="/news"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              All news <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-5">
          {trendingStories[0] && (
            <NewsCard article={trendingStories[0]} featured />
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...trendingStories.slice(1), ...secondary].slice(0, 4).map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="container-page py-12">
        <SectionHeading
          eyebrow="🎤 Upcoming Near You"
          title="Events in the UK & online"
          action={
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              All events <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* Hackathons */}
      <section className="container-page py-12">
        <SectionHeading
          eyebrow="🏆 Don't Miss These"
          title="AI hackathons open for registration"
          action={
            <Link
              href="/hackathons"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              All hackathons <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.slice(0, 3).map((h) => (
            <HackathonCard key={h.id} hackathon={h} />
          ))}
        </div>
      </section>

      <ClosingSoon />
      <TrendingTech />
      <Newsletter />
    </>
  );
}
