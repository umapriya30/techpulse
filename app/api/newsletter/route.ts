import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

// In-memory store for the MVP. Swap for a table / ESP integration.
const subscribers = new Set<string>();

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
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 422 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const already = subscribers.has(email);
  subscribers.add(email);

  return NextResponse.json({
    ok: true,
    message: already
      ? "You're already on the list — see you Monday."
      : "You're in. The next TechPulse digest lands in your inbox soon.",
  });
}
