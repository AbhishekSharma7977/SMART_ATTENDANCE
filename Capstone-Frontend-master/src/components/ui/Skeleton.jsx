// ─── Skeleton Loader ─────────────────────────────────────────────────────────
// Reusable loading placeholder for enterprise-grade perceived performance.
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-200', className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 p-6">
      {[true, false, true, false].map((isUser, i) => (
        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-12 rounded-2xl ${isUser ? 'w-48' : 'w-64'}`} />
        </div>
      ))}
    </div>
  );
}
