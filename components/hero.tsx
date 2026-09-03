import { ButtonLink } from "@/components/ui";
import { SearchBar } from "@/components/search-bar";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-brand-2/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
            🌍 Worldwide &amp; Online · 🇬🇧 UK focus · News, Events &amp; Hackathons
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Everything happening in{" "}
            <span className="text-gradient">Tech, AI &amp; Data.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            One platform for the news you need, the events you should attend and
            the hackathons you should not miss.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar placeholder="Search news, events, hackathons…" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/events" size="lg">
              Explore Events
            </ButtonLink>
            <ButtonLink href="/hackathons" size="lg" variant="outline">
              Discover Hackathons
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
