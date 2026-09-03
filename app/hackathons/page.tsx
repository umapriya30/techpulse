import type { Metadata } from "next";
import { queryHackathons } from "@/lib/queries";
import { Filters, type FilterGroup } from "@/components/filters";
import { HackathonGrid } from "@/components/grids";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "AI Hackathons",
  description:
    "AI, ML, LLM, Agentic AI and Data Science hackathons — UK and online. Track registration deadlines, prizes and team sizes.",
};

const PER_PAGE = 9;
type SP = Record<string, string | undefined>;

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const items = await queryHackathons({
    technologies: sp.technologies?.split(",").filter(Boolean),
    region: sp.region,
    mode: sp.format as never,
    deadline: sp.deadline as never,
    prize: sp.prize as never,
    hasPrize: sp.cash === "yes",
    difficulty: sp.difficulty?.split(",").filter(Boolean),
    teamSize: sp.team as never,
    topic: sp.topic,
    query: sp.q,
    openOnly: sp.closed !== "true",
  });

  const page = Number(sp.page ?? "1");
  const pageData = paginate(items, page, PER_PAGE);

  const groups: FilterGroup[] = [
    {
      key: "technologies",
      label: "Technology",
      type: "multi",
      options: [
        "AI",
        "ML",
        "LLM",
        "GenAI",
        "Agentic AI",
        "Computer Vision",
        "NLP",
        "Data Science",
        "RAG",
        "Cybersecurity",
      ].map((t) => ({ value: t, label: t })),
    },
    {
      key: "region",
      label: "Location",
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
        { value: "Global", label: "Global" },
      ],
    },
    {
      key: "format",
      label: "Format",
      type: "single",
      options: [
        { value: "online", label: "Online" },
        { value: "in-person", label: "In-person" },
        { value: "hybrid", label: "Hybrid" },
      ],
    },
    {
      key: "deadline",
      label: "Deadline",
      type: "single",
      options: [
        { value: "soon", label: "Closing soon" },
        { value: "week", label: "This week" },
        { value: "month", label: "This month" },
        { value: "future", label: "Future" },
      ],
    },
    {
      key: "prize",
      label: "Prize",
      type: "single",
      options: [
        { value: "1k", label: "$1K+" },
        { value: "5k", label: "$5K+" },
        { value: "10k", label: "$10K+" },
        { value: "50k", label: "$50K+" },
      ],
    },
    {
      key: "cash",
      label: "Cash prize",
      type: "single",
      options: [{ value: "yes", label: "Has a cash prize" }],
    },
    {
      key: "difficulty",
      label: "Difficulty",
      type: "multi",
      options: [
        { value: "Beginner", label: "Beginner" },
        { value: "Intermediate", label: "Intermediate" },
        { value: "Advanced", label: "Advanced" },
      ],
    },
    {
      key: "team",
      label: "Team size",
      type: "single",
      options: [
        { value: "solo", label: "Solo" },
        { value: "small", label: "2–4" },
        { value: "large", label: "5+" },
      ],
    },
  ];

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          🏆 AI Hackathons
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Hackathons you can join — worldwide
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          AI, ML, LLM, Agentic AI, GenAI, Data Science and developer
          competitions from Devpost — online and in-person across every region.
          Deadlines are calculated live so you never miss one.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filters groups={groups} resultCount={items.length} />
        <div>
          <HackathonGrid items={pageData.items} />
          <Pagination
            page={pageData.page}
            pages={pageData.pages}
            params={sp}
            basePath="/hackathons"
          />
        </div>
      </div>
    </div>
  );
}
