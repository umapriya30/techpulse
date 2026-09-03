import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Bookmarks API.
 *
 * The MVP persists bookmarks in the browser (see app/providers.tsx) so the
 * feature works with no auth. This route is the server contract that a
 * signed-in experience would use instead — it validates input and echoes a
 * record shape matching the `bookmarks` table in prisma/schema.prisma.
 */

const schema = z.object({
  contentType: z.enum(["news", "event", "hackathon"]),
  contentId: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bookmark." }, { status: 422 });
  }
  return NextResponse.json({
    ok: true,
    bookmark: {
      id: `bm-${Date.now()}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, removed: id });
}
