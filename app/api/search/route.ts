import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/queries";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type");
  const limit = Number(searchParams.get("limit") ?? "30");

  let results = await globalSearch(q);
  if (type) results = results.filter((r) => r.type === type);

  const counts = {
    news: results.filter((r) => r.type === "news").length,
    event: results.filter((r) => r.type === "event").length,
    hackathon: results.filter((r) => r.type === "hackathon").length,
    opportunity: results.filter((r) => r.type === "opportunity").length,
  };

  return NextResponse.json({
    query: q,
    total: results.length,
    counts,
    results: results.slice(0, limit),
  });
}
