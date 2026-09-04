import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestSingleOpportunity } from "@/lib/hunt/pipeline";
import { listNeedsReview } from "@/lib/hunt/queries";
import type { HuntCategory } from "@/lib/hunt/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(3, "Title is too short."),
  type: z.string().min(1, "Type is required."),
  description: z.string().min(20, "Please add a longer description."),
  organisation: z.string().min(2, "Organisation is required."),
  website: z.string().url("Website must be a valid URL."),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  sourceUrl: z.string().url("Source URL must be a valid URL."),
  location: z.string().optional(),
  country: z.string().optional(),
  deadline: z.string().optional(),
  prize: z.string().optional(),
  eligibility: z.string().optional(),
  tags: z.string().optional(), // comma-separated
});

/** Admin "Add Opportunity" — runs the exact same normalise/validate/dedupe-free pipeline path as a source adapter. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 422 });
  }
  const { applicationUrl, tags, type, ...rest } = parsed.data;
  const result = await ingestSingleOpportunity(
    {
      ...rest,
      type: type as HuntCategory,
      applicationUrl: applicationUrl || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    },
    "admin-manual-add",
    "manual",
  );
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  const items = await listNeedsReview().catch((err) => {
    console.warn("[/api/admin/opportunities] listNeedsReview failed:", err instanceof Error ? err.message : err);
    return [];
  });
  return NextResponse.json({ items });
}
