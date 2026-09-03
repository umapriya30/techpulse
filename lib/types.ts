// Core domain types for TECHPULSE

export type Category =
  | "AI"
  | "Data"
  | "LLM"
  | "Cloud"
  | "Software"
  | "Cybersecurity"
  | "Robotics"
  | "Startups"
  | "Open Source";

export const CATEGORIES: Category[] = [
  "AI",
  "Data",
  "LLM",
  "Cloud",
  "Software",
  "Cybersecurity",
  "Robotics",
  "Startups",
  "Open Source",
];

export type Topic =
  | "Artificial Intelligence"
  | "Generative AI"
  | "LLMs"
  | "Agentic AI"
  | "Data Science"
  | "Data Engineering"
  | "Cloud"
  | "AWS"
  | "Azure"
  | "Google Cloud"
  | "Cybersecurity"
  | "Robotics"
  | "Software Engineering"
  | "Startups"
  | "Open Source";

export const TOPICS: Topic[] = [
  "Artificial Intelligence",
  "Generative AI",
  "LLMs",
  "Agentic AI",
  "Data Science",
  "Data Engineering",
  "Cloud",
  "AWS",
  "Azure",
  "Google Cloud",
  "Cybersecurity",
  "Robotics",
  "Software Engineering",
  "Startups",
  "Open Source",
];

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageColor: string; // gradient key used for the generated cover fallback
  imageUrl?: string; // real cover image from the source, when available
  source: string;
  sourceUrl: string;
  category: Category;
  subcategory: string;
  tags: string[];
  publishedAt: string; // ISO
  readMinutes: number;
  trending: boolean;
  verifiedSource: boolean;
}

export type LocationMode = "UK In-Person" | "In-Person" | "Online" | "Hybrid";

export type Region =
  | "UK"
  | "Europe"
  | "North America"
  | "Asia"
  | "Middle East"
  | "Africa"
  | "Oceania"
  | "South America"
  | "Online"
  | "Global";

export const REGIONS: Region[] = [
  "UK",
  "Europe",
  "North America",
  "Asia",
  "Middle East",
  "Africa",
  "Oceania",
  "South America",
  "Online",
  "Global",
];

/** Map a free-text country to a coarse region. */
export function regionForCountry(raw?: string | null): Region {
  const c = (raw ?? "").toLowerCase().replace(/[.\s]/g, "");
  if (!c || /online|virtual|remote/.test(c)) return "Online";
  if (/^(uk|unitedkingdom|england|scotland|wales|northernireland|greatbritain)$/.test(c)) return "UK";
  if (
    /(usa|unitedstates|us|canada|mexico)/.test(c)
  )
    return "North America";
  if (
    /(germany|france|spain|italy|netherlands|poland|sweden|norway|denmark|finland|ireland|portugal|belgium|austria|switzerland|czech|greece|hungary|romania|ukraine|europe|estonia|lithuania|latvia|croatia|serbia|bulgaria|slovakia|slovenia|luxembourg|iceland)/.test(
      c,
    )
  )
    return "Europe";
  if (
    /(india|china|japan|singapore|indonesia|malaysia|thailand|vietnam|philippines|southkorea|korea|taiwan|hongkong|pakistan|bangladesh|srilanka|nepal|kazakhstan)/.test(
      c,
    )
  )
    return "Asia";
  if (/(uae|unitedarabemirates|saudiarabia|qatar|israel|turkey|kuwait|bahrain|oman|jordan|lebanon|egypt)/.test(c))
    return "Middle East";
  if (/(nigeria|kenya|southafrica|ghana|rwanda|egypt|morocco|tunisia|uganda|tanzania|ethiopia)/.test(c))
    return "Africa";
  if (/(australia|newzealand)/.test(c)) return "Oceania";
  if (/(brazil|argentina|chile|colombia|peru|uruguay)/.test(c)) return "South America";
  return "Global";
}

export const UK_CITIES = [
  "London",
  "Manchester",
  "Liverpool",
  "Birmingham",
  "Edinburgh",
  "Glasgow",
  "Bristol",
  "Cambridge",
  "Oxford",
  "Leeds",
  "Belfast",
] as const;

export type EventType =
  | "Conference"
  | "Summit"
  | "Meetup"
  | "Workshop"
  | "Webinar"
  | "Hackathon"
  | "Networking"
  | "Training"
  | "Exhibition";

export const EVENT_TYPES: EventType[] = [
  "Conference",
  "Summit",
  "Meetup",
  "Workshop",
  "Webinar",
  "Hackathon",
  "Networking",
  "Training",
  "Exhibition",
];

export interface Speaker {
  name: string;
  title: string;
  company: string;
  linkedin?: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  speaker?: string;
}

export interface TechEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  about: string;
  organizer: string;
  eventType: EventType;
  categories: Category[];
  topics: string[];
  mode: LocationMode;
  city: string | null;
  country: string;
  venue: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  time: string;
  price: number; // 0 == free
  currency: "GBP" | "USD" | "EUR";
  registrationRequired: boolean;
  websiteUrl: string;
  registrationUrl: string;
  registrationDeadline: string | null; // ISO
  imageColor: string;
  imageUrl?: string;
  verified: boolean;
  featured: boolean;
  speakers: Speaker[];
  schedule: ScheduleItem[];
}

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Prize {
  place: string;
  amount: number;
  note?: string;
}

export interface KeyDate {
  label: string;
  date: string; // ISO
}

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  description: string;
  challenge: string;
  requirements: string[];
  organizer: string;
  technologies: string[];
  categories: Category[];
  region: Region;
  country?: string;
  mode: "Online" | "In-Person" | "Hybrid";
  city: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  registrationDeadline: string; // ISO
  durationHours: number;
  prizePool: number;
  currency: "GBP" | "USD" | "EUR";
  prizes: Prize[];
  keyDates: KeyDate[];
  teamMin: number;
  teamMax: number;
  difficulty: Difficulty;
  websiteUrl: string;
  registrationUrl: string;
  imageColor: string;
  imageUrl?: string;
  verified: boolean;
  featured: boolean;
}

export type ContentType = "news" | "event" | "hackathon";

export interface SearchResult {
  type: ContentType;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  meta: string;
}

export interface Preferences {
  topics: string[];
  locations: string[];
  notifications: {
    news: boolean;
    hackathons: boolean;
    eventsSoon: boolean;
    deadlines: boolean;
    savedReminders: boolean;
  };
  onboarded: boolean;
}

export interface AppNotification {
  id: string;
  type: "news" | "hackathon" | "event" | "deadline" | "reminder";
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
}
