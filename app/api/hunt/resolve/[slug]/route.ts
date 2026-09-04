import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/hunt/queries";

export const dynamic = "force-dynamic";

/**
 * Slug-only lookup (Opportunity.slug is globally unique across categories),
 * used by the WebMCP `open_item` tool since it only knows a ContentType +
 * slug, not the HuntCategory needed to build `/hunt/<category>/<slug>`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const item = await getOpportunity(slug).catch(() => null);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ href: `/hunt/${item.type}/${item.slug}` });
}
