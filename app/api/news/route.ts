import { NextResponse } from "next/server";
import { queryNews } from "@/lib/queries";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const items = await queryNews({
    category: searchParams.get("category") ?? undefined,
    categories: split(searchParams.get("categories")),
    sources: split(searchParams.get("sources")),
    topic: searchParams.get("topic") ?? undefined,
    time: (searchParams.get("time") as never) ?? undefined,
    query: searchParams.get("q") ?? undefined,
    trendingOnly: searchParams.get("trending") === "true",
  });
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "12");
  return NextResponse.json(paginate(items, page, perPage));
}

function split(v: string | null): string[] | undefined {
  return v ? v.split(",").filter(Boolean) : undefined;
}
