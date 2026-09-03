import type { Metadata } from "next";
import { queryEvents } from "@/lib/queries";
import { CATEGORIES, EVENT_TYPES, UK_CITIES } from "@/lib/types";
import { Filters, type FilterGroup } from "@/components/filters";
import { EventGrid } from "@/components/grids";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Tech Events",
  description:
    "UK and online tech conferences, summits, meetups, workshops and webinars across AI, Data, LLMs, Cloud and more.",
};

const PER_PAGE = 9;
type SP = Record<string, string | undefined>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const items = await queryEvents({
    categories: sp.categories?.split(",").filter(Boolean),
    types: sp.types?.split(",").filter(Boolean),
    location: sp.city || sp.country || sp.location,
    format: sp.format as never,
    date: sp.date as never,
    price: sp.price as never,
    topic: sp.topic,
    query: sp.q,
    upcomingOnly: sp.past !== "true",
  });

  const page = Number(sp.page ?? "1");
  const pageData = paginate(items, page, PER_PAGE);

  const groups: FilterGroup[] = [
    {
      key: "location",
      label: "Region",
      type: "single",
      options: [
        { value: "UK", label: "UK" },
        { value: "Online", label: "Online" },
        { value: "Europe", label: "Europe" },
        { value: "North America", label: "North America" },
        { value: "Asia", label: "Asia" },
        { value: "Middle East", label: "Middle East" },
        { value: "Africa", label: "Africa" },
        { value: "Oceania", label: "Oceania" },
        { value: "Hybrid", label: "Hybrid" },
      ],
    },
    {
      key: "country",
      label: "Country",
      type: "single",
      options: [
        { value: "United Kingdom", label: "United Kingdom" },
        { value: "United States", label: "United States" },
        { value: "Germany", label: "Germany" },
        { value: "Netherlands", label: "Netherlands" },
        { value: "France", label: "France" },
        { value: "India", label: "India" },
        { value: "Singapore", label: "Singapore" },
        { value: "Australia", label: "Australia" },
        { value: "Canada", label: "Canada" },
      ],
    },
    {
      key: "format",
      label: "Format",
      type: "single",
      options: [
        { value: "in-person", label: "In-person" },
        { value: "online", label: "Online" },
        { value: "hybrid", label: "Hybrid" },
      ],
    },
    {
      key: "city",
      label: "City",
      type: "single",
      options: [
        ...UK_CITIES.slice(0, 6).map((c) => ({ value: c, label: c })),
        { value: "New York", label: "New York" },
        { value: "San Francisco", label: "San Francisco" },
        { value: "Berlin", label: "Berlin" },
        { value: "Amsterdam", label: "Amsterdam" },
        { value: "Bengaluru", label: "Bengaluru" },
        { value: "Singapore", label: "Singapore" },
      ],
    },
    {
      key: "categories",
      label: "Category",
      type: "multi",
      options: CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      key: "types",
      label: "Event type",
      type: "multi",
      options: EVENT_TYPES.map((t) => ({ value: t, label: t })),
    },
    {
      key: "date",
      label: "Date",
      type: "single",
      options: [
        { value: "today", label: "Today" },
        { value: "week", label: "This week" },
        { value: "month", label: "This month" },
        { value: "next-month", label: "Next month" },
      ],
    },
    {
      key: "price",
      label: "Price",
      type: "single",
      options: [
        { value: "free", label: "Free" },
        { value: "paid", label: "Paid" },
        { value: "u25", label: "Under £25" },
        { value: "u50", label: "Under £50" },
        { value: "u100", label: "Under £100" },
      ],
    },
  ];

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          🎤 Tech Events
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Tech events — worldwide &amp; online
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Conferences, summits, meetups, workshops and webinars across the UK,
          Europe, North America, Asia and online — covering AI, Data, LLMs,
          Cloud, Cybersecurity and more. Filter by region or city.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filters groups={groups} resultCount={items.length} />
        <div>
          <EventGrid items={pageData.items} />
          <Pagination
            page={pageData.page}
            pages={pageData.pages}
            params={sp}
            basePath="/events"
          />
        </div>
      </div>
    </div>
  );
}
