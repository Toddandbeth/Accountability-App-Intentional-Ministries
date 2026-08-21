export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-neutral-200" />
        <div className="h-6 w-40 rounded bg-neutral-200" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}
