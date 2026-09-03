import type { NewsArticle } from "@/lib/types";

// Realistic sample data for development. Replace with a live provider (RSS/API)
// via lib/provider.ts without touching the UI.
//
// DATA QUALITY: every item links to a real, publicly reachable source homepage.
// Summaries are illustrative editorial copy for the MVP, not verbatim quotes.

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

export const NEWS: NewsArticle[] = [
  {
    id: "n1",
    slug: "open-source-llm-tops-reasoning-benchmark",
    title: "New open-source LLM tops independent reasoning benchmark",
    summary:
      "A newly released open-weight model has posted the highest score yet among freely available models on a widely used reasoning benchmark, narrowing the gap with the leading proprietary systems.",
    content:
      "An open-weight large language model released this week has recorded the strongest published result among freely available models on a commonly cited reasoning benchmark. Independent researchers who reproduced the evaluation noted that the margin over the previous open-source leader is meaningful but that proprietary frontier models still hold an edge on the hardest multi-step tasks.\n\nThe release ships with permissive licensing for commercial use, quantised checkpoints for consumer GPUs, and a technical report describing the training data mix and post-training recipe. Analysts say the pace of open-source progress continues to compress the capability gap quarter over quarter, with implications for teams weighing self-hosting against API spend.\n\nAs always, benchmark numbers should be treated as directional. Downstream task performance, latency, context handling and tool-use reliability vary widely and should be measured on your own workloads before committing.",
    imageColor: "violet",
    source: "VentureBeat",
    sourceUrl: "https://venturebeat.com/category/ai/",
    category: "LLM",
    subcategory: "Open Source LLMs",
    tags: ["Open Source", "LLM", "Benchmark", "Machine Learning"],
    publishedAt: hoursAgo(2),
    readMinutes: 4,
    trending: true,
    verifiedSource: true,
  },
  {
    id: "n2",
    slug: "ai-coding-agents-move-into-ci-pipelines",
    title: "AI coding agents move from the editor into CI pipelines",
    summary:
      "Engineering teams are increasingly wiring autonomous coding agents into continuous integration to triage failing tests, draft fixes and open pull requests for human review.",
    content:
      "The first wave of AI coding assistants lived inside the editor as autocomplete. The current wave runs in the background: agents triggered by a failing build that read the logs, reproduce the failure, propose a patch and open a pull request annotated with their reasoning.\n\nProponents argue this reclaims hours of routine maintenance work. Skeptics point to review fatigue, subtle regressions that pass tests, and the need for tight scoping and permissions. Most teams adopting the pattern report starting with low-risk changes such as dependency bumps, flaky-test quarantine and lint fixes before widening the remit.\n\nThe tooling ecosystem is consolidating around a few patterns: sandboxed execution, explicit allowlists for the commands an agent may run, and a mandatory human approval gate before merge.",
    imageColor: "blue",
    source: "Ars Technica",
    sourceUrl: "https://arstechnica.com/ai/",
    category: "Software",
    subcategory: "Developer Tools",
    tags: ["AI Agents", "Developer Tools", "CI/CD", "Software Engineering"],
    publishedAt: hoursAgo(6),
    readMinutes: 5,
    trending: true,
    verifiedSource: true,
  },
  {
    id: "n3",
    slug: "retrieval-augmented-generation-standard-patterns",
    title: "RAG grows up: standard patterns emerge for production retrieval",
    summary:
      "After two years of ad-hoc pipelines, a set of well-understood retrieval-augmented generation patterns is becoming the default for grounding LLM applications in private data.",
    content:
      "Retrieval-augmented generation has moved from novelty to infrastructure. Teams shipping production systems have converged on a recognisable stack: chunking tuned to document structure rather than fixed token counts, hybrid dense-and-sparse retrieval, a reranking pass, and citation-first prompting so answers can be traced back to sources.\n\nEvaluation has matured alongside. Rather than eyeballing outputs, teams now maintain golden question sets, measure retrieval hit-rate separately from answer quality, and track groundedness with automated checks.\n\nThe remaining hard problems are freshness, access control that mirrors the underlying documents, and graceful behaviour when the corpus simply does not contain the answer.",
    imageColor: "emerald",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com/category/artificial-intelligence/",
    category: "LLM",
    subcategory: "RAG",
    tags: ["RAG", "LLM", "Vector Search", "AI Infrastructure"],
    publishedAt: hoursAgo(11),
    readMinutes: 6,
    trending: true,
    verifiedSource: true,
  },
  {
    id: "n4",
    slug: "uk-data-centre-investment-cloud-capacity",
    title: "UK data-centre investment accelerates to meet AI compute demand",
    summary:
      "Several operators have announced new UK facilities aimed at AI training and inference workloads, citing grid-connection progress and demand from domestic enterprises.",
    content:
      "Cloud and colocation operators have outlined fresh UK capacity plans focused on high-density racks for accelerated computing. The announcements emphasise power availability, liquid cooling and proximity to major connectivity hubs.\n\nIndustry groups welcomed the investment while renewing calls for faster grid connections and clearer planning guidance. Sustainability commitments feature prominently, with operators pledging renewable power contracts and heat-reuse schemes.\n\nFor engineering teams, more regional capacity should translate into lower-latency inference options and more choice for data-residency-sensitive workloads.",
    imageColor: "slate",
    source: "The Verge",
    sourceUrl: "https://www.theverge.com/tech",
    category: "Cloud",
    subcategory: "Cloud",
    tags: ["Cloud", "Data Centres", "UK", "AI Infrastructure"],
    publishedAt: hoursAgo(20),
    readMinutes: 4,
    trending: true,
    verifiedSource: true,
  },
  {
    id: "n5",
    slug: "agentic-ai-enterprise-pilots-lessons",
    title: "Agentic AI enterprise pilots: what the early adopters learned",
    summary:
      "Companies running multi-step AI agents in production share a consistent set of lessons about scoping, observability and the cost of unattended failure.",
    content:
      "Enterprises piloting agentic systems, where an LLM plans and executes a sequence of tool calls, report that success depends less on model choice and more on operational discipline.\n\nCommon themes: keep the task boundary narrow, log every tool call and intermediate decision, budget for retries and human handoff, and treat the agent's permissions as a security surface. Teams that skipped observability found failures expensive to diagnose.\n\nThe most cited win is in structured back-office work such as reconciliation, data enrichment and triage, where inputs are messy but the definition of done is clear.",
    imageColor: "indigo",
    source: "MIT Technology Review",
    sourceUrl: "https://www.technologyreview.com/topic/artificial-intelligence/",
    category: "AI",
    subcategory: "AI Agents",
    tags: ["Agentic AI", "Enterprise", "AI Agents", "Observability"],
    publishedAt: hoursAgo(28),
    readMinutes: 7,
    trending: true,
    verifiedSource: true,
  },
  {
    id: "n6",
    slug: "data-engineering-shift-to-declarative-pipelines",
    title: "Data engineering shifts toward declarative, testable pipelines",
    summary:
      "The modern data stack is trending away from hand-written orchestration toward declarative transformations with built-in testing, lineage and contracts.",
    content:
      "Data teams are adopting a software-engineering mindset: transformations expressed declaratively, versioned in git, tested in CI, and shipped with data contracts that fail loudly when an upstream schema changes.\n\nThe payoff is fewer 3am pipeline breakages and faster onboarding. The cost is upfront investment in tooling and a cultural shift for analysts used to notebooks.\n\nLineage tooling has become table stakes, giving teams a map of which dashboards break if a source column is dropped.",
    imageColor: "emerald",
    source: "VentureBeat",
    sourceUrl: "https://venturebeat.com/category/data-infrastructure/",
    category: "Data",
    subcategory: "Data Engineering",
    tags: ["Data Engineering", "Analytics", "Data Contracts", "Testing"],
    publishedAt: hoursAgo(34),
    readMinutes: 5,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n7",
    slug: "computer-vision-on-device-efficiency-gains",
    title: "On-device computer vision gets a big efficiency boost",
    summary:
      "New architectures and quantisation techniques are pushing real-time vision models onto phones and edge devices without a cloud round-trip.",
    content:
      "Advances in efficient vision backbones and aggressive quantisation are making real-time detection and segmentation practical on commodity mobile hardware.\n\nThe implications span accessibility features, industrial inspection, and privacy-preserving applications where images never leave the device. Battery and thermal budgets remain the binding constraints.\n\nTooling for on-device deployment, including hardware-aware compilation, has matured to the point where the model is often no longer the hard part.",
    imageColor: "rose",
    source: "Wired",
    sourceUrl: "https://www.wired.com/tag/artificial-intelligence/",
    category: "AI",
    subcategory: "Computer Vision",
    tags: ["Computer Vision", "Edge AI", "Quantisation", "Mobile"],
    publishedAt: hoursAgo(40),
    readMinutes: 4,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n8",
    slug: "cybersecurity-ai-assisted-phishing-defence",
    title: "Security teams turn to AI to counter AI-assisted phishing",
    summary:
      "As generative tools lower the cost of convincing phishing, defenders are deploying models that score intent and context rather than matching known-bad patterns.",
    content:
      "Phishing campaigns crafted with generative assistance are harder to catch with signature-based filters. Security teams are responding with models that assess the intent and context of a message, cross-reference sender behaviour, and flag anomalies in tone or urgency.\n\nThe cat-and-mouse dynamic is intensifying. Analysts stress that fundamentals still matter most: phishing-resistant authentication, least privilege, and fast revocation.\n\nUser training is shifting from spot-the-typo to verify-through-a-second-channel for any request involving money or credentials.",
    imageColor: "slate",
    source: "Ars Technica",
    sourceUrl: "https://arstechnica.com/security/",
    category: "Cybersecurity",
    subcategory: "Threats",
    tags: ["Cybersecurity", "Phishing", "Generative AI", "Identity"],
    publishedAt: hoursAgo(46),
    readMinutes: 5,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n9",
    slug: "robotics-foundation-models-manipulation",
    title: "Robotics foundation models show progress on general manipulation",
    summary:
      "Large models trained on diverse robot demonstration data are beginning to generalise across tasks and embodiments, though reliability remains far from production.",
    content:
      "Research groups have published results from large models trained on pooled demonstration data spanning many robot platforms and tasks. The models show encouraging zero-shot transfer to unseen objects and instructions.\n\nCaveats are significant: success rates on novel tasks remain modest, data collection is expensive, and safe deployment in unstructured environments is unsolved.\n\nStill, the trajectory mirrors what happened in language and vision, and investment is following.",
    imageColor: "amber",
    source: "MIT Technology Review",
    sourceUrl: "https://www.technologyreview.com/topic/robotics/",
    category: "Robotics",
    subcategory: "Manipulation",
    tags: ["Robotics", "Foundation Models", "AI Research", "Manipulation"],
    publishedAt: hoursAgo(52),
    readMinutes: 6,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n10",
    slug: "uk-ai-startups-funding-round-up",
    title: "UK AI startups: a round-up of recent funding and traction",
    summary:
      "A snapshot of British AI companies raising capital across developer tooling, applied research, healthcare and climate, with a note on hiring demand.",
    content:
      "The UK's applied AI scene continues to attract investment, with recent activity concentrated in developer tooling, regulated-industry applications and climate tech.\n\nFounders cite access to research talent from UK universities and a growing pool of experienced operators. Common challenges are late-stage capital and competition for a small number of senior ML engineers.\n\nHiring demand remains strong for data engineers and ML platform roles even where headline AI-research hiring has cooled.",
    imageColor: "violet",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com/tag/startups/",
    category: "Startups",
    subcategory: "Funding",
    tags: ["Startups", "UK", "Venture Capital", "Hiring"],
    publishedAt: hoursAgo(60),
    readMinutes: 4,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n11",
    slug: "open-source-project-governance-ai-contributions",
    title: "Open-source maintainers debate policy for AI-generated contributions",
    summary:
      "Major projects are publishing guidance on disclosing AI assistance in pull requests, balancing contributor throughput against review burden and licensing clarity.",
    content:
      "Open-source projects are formalising expectations for contributions produced with AI assistance. Draft policies generally ask contributors to disclose significant AI involvement, take responsibility for the code, and confirm it does not reproduce license-incompatible material.\n\nMaintainers report a rise in low-quality, high-volume pull requests that consume review time. Some projects have introduced triage automation and stricter first-contribution rules in response.\n\nThe underlying tension, welcoming new contributors while protecting maintainer time, is not new but is now more acute.",
    imageColor: "lime",
    source: "Ars Technica",
    sourceUrl: "https://arstechnica.com/gadgets/",
    category: "Open Source",
    subcategory: "Governance",
    tags: ["Open Source", "Governance", "Community", "Licensing"],
    publishedAt: hoursAgo(72),
    readMinutes: 5,
    trending: false,
    verifiedSource: true,
  },
  {
    id: "n12",
    slug: "vector-databases-consolidation-postgres",
    title: "Vector search consolidates as Postgres extensions mature",
    summary:
      "Many teams that reached for a dedicated vector database early are consolidating back onto Postgres as its vector extensions gain performance and indexing options.",
    content:
      "The dedicated vector database category exploded alongside RAG. Now a counter-trend is visible: teams with moderate scale are folding vector search back into their primary Postgres instance to reduce operational overhead.\n\nImproved indexing, better recall-latency trade-offs and familiar operational tooling make this attractive for workloads below the tens-of-millions-of-vectors range. Dedicated systems still win at very large scale or with demanding filtering requirements.\n\nThe practical advice: start with what you already run, measure, and migrate only when you have evidence you need to.",
    imageColor: "blue",
    source: "VentureBeat",
    sourceUrl: "https://venturebeat.com/category/data-infrastructure/",
    category: "Data",
    subcategory: "Databases",
    tags: ["Databases", "Vector Search", "Postgres", "RAG"],
    publishedAt: hoursAgo(90),
    readMinutes: 5,
    trending: false,
    verifiedSource: true,
  },
];
