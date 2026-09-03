import { BadgeCheck, Globe2, Info, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn, deadlineState } from "@/lib/utils";
import type { LocationMode } from "@/lib/types";

export function DeadlineBadge({
  deadline,
  className,
}: {
  deadline: string;
  className?: string;
}) {
  const s = deadlineState(deadline);
  const tone =
    s.tone === "red"
      ? "red"
      : s.tone === "amber"
        ? "amber"
        : s.tone === "green"
          ? "green"
          : "neutral";
  const dot =
    s.tone === "red"
      ? "🔴"
      : s.tone === "amber"
        ? "🟡"
        : s.tone === "green"
          ? "🟢"
          : "⚪";
  return (
    <Badge tone={tone} className={className}>
      <span aria-hidden>{dot}</span>
      {s.label}
    </Badge>
  );
}

export function LocationBadge({
  mode,
  city,
  country,
  className,
}: {
  mode: LocationMode | "Online" | "In-Person" | "Hybrid" | "UK";
  city?: string | null;
  country?: string | null;
  className?: string;
}) {
  if (mode === "Online") {
    return (
      <Badge tone="blue" className={className}>
        <Globe2 className="h-3 w-3" /> Online
      </Badge>
    );
  }
  if (mode === "Hybrid") {
    return (
      <Badge tone="brand" className={className}>
        <Globe2 className="h-3 w-3" /> Hybrid{city ? ` · ${city}` : ""}
      </Badge>
    );
  }
  const place =
    mode === "UK In-Person" || mode === "UK"
      ? city
        ? `${city}, UK`
        : "UK"
      : city && country && !/^online$/i.test(country)
        ? `${city}, ${country}`
        : city || country || "In person";
  return (
    <Badge tone="green" className={className}>
      <MapPin className="h-3 w-3" /> {place}
    </Badge>
  );
}

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <Badge tone="brand" className={className}>
      {category}
    </Badge>
  );
}

/** Small blue tick shown when the listing links straight to the official
 *  source (Devpost, an event's own website, a platform page). */
export function VerifiedBadge({
  className,
  label = "Verified",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-brand-2",
        className,
      )}
      title="Links directly to the official source"
    >
      <BadgeCheck className="h-3.5 w-3.5 fill-brand-2/20" />
      {label}
    </span>
  );
}

/** Shown for aggregator-sourced listings whose link is not the organiser's. */
export function UnverifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-text-muted",
        className,
      )}
      title="Listed via an aggregator — confirm details on the organiser's page"
    >
      <Info className="h-3.5 w-3.5" />
      Unverified listing
    </span>
  );
}
