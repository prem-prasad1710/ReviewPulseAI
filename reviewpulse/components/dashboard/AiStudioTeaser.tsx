import { Languages, Mic2, SlidersHorizontal, Sparkles, Wand2 } from 'lucide-react'

const bullets = [
  { icon: Languages, title: 'Hindi · English · Hinglish', body: 'Match how your customer wrote—Roman or Devanagari, formal or casual.' },
  { icon: SlidersHorizontal, title: 'Tone & length controls', body: 'Professional, warm, formal, grateful, or concise—tuned for clinics, F&B, and retail.' },
  { icon: Wand2, title: 'One-click regenerate', body: 'Iterate drafts without losing context from the original review.' },
  { icon: Mic2, title: 'Brand voice memory', body: 'Coming soon: save snippets and banned phrases per location.' },
]

export default function AiStudioTeaser() {
  return (
    <section className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 p-6 shadow-sm dark:border-indigo-500/25 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-950/60 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI Reply Studio
        </span>
      </div>
      <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
        Replies that sound like your best store manager
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Every draft is grounded in star rating, review text, and business category before you publish to Google—so you
        scale empathy without scaling headcount.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {bullets.map((b) => {
          const Icon = b.icon
          return (
            <li
              key={b.title}
              className="flex gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{b.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
