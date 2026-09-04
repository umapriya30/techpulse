/**
 * LLM abstraction layer.
 *
 * The ingestion pipeline (classify / summarise / extract topics) talks only to
 * this interface, so the underlying model provider can be swapped without
 * touching pipeline code. The MVP ships a deterministic heuristic provider so
 * the app works with zero API keys. To use a real model, implement `LlmProvider`
 * against your SDK of choice and export it from `getLlm()`.
 */

import type { Category } from "@/lib/types";

export interface ClassifyInput {
  title: string;
  body: string;
  source?: string;
}

export interface ClassifyResult {
  category: Category;
  subcategory: string;
  tags: string[];
  summary: string;
  trending: boolean;
  confidence: number;
}

export interface ClassifyOpportunityInput {
  title: string;
  description: string;
  /** HuntCategory as a plain string, to avoid a lib/ai -> lib/hunt import cycle. */
  type: string;
}

export interface ClassifyOpportunityResult {
  category: Category[];
  tags: string[];
  /** Text-derived, not invented — only set true when the source text says so. */
  eligibilityGuess: {
    studentEligible: boolean;
    graduateEligible: boolean;
    professionalEligible: boolean;
    founderEligible: boolean;
  };
}

export interface LlmProvider {
  name: string;
  classifyArticle(input: ClassifyInput): Promise<ClassifyResult>;
  classifyOpportunity(input: ClassifyOpportunityInput): Promise<ClassifyOpportunityResult>;
}

/* --------------------- Heuristic (no-API) provider --------------------- */

const RULES: {
  category: Category;
  subcategory: string;
  patterns: RegExp[];
}[] = [
  { category: "LLM", subcategory: "New Models", patterns: [/\bllm\b/i, /language model/i, /open-?weight/i, /benchmark/i, /fine-?tun/i, /\brag\b/i] },
  { category: "AI", subcategory: "AI Agents", patterns: [/\bagent(ic)?\b/i, /autonomous/i, /tool[- ]call/i] },
  { category: "AI", subcategory: "Computer Vision", patterns: [/vision/i, /image|detection|segmentation/i] },
  { category: "AI", subcategory: "AI Research", patterns: [/\bai\b/i, /machine learning/i, /neural/i, /model/i] },
  { category: "Data", subcategory: "Data Engineering", patterns: [/pipeline/i, /data (engineering|platform|contract)/i, /warehouse|streaming|etl/i] },
  { category: "Data", subcategory: "Databases", patterns: [/database|postgres|vector (search|database)|sql/i] },
  { category: "Cloud", subcategory: "Cloud", patterns: [/cloud|kubernetes|data ?cent(re|er)|serverless|aws|azure|gcp/i] },
  { category: "Cybersecurity", subcategory: "Threats", patterns: [/security|phishing|vulnerab|breach|malware|threat/i] },
  { category: "Robotics", subcategory: "Manipulation", patterns: [/robot|manipulation|autonomous system/i] },
  { category: "Startups", subcategory: "Funding", patterns: [/startup|funding|raise|seed|series [a-e]|venture/i] },
  { category: "Open Source", subcategory: "Governance", patterns: [/open[- ]source|maintainer|licen[cs]e|contribution/i] },
  { category: "Software", subcategory: "Developer Tools", patterns: [/developer|ci\/cd|framework|compiler|editor/i] },
];

const TAG_PATTERNS: [RegExp, string][] = [
  [/open-?source|open-?weight/i, "Open Source"],
  [/\bllm(s)?\b|language model/i, "LLM"],
  [/benchmark/i, "Benchmark"],
  [/\brag\b|retrieval-augmented/i, "RAG"],
  [/agent(ic)?/i, "Agentic AI"],
  [/machine learning|\bml\b/i, "Machine Learning"],
  [/generative/i, "Generative AI"],
  [/data engineering/i, "Data Engineering"],
  [/kubernetes|cloud native/i, "Cloud"],
  [/security|phishing/i, "Cybersecurity"],
  [/robot/i, "Robotics"],
  [/\buk\b|london|manchester|britain/i, "UK"],
  [/vector (search|database)/i, "Vector Search"],
];

class HeuristicLlm implements LlmProvider {
  name = "heuristic";

  async classifyArticle(input: ClassifyInput): Promise<ClassifyResult> {
    const text = `${input.title}\n${input.body}`;
    let best = RULES[RULES.length - 1];
    let bestScore = 0;
    for (const rule of RULES) {
      const score = rule.patterns.reduce(
        (acc, re) => acc + (re.test(text) ? 1 : 0),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        best = rule;
      }
    }
    const tags = new Set<string>();
    for (const [re, tag] of TAG_PATTERNS) if (re.test(text)) tags.add(tag);
    tags.add(best.category);

    const firstSentences = input.body
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s/)
      .slice(0, 2)
      .join(" ")
      .trim();

    const trending =
      /\b(first|record|beats?|tops?|breakthrough|surge|accelerat|major)\b/i.test(
        text,
      ) && bestScore >= 2;

    return {
      category: best.category,
      subcategory: best.subcategory,
      tags: [...tags].slice(0, 5),
      summary: firstSentences || input.title,
      trending,
      confidence: Math.min(1, 0.4 + bestScore * 0.2),
    };
  }

  async classifyOpportunity(input: ClassifyOpportunityInput): Promise<ClassifyOpportunityResult> {
    const text = `${input.title}\n${input.description}`;

    const categories = new Set<Category>();
    for (const rule of RULES) {
      if (rule.patterns.some((re) => re.test(text))) categories.add(rule.category);
    }
    if (categories.size === 0) categories.add("Software");

    const tags = new Set<string>();
    for (const [re, tag] of TAG_PATTERNS) if (re.test(text)) tags.add(tag);

    return {
      category: [...categories].slice(0, 3),
      tags: [...tags].slice(0, 6),
      eligibilityGuess: {
        studentEligible: /\bstudents?\b|undergrad|\buniversity\b/i.test(text),
        graduateEligible: /\bgraduates?\b|early[- ]career/i.test(text),
        professionalEligible: /\bprofessionals?\b|\bindustry\b|working/i.test(text),
        founderEligible: /\bfounders?\b|startup founder|entrepreneur/i.test(text),
      },
    };
  }
}

let cached: LlmProvider | null = null;

export function getLlm(): LlmProvider {
  if (cached) return cached;
  // Swap here for a real provider, e.g.
  //   if (process.env.ANTHROPIC_API_KEY) cached = new AnthropicLlm();
  cached = new HeuristicLlm();
  return cached;
}
