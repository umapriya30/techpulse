import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";
import { Cover } from "@/components/cover";
import { SaveButton, ShareButton } from "@/components/actions";

export function NewsCard({
  article,
  featured = false,
}: {
  article: NewsArticle;
  featured?: boolean;
}) {
  return (
    <article
      className={`group card-hover flex flex-col overflow-hidden rounded-2xl border border-border bg-surface ${
        featured ? "sm:flex-row" : ""
      }`}
    >
      <Link
        href={`/news/${article.slug}`}
        className={`relative block shrink-0 ${
          featured ? "sm:w-2/5" : ""
        }`}
        aria-label={article.title}
      >
        <Cover
          imageUrl={article.imageUrl}
          topic={`${article.category} ${article.subcategory} ${article.tags.join(" ")}`}
          seed={article.slug}
          gradientKey={article.imageColor}
          label={article.category}
          className={featured ? "h-48 w-full sm:h-full" : "h-40 w-full"}
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="brand" className="bg-black/40 text-white backdrop-blur">
            {article.category}
          </Badge>
          {article.trending && (
            <Badge className="bg-danger/90 text-white">🔥 Trending</Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="font-medium text-text">{article.source}</span>
          {article.verifiedSource && (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 fill-brand-2/20 text-brand-2"
              aria-label="Verified source"
            />
          )}
          <span aria-hidden>·</span>
          <span>{relativeTime(article.publishedAt)}</span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-bold leading-snug">
          <Link
            href={`/news/${article.slug}`}
            className="transition-colors hover:text-brand focus-ring rounded"
          >
            {article.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm text-text-muted">
          {article.summary}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((t) => (
            <Link
              key={t}
              href={`/news?topic=${encodeURIComponent(t)}`}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted hover:text-text"
            >
              {t}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/news/${article.slug}`}
              size="sm"
              variant="primary"
            >
              Read Article
            </ButtonLink>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="h-3 w-3" /> {article.readMinutes} min
            </span>
          </div>
          <div className="flex gap-1.5">
            <SaveButton type="news" slug={article.slug} title={article.title} />
            <ShareButton title={article.title} path={`/news/${article.slug}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
