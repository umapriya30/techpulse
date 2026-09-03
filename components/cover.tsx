"use client";

import { useMemo, useState } from "react";
import { cn, gradientFor } from "@/lib/utils";
import { topicImage } from "@/lib/topic-images";

/**
 * Cover art for cards & detail pages.
 *   1. real image from the source (imageUrl)
 *   2. a relevant topic photo (from `topic`)
 *   3. a deterministic gradient with a label/icon
 * Each step is used only if the previous one fails to load.
 */
export function Cover({
  imageUrl,
  topic,
  seed,
  gradientKey,
  label,
  icon,
  className,
  priority = false,
  fit = "cover",
}: {
  imageUrl?: string;
  topic?: string;
  seed?: string;
  gradientKey: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  priority?: boolean;
  /** "cover" fills the frame (cards). "contain" shows the whole image on a blurred backdrop (detail heroes). */
  fit?: "cover" | "contain";
}) {
  const fallbackPhoto = useMemo(
    () => (topic ? topicImage(topic, seed) : undefined),
    [topic, seed],
  );
  // stage 0 = source image, 1 = topic photo, 2 = gradient
  const [stage, setStage] = useState(imageUrl ? 0 : fallbackPhoto ? 1 : 2);
  const src = stage === 0 ? imageUrl : stage === 1 ? fallbackPhoto : undefined;
  const gradient = gradientFor(gradientKey);

  const advance = () => setStage((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : 2));

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      {src ? (
        <>
          {fit === "contain" && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={advance}
            className={cn(
              "relative h-full w-full",
              fit === "cover" ? "object-cover" : "object-contain",
            )}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_60%,white_0,transparent_40%)]" />
          <span className="relative z-10 px-4 text-center text-sm font-bold uppercase tracking-widest text-white/90 drop-shadow">
            {icon ?? label}
          </span>
        </>
      )}
    </div>
  );
}
