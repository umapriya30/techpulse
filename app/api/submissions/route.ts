import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  kind: z.enum(["event", "hackathon"]),
  name: z.string().min(3, "Name is too short."),
  organizer: z.string().min(2, "Organiser is required."),
  description: z.string().min(20, "Please add a longer description."),
  category: z.string().min(1),
  eventType: z.string().optional(),
  date: z.string().min(1, "Date is required."),
  time: z.string().optional(),
  location: z.string().optional(),
  mode: z.enum(["UK In-Person", "Online", "Hybrid", "In-Person"]),
  price: z.string().optional(),
  website: z.string().url("Website must be a valid URL."),
  registrationUrl: z.string().url("Registration URL must be a valid URL."),
  contactEmail: z.string().email("Enter a valid contact email."),
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
