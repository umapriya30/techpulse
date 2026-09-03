import type { ContentType } from "@/lib/types";

export type Intent =
  | "news"
  | "events"
  | "hackathons"
  | "trending"
  | "closing"
  | "help"
  | "greeting"
  | "mixed";

export interface ParsedQuery {
  intent: Intent;
  types: ContentType[];
  topics: string[];
  location: string | null;
  timeframe: "today" | "week" | "month" | "next-month" | "future" | null;
  deadlineWindow: "today" | "3days" | "week" | "month" | null;
  price: "free" | "paid" | null;
  minPrize: number | null;
  wantsCount: boolean;
  raw: string;
}

const TOPIC_MAP: [RegExp, string][] = [
  [/\bgen(?:erative)? ?ai\b/i, "Generative AI"],
  [/\bagentic\b|\bai agents?\b/i, "Agentic AI"],
  [/\bllms?\b|language models?/i, "LLM"],
  [/\brag\b|retrieval augmented/i, "RAG"],
  [/\bnlp\b|natural language/i, "NLP"],
  [/computer vision|\bcv\b/i, "Computer Vision"],
  [/machine learning|\bml\b/i, "Machine Learning"],
  [/data engineering/i, "Data Engineering"],
  [/data science/i, "Data Science"],
  [/\bdata\b/i, "Data"],
  [/cloud|kubernetes|aws|azure|gcp|devops/i, "Cloud"],
  [/cyber ?security|infosec|security/i, "Cybersecurity"],
  [/robotics?|robots?/i, "Robotics"],
  [/open ?source/i, "Open Source"],
  [/start ?ups?|founders?/i, "Startups"],
  [/software|developer|programming|coding/i, "Software"],
  [/\bai\b|artificial intelligence/i, "AI"],
];

const LOCATIONS = [
  "london",
  "manchester",
  "liverpool",
  "birmingham",
  "edinburgh",
  "glasgow",
  "bristol",
  "cambridge",
  "oxford",
  "leeds",
  "belfast",
  "new york",
  "san francisco",
  "berlin",
  "amsterdam",
  "singapore",
  "bengaluru",
  "bangalore",
  "toronto",
  "dubai",
  "paris",
];

const REGION_PATTERNS: [RegExp, string][] = [
  [/\beurope\b|\beu\b/, "Europe"],
  [/north america|\busa?\b|united states|\bus\b|america|canada/, "North America"],
  [/\basia\b|india|china|japan|korea|indonesia/, "Asia"],
  [/middle east|\buae\b|saudi|qatar|israel|dubai/, "Middle East"],
  [/\bafrica\b|nigeria|kenya|south africa|ghana|rwanda/, "Africa"],
  [/oceania|australia|new zealand/, "Oceania"],
  [/south america|brazil|argentina|chile|colombia/, "South America"],
];

export function parseQuery(input: string): ParsedQuery {
  const t = input.toLowerCase().trim();

  const wantsNews = /\bnews\b|articles?|headlines?|what(?:'s| is| has)? happen|latest|stories/.test(t);
  const wantsEvents = /\bevents?\b|conferences?|summits?|meet ?ups?|webinars?|workshops?|talks?|networking|expo/.test(t);
  const wantsHack = /hack ?a?thons?|competitions?|challenges?|buildathons?|ctf/.test(t);
  const wantsTrending = /trending|what'?s hot|popular|buzz|top topics?/.test(t);
  const wantsClosing =
    /\bclosing\b|\bcloses?\b|\bdeadlines?\b|\bdue\b|last chance|\bending soon\b|\bexpir/.test(t);

  const types: ContentType[] = [];
  if (wantsNews) types.push("news");
  if (wantsEvents) types.push("event");
  if (wantsHack) types.push("hackathon");

  let intent: Intent = "mixed";
  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b/.test(t)) intent = "greeting";
  else if (/^(help|what can you|how do|who are you|\?$)/.test(t) || t === "help") intent = "help";
  else if (wantsClosing && !wantsNews) intent = "closing";
  else if (wantsTrending) intent = "trending";
  else if (types.length === 1) intent = types[0] === "event" ? "events" : (types[0] as Intent);
  else if (types.length === 0 && !wantsClosing && !wantsTrending) intent = "help";

  const topics: string[] = [];
  for (const [re, name] of TOPIC_MAP) {
    if (re.test(t) && !topics.includes(name)) topics.push(name);
  }

  let location: string | null = null;
  if (/\bonline\b|virtual|remote|from home/.test(t)) location = "Online";
  else if (/\bhybrid\b/.test(t)) location = "Hybrid";
  else {
    const city = LOCATIONS.find((c) => new RegExp(`\\b${c}\\b`).test(t));
    if (city) location = city.replace(/\b\w/g, (m) => m.toUpperCase());
    else if (/\buk\b|united kingdom|britain|england|scotland|wales/.test(t))
      location = "UK";
    else {
      const region = REGION_PATTERNS.find(([re]) => re.test(t));
      if (region) location = region[1];
    }
  }

  let timeframe: ParsedQuery["timeframe"] = null;
  if (/\btoday\b|tonight/.test(t)) timeframe = "today";
  else if (/this week|next 7 days|coming week|7 days/.test(t)) timeframe = "week";
  else if (/next month/.test(t)) timeframe = "next-month";
  else if (/this month|next 30 days|30 days/.test(t)) timeframe = "month";
  else if (/upcoming|soon|future|coming up/.test(t)) timeframe = "future";

  let deadlineWindow: ParsedQuery["deadlineWindow"] = null;
  if (wantsClosing || wantsHack) {
    if (/today/.test(t)) deadlineWindow = "today";
    else if (/3 days|three days|next few days|couple of days/.test(t)) deadlineWindow = "3days";
    else if (/this week|7 days|week/.test(t)) deadlineWindow = "week";
    else if (/this month|30 days|month/.test(t)) deadlineWindow = "month";
  }

  const price: ParsedQuery["price"] = /\bfree\b|no cost|gratis/.test(t)
    ? "free"
    : /\bpaid\b/.test(t)
      ? "paid"
      : null;

  let minPrize: number | null = null;
  const prizeCtx = wantsHack || /prize|pot|pool|winnings?|reward|cash/.test(t);
  const pm =
    t.match(/(?:£|\$|€|over|above|more than|at least|min(?:imum)?)\s*(\d+(?:[.,]\d+)?)\s*(k|thousand|m|million)?\+?/) ||
    t.match(/(\d+(?:[.,]\d+)?)\s*(k|thousand|m|million)\+?/);
  if (pm && prizeCtx) {
    let n = parseFloat(pm[1].replace(/,/g, ""));
    if (/k|thousand/i.test(pm[2] ?? "")) n *= 1000;
    if (/m|million/i.test(pm[2] ?? "")) n *= 1_000_000;
    if (n >= 100) minPrize = n;
  }

  const wantsCount = /how many|number of|count|\bhow much\b/.test(t);

  return {
    intent,
    types,
    topics,
    location,
    timeframe,
    deadlineWindow,
    price,
    minPrize,
    wantsCount,
    raw: input,
  };
}
