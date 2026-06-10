export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** A card-shaped placeholder used while content loads. */
export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
