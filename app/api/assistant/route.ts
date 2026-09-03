import { NextResponse } from "next/server";
import { z } from "zod";
import { answer } from "@/lib/assistant/answer";

export const maxDuration = 60;

const schema = z.object({
  message: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ask me a question about tech news, events or hackathons." },
      { status: 422 },
    );
  }

  try {
    const result = await answer(parsed.data.message);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[assistant]", err);
    return NextResponse.json(
      {
        reply:
          "Something went wrong searching just now. Try again, or browse the News, Events and Hackathons pages directly.",
        results: [],
        intent: "error",
        suggestions: [],
      },
      { status: 200 },
    );
  }
}
