import { NextResponse } from "next/server";
import { runNewsIngestion, type RawArticle } from "@/lib/ai/ingest";
import { provider } from "@/lib/provider";
import { slugify } from "@/lib/utils";

// Demonstrates the ingestion pipeline: feed raw items through normalise ->
// dedupe -> AI classify/summarise/topics and return what would be stored.
const SAMPLE_RAW: RawArticle[] = [
  {
    title: "Open-source LLM release adds long-context benchmark leadership",
    description:
      "A new open-weight model release claims the top open-source score on a long-context retrieval benchmark, with permissive licensing and quantised checkpoints for consumer GPUs.",
    url: "https://venturebeat.com/category/ai/",
    source: "VentureBeat",
    imageColor: "violet",
  },
  {
    title: "Kubernetes platform teams adopt policy-as-code for multi-cluster fleets",
    description:
      "Platform engineering groups running large multi-cluster Kubernetes fleets are standardising on policy-as-code to enforce guardrails and reduce misconfiguration across cloud environments.",
    url: "https://www.theverge.com/tech",
    source: "The Verge",
    imageColor: "slate",
  },
  {
    title: "New open-source LLM tops independent reasoning benchmark",
    description: "Duplicate of an existing story — should be de-duplicated.",
    url: "https://example.com",
    source: "Example",
  },
];

export async function GET() {
  const existing = await provider.listNews();
  const fingerprints = new Set(
    existing.map((n) => slugify(n.title).slice(0, 60)),
  );
  const report = await runNewsIngestion(SAMPLE_RAW, fingerprints);
  return NextResponse.json({
    pipeline: [
      "fetch",
      "normalise",
      "dedupe",
      "AI classify",
      "AI summarise",
      "extract topics",
      "detect trending",
      "store",
    ],
    report,
  });
}
