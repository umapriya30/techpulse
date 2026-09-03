import { cn } from "@/lib/utils";

/** Animated pulse-wave mark + TECHPULSE wordmark. */
export function Logo({
  className,
  showWordmark = true,
  size = 32,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand via-brand-2 to-brand shadow-[0_4px_16px_-4px_var(--brand)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          width={size * 0.72}
          height={size * 0.72}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 17h6l3-9 5 15 4-11 2 5h8"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="wordmark text-sm leading-none">
          TECH<span className="accent">PULSE</span>
        </span>
      )}
    </span>
  );
}
