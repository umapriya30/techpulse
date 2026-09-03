import { NextResponse } from "next/server";
import { closingSoon, trendingTopics } from "@/lib/queries";
import { queryNews } from "@/lib/queries";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "6");
  const [topics, closing, trendingNews] = await Promise.all([
    trendingTopics(limit),
    closingSoon(14),
    queryNews({ trendingOnly: true }),
  ]);
  return NextResponse.json({
    topics,
    closingSoon: closing.slice(0, 8),
    trendingNews: trendingNews.slice(0, 6),
  });
}
