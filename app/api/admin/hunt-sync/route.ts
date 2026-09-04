import { NextResponse } from "next/server";
import { runHuntSync } from "@/lib/hunt/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Server-side trigger for the admin "Sync now" button — no secret exposed to the browser. */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const reports = await runHuntSync(searchParams.get("source") ?? undefined);
  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString(), reports });
}
