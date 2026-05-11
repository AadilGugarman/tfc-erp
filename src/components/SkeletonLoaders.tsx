import { cn } from '@/utils/cn';

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-2/3" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="rounded-xl bg-slate-200 dark:bg-slate-800 p-8 h-32 animate-pulse" />
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg bg-slate-200 dark:bg-slate-800 h-32 animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3" />
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <SkeletonHero />
      <SkeletonGrid count={8} />
      <SkeletonTable />
    </div>
  );
}
