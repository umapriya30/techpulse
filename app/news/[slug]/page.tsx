import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { provider } from "@/lib/provider";
import { queryNews } from "@/lib/queries";
import { formatDate, relativeTime } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import { VerifiedBadge } from "@/components/badges";
import { SaveButton, ShareButton } from "@/components/actions";
import { NewsCard } from "@/components/news-card";
import { ReadingProgress } from "@/components/reading-progress";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  return [] as { slug: string }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await provider.getNews(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await provider.getNews(slug);
  if (!article) notFound();

  const related = (
    await queryNews({ category: article.category })
  )
    .filter((n) => n.id !== article.id)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    articleSection: article.category,
    keywords: article.tags.join(", "),
    publisher: { "@type": "Organization", name: article.source },
    url: article.sourceUrl,
  };

  return (
    <article className="container-page py-10">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tech News
      </Link>

      <div className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{article.category}</Badge>
          <Badge tone="neutral">{article.subcategory}</Badge>
          {article.trending && <Badge tone="red">🔥 Trending</Badge>}
        </div>

        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
          <span className="font-medium text-text">{article.source}</span>
          <span aria-hidden>·</span>
          <span>
            {formatDate(article.publishedAt)} ({relativeTime(article.publishedAt)})
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {article.readMinutes} min read
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {article.verifiedSource && <VerifiedBadge />}
          <SaveButton
            type="news"
            slug={article.slug}
            title={article.title}
            variant="full"
          />
          <ShareButton
            title={article.title}
            path={`/news/${article.slug}`}
            variant="full"
          />
        </div>

        <Cover
          imageUrl={article.imageUrl}
          topic={`${article.category} ${article.subcategory} ${article.tags.join(" ")}`}
          seed={article.slug}
          gradientKey={article.imageColor}
          label={article.category}
          priority
          fit="contain"
          className="mt-6 aspect-[16/9] w-full rounded-2xl"
        />

        <div className="mt-8 space-y-4 text-[15px] leading-relaxed">
          <p className="text-lg font-medium text-text">{article.summary}</p>
          {article.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-text-muted">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <Link
              key={t}
              href={`/news?topic=${encodeURIComponent(t)}`}
              className="rounded-full bg-surface-2 px-3 py-1 text-xs text-text-muted hover:text-text"
            >
              #{t}
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">
            This is an editorial summary for TechPulse. Read the full reporting at
            the original source.
          </p>
          <ButtonLink
            href={article.sourceUrl}
            external
            className="mt-3"
          >
            Read the full article on {article.source}
            <ExternalLink className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="mb-5 text-xl font-bold">More in {article.category}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
