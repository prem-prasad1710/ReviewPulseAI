export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-4" aria-busy aria-label="Loading workspace">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200/90 dark:bg-slate-700/80" />
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-200/60 bg-slate-100/80 dark:border-slate-700/50 dark:bg-slate-800/40"
          />
        ))}
      </div>
    </div>
  )
}
