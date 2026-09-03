export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="h-36 skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded skeleton" />
        <div className="h-5 w-4/5 rounded skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-2/3 rounded skeleton" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-24 rounded-lg skeleton" />
          <div className="h-8 w-20 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
        >
          <div className="h-12 w-12 shrink-0 rounded-lg skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded skeleton" />
            <div className="h-3 w-1/3 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
