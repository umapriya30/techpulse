import { NextResponse } from "next/server";
import { queryEvents } from "@/lib/queries";
import { paginate } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const items = await queryEvents({
    categories: split(searchParams.get("categories")),
    types: split(searchParams.get("types")),
    location: searchParams.get("location") ?? undefined,
    date: (searchParams.get("date") as never) ?? undefined,
    price: (searchParams.get("price") as never) ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    upcomingOnly: searchParams.get("upcoming") !== "false",
  });
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "12");
  return NextResponse.json(paginate(items, page, perPage));
}

function split(v: string | null): string[] | undefined {
  return v ? v.split(",").filter(Boolean) : undefined;
}
