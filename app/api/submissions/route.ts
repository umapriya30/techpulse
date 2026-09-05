import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestSingleOpportunity } from "@/lib/hunt/pipeline";

const baseSchema = z.object({
  kind: z.enum(["event", "hackathon", "award", "volunteering", "speaking"]),
  name: z.string().min(3, "Name is too short."),
  organizer: z.string().min(2, "Organiser is required."),
  description: z.string().min(20, "Please add a longer description."),
  category: z.string().min(1),
  eventType: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  mode: z.enum(["UK In-Person", "Online", "Hybrid", "In-Person"]).optional(),
  price: z.string().optional(),
  website: z.string().url("Website must be a valid URL."),
  registrationUrl: z.string().url("Registration/application URL must be a valid URL.").optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid contact email."),
});

// Event/hackathon submissions keep their original required fields; award/volunteering
// (Hunt kinds) relax date/mode/registrationUrl since those don't always apply.
const schema = baseSchema.superRefine((data, ctx) => {
  const isEventOrHackathon = data.kind === "event" || data.kind === "hackathon";
  if (isEventOrHackathon && !data.date) {
    ctx.addIssue({ code: "custom", message: "Date is required.", path: ["date"] });
  }
  if (isEventOrHackathon && !data.mode) {
    ctx.addIssue({ code: "custom", message: "Format is required.", path: ["mode"] });
  }
  if (isEventOrHackathon && !data.registrationUrl) {
    ctx.addIssue({ code: "custom", message: "Registration URL is required.", path: ["registrationUrl"] });
  }
});

// MVP: submissions go to an in-memory review queue. In production this writes
// a row with status "pending" for the admin verification workflow.
const queue: (z.infer<typeof schema> & { id: string; submittedAt: string })[] =
  [];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 422 },
    );
  }

  const record = {
    ...parsed.data,
    id: `sub-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  queue.push(record);

  // Hunt kinds also run through the real ingestion pipeline (validate ->
  // AI-enrich -> store as needs_review) so they actually land in the admin
  // "Needs Review" queue, never auto-published — per spec §25.
  if (parsed.data.kind === "award" || parsed.data.kind === "volunteering" || parsed.data.kind === "speaking") {
    try {
      await ingestSingleOpportunity(
        {
          title: parsed.data.name,
          type: parsed.data.kind,
          description: parsed.data.description,
          organisation: parsed.data.organizer,
          website: parsed.data.website,
          applicationUrl: parsed.data.registrationUrl || undefined,
          sourceUrl: parsed.data.website,
          location: parsed.data.location || undefined,
          deadline: parsed.data.date || undefined,
        },
        "user-submission",
        "user_submission",
      );
    } catch (err) {
      // Don't fail the whole submission if Hunt's database isn't configured
      // yet — it's still queued above for admin visibility.
      console.warn("[submissions] Hunt ingest failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({
    ok: true,
    id: record.id,
    status: "pending",
    message:
      "Thanks! Your submission is pending verification. Our team reviews new listings before they are published.",
  });
}

export async function GET() {
  return NextResponse.json({ pending: queue.length, queue });
}
