import { Globe2, Layers, ShieldCheck } from 'lucide-react'

const edges = [
  {
    title: 'India-first language layer',
    body: 'Hindi, English, and natural Hinglish — tuned for how your customers actually write, not generic US English templates.',
    Icon: Globe2,
  },
  {
    title: 'Approve before anything goes live',
    body: 'Draft → edit → publish to Google with one controlled flow. We never silently post on your behalf.',
    Icon: ShieldCheck,
  },
  {
    title: 'One hub vs. five browser tabs',
    body: 'Reviews, sentiment, AI drafts, and billing live together so owners and agencies stop context-switching.',
    Icon: Layers,
  },
] as const

export default function LandingEdgeCards() {
  return (
    <section className="mb-20" aria-labelledby="edge-heading">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Why teams switch</p>
        <h2 id="edge-heading" className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
          Built different from generic review tools
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {edges.map(({ title, body, Icon }) => (
          <article
            key={title}
            className="group rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700/90 dark:bg-slate-900/75 dark:hover:border-indigo-500/40"
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 transition group-hover:scale-105 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-500/30">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
