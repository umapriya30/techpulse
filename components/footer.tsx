import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/logo";

const COLS = [
  {
    title: "Discover",
    links: [
      { href: "/news", label: "Tech News" },
      { href: "/events", label: "Events" },
      { href: "/hackathons", label: "Hackathons" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { href: "/submit?type=event", label: "Submit Event" },
      { href: "/submit?type=hackathon", label: "Submit Hackathon" },
      { href: "/admin", label: "Admin" },
    ],
  },
  {
    title: "TechPulse",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#privacy", label: "Privacy" },
      { href: "/about#terms", label: "Terms" },
      { href: "/about#contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo size={34} />
            <p className="mt-3 max-w-xs text-sm text-text-muted">
              &ldquo;Stay Ahead. Build. Learn. Connect.&rdquo; Everything happening
              in Tech, AI &amp; Data — focused on the UK and online.
            </p>
            <div className="mt-4 flex gap-2">
              {[
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Twitter, label: "X" },
                { icon: Github, label: "GitHub" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:text-text focus-ring"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-muted transition-colors hover:text-text"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-text-muted">
          <p>
            © {new Date().getFullYear()} TECHPULSE — an independent discovery
            tool. Not affiliated with, endorsed by, or sponsored by any listed
            publication, platform or event organiser. News from public RSS feeds
            &amp; Google News; hackathons from Devpost and ukhackathons.com;
            events from the open developers.events and confs.tech datasets.
            Headlines and summaries remain the property of their publishers —
            TechPulse shows a short extract and links to the original. Names and
            logos are trademarks of their owners. Always confirm details on the
            organiser&apos;s official page. To correct or remove a listing, use
            the contact link.
          </p>
        </div>
      </div>
    </footer>
  );
}
