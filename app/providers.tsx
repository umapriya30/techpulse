"use client";

import { ThemeProvider } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification, ContentType, Preferences } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Local store: bookmarks, preferences, notifications, lightweight auth.      */
/*  Persisted to localStorage so the MVP is fully functional with no backend.  */
/*  Swap for API-backed calls (see app/api/bookmarks) when auth is wired.      */
/* -------------------------------------------------------------------------- */

const LS = {
  bookmarks: "tp:bookmarks",
  prefs: "tp:preferences",
  notifs: "tp:notifications",
  user: "tp:user",
  theme: "tp:theme",
};

export interface Bookmark {
  type: ContentType;
  slug: string;
  savedAt: string;
}

export interface User {
  name: string;
  email: string;
}

const DEFAULT_PREFS: Preferences = {
  topics: [],
  locations: [],
  notifications: {
    news: true,
    hackathons: true,
    eventsSoon: true,
    deadlines: true,
    savedReminders: true,
  },
  onboarded: false,
};

interface StoreValue {
  ready: boolean;
  bookmarks: Bookmark[];
  isSaved: (type: ContentType, slug: string) => boolean;
  toggleSave: (type: ContentType, slug: string) => void;
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  notifications: AppNotification[];
  unread: number;
  markAllRead: () => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

function Store({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setBookmarks(read<Bookmark[]>(LS.bookmarks, []));
    setPrefsState(read<Preferences>(LS.prefs, DEFAULT_PREFS));
    setNotifications(read<AppNotification[]>(LS.notifs, seedNotifications()));
    setUser(read<User | null>(LS.user, null));
    setReady(true);
  }, []);

  const toggleSave = useCallback(
    (type: ContentType, slug: string) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.type === type && b.slug === slug);
        const next = exists
          ? prev.filter((b) => !(b.type === type && b.slug === slug))
          : [{ type, slug, savedAt: new Date().toISOString() }, ...prev];
        write(LS.bookmarks, next);
        return next;
      });
    },
    [],
  );

  const isSaved = useCallback(
    (type: ContentType, slug: string) =>
      bookmarks.some((b) => b.type === type && b.slug === slug),
    [bookmarks],
  );

  const setPrefs = useCallback((p: Preferences) => {
    setPrefsState(p);
    write(LS.prefs, p);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      write(LS.notifs, next);
      return next;
    });
  }, []);

  const pushNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      setNotifications((prev) => {
        const next = [
          {
            ...n,
            id: `local-${Date.now()}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...prev,
        ].slice(0, 40);
        write(LS.notifs, next);
        return next;
      });
    },
    [],
  );

  const signIn = useCallback((u: User) => {
    setUser(u);
    write(LS.user, u);
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    write(LS.user, null);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      bookmarks,
      isSaved,
      toggleSave,
      prefs,
      setPrefs,
      notifications,
      unread: notifications.filter((n) => !n.read).length,
      markAllRead,
      pushNotification,
      user,
      signIn,
      signOut,
    }),
    [
      ready,
      bookmarks,
      isSaved,
      toggleSave,
      prefs,
      setPrefs,
      notifications,
      markAllRead,
      pushNotification,
      user,
      signIn,
      signOut,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <Providers>");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Store>{children}</Store>
    </ThemeProvider>
  );
}

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  return [
    {
      id: "seed-1",
      type: "deadline",
      message: "🔥 “Build With AI Agents Hackathon” closes soon — check the deadline.",
      href: "/hackathons/build-with-ai-agents-hackathon",
      createdAt: ago(3),
      read: false,
    },
    {
      id: "seed-2",
      type: "news",
      message: "🧠 New open-source LLM tops an independent reasoning benchmark.",
      href: "/news/open-source-llm-tops-reasoning-benchmark",
      createdAt: ago(6),
      read: false,
    },
    {
      id: "seed-3",
      type: "event",
      message: "🎤 Responsible Generative AI Deployment webinar is coming up.",
      href: "/events/generative-ai-webinar-responsible-deployment-2026",
      createdAt: ago(26),
      read: true,
    },
  ];
}
