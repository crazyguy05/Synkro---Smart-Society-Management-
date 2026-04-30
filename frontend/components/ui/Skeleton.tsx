export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-slate-200/60 via-slate-100 to-slate-200/60 dark:from-white/5 dark:via-white/10 dark:to-white/5 bg-[length:200%_100%] animate-shine ${className}`}
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
