import { NextResponse } from "next/server";
import { runHuntSync } from "@/lib/hunt/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sync trigger for Hunt sources. Called by:
 *  - vercel.json's daily cron (Vercel sends `Authorization: Bearer $CRON_SECRET`
 *    automatically for cron-configured routes when CRON_SECRET is set)
 *  - the admin "Sync now" button, server-side, with the same secret attached
 *    server-side so it's never exposed to the browser
 */
async function handle(req: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const reports = await runHuntSync(searchParams.get("source") ?? undefined);
  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString(), reports });
}

export const GET = handle;
export const POST = handle;
