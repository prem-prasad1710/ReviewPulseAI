import { BarChart3, Bell, CreditCard, RefreshCw, Shield, Users } from 'lucide-react'

const highlights = [
  {
    title: 'Daily sync',
    body: 'Reviews pulled on a schedule so your inbox stays current without manual exports.',
    icon: RefreshCw,
  },
  {
    title: 'AI drafts you approve',
    body: 'Tone-aware replies in Hindi & English—edit once, publish when you are ready.',
    icon: Shield,
  },
  {
    title: 'Multi-location',
    body: 'One command center for every outlet—compare sentiment and response health.',
    icon: BarChart3,
  },
  {
    title: 'Owner digest',
    body: 'Weekly email summaries for busy founders who want signal, not noise.',
    icon: Bell,
  },
  {
    title: 'Team-ready',
    body: 'Designed for operators and agency partners managing several brands.',
    icon: Users,
  },
  {
    title: 'Razorpay billing',
    body: 'Transparent INR pricing with plans that scale as you grow.',
    icon: CreditCard,
  },
]

export default function ProductHighlights() {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/55 dark:shadow-black/15 sm:p-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Platform</p>
        <h3 className="font-heading mt-1 text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-2xl">
          Built for serious review operations
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Everything here is wired for production workflows—so you can charge customers with confidence.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((h, i) => {
          const Icon = h.icon
          return (
            <div
              key={h.title}
              style={{ animationDelay: `${i * 60}ms` }}
              className="motion-safe:animate-fade-up group rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition motion-safe:duration-300 hover:-translate-y-0.5 hover:border-indigo-200/80 hover:bg-white hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800/40 dark:hover:border-indigo-500/35 dark:hover:bg-slate-800/80 dark:hover:shadow-black/20"
            >
              <div className="mb-3 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-600 motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-105 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{h.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{h.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
