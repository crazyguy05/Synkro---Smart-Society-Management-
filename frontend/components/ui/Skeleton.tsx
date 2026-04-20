export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shine ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
