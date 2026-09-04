import { NextResponse } from "next/server";
import { queryOpportunities } from "@/lib/hunt/queries";
import { paginate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const freeParam = searchParams.get("free");
  const items = await queryOpportunities({
    type: split(searchParams.get("type")) as never,
    category: searchParams.get("category") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    deadline: (searchParams.get("deadline") as never) ?? undefined,
    free: freeParam === "true" ? true : freeParam === "false" ? false : undefined,
    eligibility: (searchParams.get("eligibility") as never) ?? undefined,
    query: searchParams.get("q") ?? undefined,
  }).catch((err) => {
    console.warn("[/api/hunt] queryOpportunities failed:", err instanceof Error ? err.message : err);
    return [];
  });
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "12");
  return NextResponse.json(paginate(items, page, perPage));
}

function split(v: string | null): string[] | undefined {
  return v ? v.split(",").filter(Boolean) : undefined;
}
