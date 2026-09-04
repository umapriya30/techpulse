import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Enable/disable a Hunt data source — persists, unlike the rest of the admin panel's flags. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Expected { enabled: boolean }" }, { status: 400 });
  }
  try {
    const source = await prisma.dataSource.update({
      where: { id },
      data: { enabled: body.enabled },
    });
    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
}
