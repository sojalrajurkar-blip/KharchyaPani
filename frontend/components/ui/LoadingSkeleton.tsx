'use client';

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse flex flex-col gap-3">
      <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
      <div className="h-8 bg-slate-700/50 rounded w-2/3"></div>
      <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-6 animate-pulse flex flex-col gap-4">
      <div className="h-6 bg-slate-700/50 rounded w-1/4 mb-2"></div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-slate-800">
          <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/6"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/8"></div>
        </div>
      ))}
    </div>
  );
}
