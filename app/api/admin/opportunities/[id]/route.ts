import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Approve/reject a Hunt "Needs Review" row. Never auto-published — this is the only way in. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Expected { action: 'approve' | 'reject' }" }, { status: 400 });
  }
  const data =
    body.action === "approve"
      ? { status: "published", verificationStatus: "verified", lastVerifiedAt: new Date() }
      : { status: "removed", verificationStatus: "removed" };
  try {
    const item = await prisma.opportunity.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }
}
