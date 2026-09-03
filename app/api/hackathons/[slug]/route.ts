import { NextResponse } from "next/server";
import { provider } from "@/lib/provider";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const hackathon = await provider.getHackathon(slug);
  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
  }
  return NextResponse.json(hackathon);
}
