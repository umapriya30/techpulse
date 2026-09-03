import { fetchFeed, type FeedItem } from "@/lib/sources/rss";
import { runNewsIngestion, type RawArticle } from "@/lib/ai/ingest";
import type { NewsArticle } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Live news ingestion. Pulls public RSS/Atom feeds + Google News topic searches,
 * runs them through the AI pipeline (dedupe / classify / summarise / topics /
 * trending) and returns ready-to-render NewsArticle records.
 *
 * All sources are public syndication feeds. Every article links to its original.
 */

const GOOGLE_NEWS = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(
    q + " when:3d",
  )}&hl=en-GB&gl=GB&ceid=GB:en`;

interface FeedConfig {
  url: string;
  source: string;
  color: string;
  limit: number;
}

const FEEDS: FeedConfig[] = [
  // ── General tech press ──────────────────────────────────────────────
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", color: "violet", limit: 7 },
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", source: "Ars Technica", color: "slate", limit: 5 },
  { url: "https://feeds.arstechnica.com/arstechnica/gadgets", source: "Ars Technica", color: "slate", limit: 2 },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", source: "WIRED", color: "rose", limit: 5 },
  { url: "https://www.wired.com/feed/category/business/latest/rss", source: "WIRED", color: "rose", limit: 2 },
  { url: "https://www.technologyreview.com/feed/", source: "MIT Technology Review", color: "indigo", limit: 5 },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat", color: "violet", limit: 5 },
  { url: "https://www.techradar.com/feeds/articletype/news", source: "TechRadar", color: "blue", limit: 4 },
  { url: "https://www.engadget.com/rss.xml", source: "Engadget", color: "slate", limit: 3 },
  { url: "https://feed.infoq.com/", source: "InfoQ", color: "emerald", limit: 4 },
  // ── Official company / lab blogs ────────────────────────────────────
  { url: "https://openai.com/news/rss.xml", source: "OpenAI", color: "emerald", limit: 4 },
  { url: "https://deepmind.google/blog/rss.xml", source: "Google DeepMind", color: "blue", limit: 3 },
  { url: "https://huggingface.co/blog/feed.xml", source: "Hugging Face", color: "amber", limit: 4 },
  { url: "https://aws.amazon.com/blogs/aws/feed/", source: "AWS", color: "slate", limit: 2 },
  { url: "https://aws.amazon.com/blogs/machine-learning/feed/", source: "AWS ML", color: "slate", limit: 3 },
  { url: "https://blogs.nvidia.com/feed/", source: "NVIDIA", color: "lime", limit: 3 },
  { url: "https://github.blog/feed/", source: "GitHub", color: "lime", limit: 2 },
  { url: "https://cloudblog.withgoogle.com/rss/", source: "Google Cloud", color: "blue", limit: 3 },
  { url: "https://research.google/blog/rss/", source: "Google Research", color: "indigo", limit: 3 },
  { url: "https://bair.berkeley.edu/blog/feed.xml", source: "Berkeley AI Research", color: "amber", limit: 2 },
  { url: "https://jack-clark.net/feed/", source: "Import AI", color: "violet", limit: 2 },
  // ── Data science community ─────────────────────────────────────────
  { url: "https://www.kdnuggets.com/feed", source: "KDnuggets", color: "emerald", limit: 4 },
  { url: "https://www.analyticsvidhya.com/feed/", source: "Analytics Vidhya", color: "emerald", limit: 3 },
  { url: "https://dev.to/feed/tag/ai", source: "DEV Community", color: "lime", limit: 3 },
  // ── Research papers (arXiv) ────────────────────────────────────────
  { url: "https://export.arxiv.org/rss/cs.AI", source: "arXiv", color: "indigo", limit: 4 },
  { url: "https://export.arxiv.org/rss/cs.LG", source: "arXiv", color: "indigo", limit: 3 },
  { url: "https://export.arxiv.org/rss/cs.CL", source: "arXiv", color: "indigo", limit: 3 },
  // ── Google News topic searches (broad coverage) ───────────────────
  { url: GOOGLE_NEWS("artificial intelligence"), source: "Google News", color: "blue", limit: 6 },
  { url: GOOGLE_NEWS("large language model OR LLM OR OpenAI OR Anthropic OR Gemini"), source: "Google News", color: "indigo", limit: 5 },
  { url: GOOGLE_NEWS("agentic AI OR AI agents"), source: "Google News", color: "violet", limit: 3 },
  { url: GOOGLE_NEWS("data engineering OR data science OR analytics"), source: "Google News", color: "emerald", limit: 4 },
  { url: GOOGLE_NEWS("cybersecurity breach OR vulnerability"), source: "Google News", color: "slate", limit: 3 },
  { url: GOOGLE_NEWS("cloud computing AWS OR Azure OR Kubernetes"), source: "Google News", color: "blue", limit: 3 },
  { url: GOOGLE_NEWS("AI startup funding round UK"), source: "Google News", color: "violet", limit: 3 },
  { url: GOOGLE_NEWS("open source software AI"), source: "Google News", color: "lime", limit: 3 },
  { url: GOOGLE_NEWS("robotics OR humanoid robot"), source: "Google News", color: "amber", limit: 2 },
];

/** "Headline - Publisher" (Google News format) -> { title, publisher } */
function splitGoogleTitle(title: string): { title: string; publisher: string | null } {
  const m = title.match(/^(.*?)\s+-\s+([^-]+)$/);
  if (m && m[2].length < 40) return { title: m[1].trim(), publisher: m[2].trim() };
  return { title, publisher: null };
}

export async function fetchLiveNews(): Promise<NewsArticle[]> {
  const settled = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.source).then((items) => ({ f, items }))),
  );

  const raw: RawArticle[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    const { f, items } = s.value;
    for (const it of items.slice(0, f.limit)) {
      const split = splitGoogleTitle(it.title);
      let title = split.title;
      const publisher = split.publisher;
      if (f.source === "arXiv") {
        title = it.title.replace(/\s*\(arXiv:.*$/i, "").replace(/\.$/, "").trim();
      }
      if (!title || !it.link) continue;
      raw.push({
        title,
        description: it.summary || title,
        url: it.link,
        source: publisher ?? f.source,
        imageColor: f.color,
        imageUrl: it.image,
        publishedAt: it.publishedAt,
      });
    }
  }

  if (raw.length === 0) throw new Error("no live news items");

  // newest first, then run the pipeline (handles dedupe by title fingerprint)
  raw.sort((a, b) => +new Date(b.publishedAt!) - +new Date(a.publishedAt!));
  const report = await runNewsIngestion(raw);

  // Keep a stable-ish trending flag: mark the freshest ~6 high-signal items.
  const articles = report.stored;
  const trendingCount = articles.filter((a) => a.trending).length;
  if (trendingCount < 4) {
    for (const a of articles.slice(0, 6 - trendingCount)) a.trending = true;
  }
  return articles.slice(0, 120);
}

/** Dedupe helper reused by the provider for slug lookups. */
export function newsSlug(title: string) {
  return slugify(title).slice(0, 80);
}

export type { FeedItem };
