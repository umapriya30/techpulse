import { XMLParser } from "fast-xml-parser";

export interface FeedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: string; // ISO
  categories: string[];
  source: string;
  image?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function textOf(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>))
    return String((v as Record<string, unknown>)["#text"] ?? "");
  return String(v);
}

/** Fetch and parse an RSS 2.0 or Atom feed into normalised items. */
export async function fetchFeed(
  url: string,
  sourceName: string,
  revalidateSeconds = 1800,
): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`${sourceName} feed ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);

  // RSS 2.0
  if (doc?.rss?.channel) {
    const items = asArray(doc.rss.channel.item);
    return items.map((it: Record<string, unknown>) => ({
      title: stripHtml(textOf(it.title)),
      link: textOf(it.link).trim(),
      summary: stripHtml(textOf(it.description) || textOf(it["content:encoded"])).slice(0, 400),
      publishedAt: toIso(textOf(it.pubDate) || textOf(it["dc:date"])),
      categories: asArray(it.category).map((c) => stripHtml(textOf(c))).filter(Boolean).slice(0, 6),
      source: sourceName,
      image: imageOf(it),
    }));
  }

  // Atom
  if (doc?.feed) {
    const entries = asArray(doc.feed.entry);
    return entries.map((e: Record<string, unknown>) => {
      const links = asArray(e.link) as Record<string, unknown>[];
      const alt =
        links.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]) ?? links[0];
      return {
        title: stripHtml(textOf(e.title)),
        link: String(alt?.["@_href"] ?? textOf(e.id)).trim(),
        summary: stripHtml(textOf(e.summary) || textOf(e.content)).slice(0, 400),
        publishedAt: toIso(textOf(e.published) || textOf(e.updated)),
        categories: asArray(e.category)
          .map((c) => String((c as Record<string, unknown>)["@_term"] ?? ""))
          .filter(Boolean)
          .slice(0, 6),
        source: sourceName,
        image: imageOf(e),
      };
    });
  }

  return [];
}

function toIso(dateStr: string): string {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Pull a usable cover image URL out of a feed entry. */
function imageOf(it: Record<string, unknown>): string | undefined {
  const attr = (v: unknown, k: string): string | undefined => {
    const rec = Array.isArray(v) ? v[0] : v;
    const val = rec && typeof rec === "object" ? (rec as Record<string, unknown>)[k] : undefined;
    return typeof val === "string" && val ? val : undefined;
  };

  // media:content / media:thumbnail (Atom & RSS media namespace)
  const media =
    attr(it["media:content"], "@_url") ??
    attr(it["media:thumbnail"], "@_url") ??
    attr((it["media:group"] as Record<string, unknown>)?.["media:content"], "@_url");
  if (media) return media;

  // RSS <enclosure type="image/...">
  const enc = Array.isArray(it.enclosure) ? it.enclosure[0] : it.enclosure;
  if (enc && typeof enc === "object") {
    const e = enc as Record<string, unknown>;
    const type = String(e["@_type"] ?? "");
    const eurl = String(e["@_url"] ?? "");
    if (eurl && (type.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(eurl)))
      return eurl;
  }

  // first <img src> inside the HTML body
  const html =
    textOf(it["content:encoded"]) || textOf(it.content) || textOf(it.description) || textOf(it.summary);
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && /^https?:\/\//.test(m[1])) return m[1];

  return undefined;
}

export { stripHtml };
