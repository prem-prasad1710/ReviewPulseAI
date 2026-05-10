import { Sparkles } from 'lucide-react'

export default function DevSampleNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 dark:border-violet-500/30 dark:from-violet-950/50 dark:to-indigo-950/40">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
      <div>
        <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Sample data · development only</p>
        <p className="mt-0.5 text-xs leading-relaxed text-violet-800/90 dark:text-violet-200/80">
          Charts and tables show realistic demo metrics. Set <code className="rounded bg-white/60 px-1 dark:bg-slate-800">DEV_MOCK_DASHBOARD=false</code> in{' '}
          <code className="rounded bg-white/60 px-1 dark:bg-slate-800">.env</code> to use your live database only.
        </p>
      </div>
    </div>
  )
}
