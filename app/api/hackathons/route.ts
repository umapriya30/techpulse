import { NextResponse } from "next/server";
import { queryHackathons } from "@/lib/queries";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const items = await queryHackathons({
    technologies: split(searchParams.get("technologies")),
    categories: split(searchParams.get("categories")),
    region: searchParams.get("region") ?? undefined,
    deadline: (searchParams.get("deadline") as never) ?? undefined,
    prize: (searchParams.get("prize") as never) ?? undefined,
    difficulty: split(searchParams.get("difficulty")),
    teamSize: (searchParams.get("team") as never) ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    openOnly: searchParams.get("open") !== "false",
  });
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "12");
  return NextResponse.json(paginate(items, page, perPage));
}

function split(v: string | null): string[] | undefined {
  return v ? v.split(",").filter(Boolean) : undefined;
}
