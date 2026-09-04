"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Home,
  Menu,
  Newspaper,
  Search as SearchIcon,
  Target,
  Trophy,
  Ticket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { AuthButton } from "@/components/auth-button";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/news", label: "Tech News", icon: Newspaper },
  { href: "/events", label: "Events", icon: Ticket },
  { href: "/hackathons", label: "Hackathons", icon: Trophy },
  { href: "/hunt", label: "Hunt", icon: Target },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/about", label: "About", icon: Home },
];

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/hunt", label: "Hunt", icon: Target },
  { href: "/hackathons", label: "Hackathons", icon: Trophy },
  { href: "/events", label: "Events", icon: Ticket },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="container-page flex h-16 items-center gap-3">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded focus-ring"
          >
            <Logo showWordmark={false} size={34} />
            <span className="flex flex-col leading-none">
              <span className="wordmark text-sm">
                TECH<span className="accent">PULSE</span>
              </span>
              <span className="mt-1 hidden text-[10px] tracking-wide text-text-muted sm:block">
                Stay Ahead. Build. Learn. Connect.
              </span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-surface-2 text-text"
                    : "text-text-muted hover:bg-surface-2 hover:text-text",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
              aria-expanded={searchOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-ring sm:hidden"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                )
              }
              className="hidden h-9 items-center gap-2 rounded-lg border border-border px-2.5 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-ring sm:flex"
              aria-label="Open command palette"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="rounded border border-border bg-surface-2 px-1.5 text-[10px] font-semibold">
                ⌘K
              </kbd>
            </button>
            <NotificationBell />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <AuthButton />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-2 lg:hidden focus-ring"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border bg-surface/95 px-4 py-3">
            <div className="container-page">
              <SearchBar size="sm" autoFocus />
            </div>
          </div>
        )}

        {menuOpen && (
          <div className="border-t border-border bg-surface lg:hidden">
            <nav className="container-page flex flex-col py-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(pathname, item.href)
                      ? "bg-surface-2 text-text"
                      : "text-text-muted",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
                <ThemeToggle />
                <AuthButton compact />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass lg:hidden">
        <div className="flex">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-brand" : "text-text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
