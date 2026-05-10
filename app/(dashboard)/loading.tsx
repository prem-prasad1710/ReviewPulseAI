export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-8 w-48 max-w-full rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
      <div className="h-4 w-full max-w-md rounded bg-slate-100 dark:bg-slate-800" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="hidden h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 lg:block" />
      </div>
      <div className="h-64 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80" />
    </div>
  )
}
