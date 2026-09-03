"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";

export interface FilterOption {
  value: string;
  label: string;
}
export interface FilterGroup {
  key: string;
  label: string;
  type: "single" | "multi";
  options: FilterOption[];
}

export function Filters({
  groups,
  resultCount,
}: {
  groups: FilterGroup[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const current = (key: string): string[] => {
    const v = params.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  };

  const activeCount = groups.reduce((n, g) => n + current(g.key).length, 0);

  function update(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(group: FilterGroup, value: string) {
    const next = new URLSearchParams(params.toString());
    if (group.type === "single") {
      if (current(group.key)[0] === value) next.delete(group.key);
      else next.set(group.key, value);
    } else {
      const set = new Set(current(group.key));
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size) next.set(group.key, [...set].join(","));
      else next.delete(group.key);
    }
    update(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    for (const g of groups) next.delete(g.key);
    update(next);
  }

  const panel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className="font-semibold text-text">{resultCount}</span> result
          {resultCount === 1 ? "" : "s"}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-brand hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {groups.map((group) => {
        const selected = current(group.key);
        return (
          <fieldset key={group.key}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {group.label}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {group.options.map((opt) => {
                const on = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(group, opt.value)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-text-muted hover:text-text",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className={buttonClass({ variant: "outline", className: "w-full" })}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5">
          {panel}
        </div>
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenMobile(false)}
          />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                aria-label="Close filters"
                className="rounded-lg p-1.5 hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className={buttonClass({ className: "mt-6 w-full" })}
            >
              Show {resultCount} result{resultCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
