"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, run: boolean, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

export function StatBand({
  stats,
}: {
  stats: { label: string; value: number; suffix?: string; icon: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s) => (
        <Stat key={s.label} {...s} run={visible} />
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
  run,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  run: boolean;
}) {
  const n = useCountUp(value, run);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <div className="text-xl">{icon}</div>
      <div className="mt-1 text-2xl font-black tracking-tight tabular-nums sm:text-3xl">
        {n.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-0.5 text-xs text-text-muted">{label}</div>
    </div>
  );
}
