import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/hunt/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  const { slug } = await params;
  const item = await getOpportunity(slug).catch((err) => {
    console.warn("[/api/hunt/[category]/[slug]] getOpportunity failed:", err instanceof Error ? err.message : err);
    return null;
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}
