import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "TECHPULSE is a UK-focused discovery platform for tech news, events and AI hackathons.",
};

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-4xl font-black tracking-tight">About TECHPULSE</h1>
      <p className="mt-4 text-lg text-text-muted">
        &ldquo;Stay Ahead. Build. Learn. Connect.&rdquo; TechPulse brings
        together the tech news you need, the events you should attend and the
        hackathons you should not miss — with a focus on the{" "}
        <strong>United Kingdom</strong> and <strong>online / global</strong>{" "}
        opportunities.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "📰", title: "Tech News", body: "AI, Data, LLMs, Cloud, Cybersecurity and more — aggregated from trusted sources, always linking to the original." },
          { icon: "🎤", title: "Tech Events", body: "UK and online conferences, summits, meetups, workshops and webinars." },
          { icon: "🏆", title: "Hackathons", body: "AI, ML, LLM, Agentic AI and Data Science competitions with live deadline tracking." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-2xl">{c.icon}</div>
            <h2 className="mt-2 font-bold">{c.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{c.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Where the data comes from</h2>
        <p className="mt-3 text-text-muted">
          TechPulse pulls <strong>live</strong> data from public sources and
          refreshes it roughly every 30 minutes:
        </p>
        <ul className="mt-3 space-y-1.5 text-text-muted">
          <li>
            <strong>News</strong> — 30+ public RSS/Atom feeds: general press
            (The Verge, Ars Technica, WIRED, MIT Technology Review, VentureBeat,
            TechRadar, Engadget, InfoQ), official company &amp; lab blogs (OpenAI,
            Google DeepMind, Google Research, Hugging Face, NVIDIA, AWS, Google
            Cloud, GitHub, Berkeley AI Research, Import AI), data-science
            community (KDnuggets, Analytics Vidhya, DEV), research papers
            (arXiv cs.AI / cs.LG / cs.CL), plus Google News topic searches. An
            LLM-style pipeline de-duplicates, categorises and tags every story.
          </li>
          <li>
            <strong>Hackathons</strong> — the Devpost public hackathons API
            (worldwide) plus ukhackathons.com (UK-focused; its robots policy
            invites crawling), across AI, ML, LLM, GenAI, data and developer
            tracks.
          </li>
          <li>
            <strong>Events</strong> — the open, reuse-friendly developers.events
            and confs.tech datasets, covering tech events worldwide (UK, Europe,
            North America, Asia, Middle East and online) — filter by region or
            city.
          </li>
        </ul>
        <p className="mt-3 text-text-muted">
          Every item links to its official source. A data-provider layer keeps
          these sources swappable and falls back to a cached dataset if a source
          is briefly unreachable. Cover images use the source&apos;s own photo
          where one exists, otherwise a relevant topic image.
        </p>
        <p className="mt-3 text-text-muted">
          Press <kbd className="rounded border border-border bg-surface-2 px-1.5 text-xs">⌘K</kbd>{" "}
          (or <kbd className="rounded border border-border bg-surface-2 px-1.5 text-xs">Ctrl&nbsp;K</kbd>)
          anywhere for the command palette, or use the assistant in the bottom
          corner for natural-language questions.
        </p>
      </section>

      <section id="verification" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Data quality &amp; verification</h2>
        <p className="mt-3 text-text-muted">
          We never invent event dates, deadlines, prize amounts, speakers or
          registration links. Every event and hackathon links to its official
          source. Where a listing comes directly from the organiser it is marked{" "}
          <strong>Verified source ✓</strong>. Where details are awaiting
          confirmation we show <strong>Information not verified</strong> rather
          than guessing. Always confirm details on the organiser&apos;s page
          before registering or travelling.
        </p>
      </section>

      <section id="privacy" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Privacy</h2>
        <p className="mt-3 text-text-muted">
          Your session, saved items and preferences are stored in your
          browser&apos;s local storage — nothing is sent to a server. Product
          analytics, when enabled, are anonymous and privacy-conscious: page
          views, searches and click-throughs with no personal identifiers.
        </p>
      </section>

      <section id="terms" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Terms</h2>
        <p className="mt-3 text-text-muted">
          Content is provided for discovery purposes. TechPulse is not the
          organiser of listed events or hackathons and is not responsible for
          changes to schedules, pricing or availability. Trademarks and brands
          belong to their respective owners.
        </p>
      </section>

      <section id="contact" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="mt-3 text-text-muted">
          Organising an event or hackathon? Submit it for review — our team
          verifies new listings before they are published.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/submit?type=event">Submit an Event</ButtonLink>
          <ButtonLink href="/submit?type=hackathon" variant="outline">
            Submit a Hackathon
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
