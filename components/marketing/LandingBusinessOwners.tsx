import Link from 'next/link'
import { BarChart3, MessageCircle, Shield, Smartphone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const pillars = [
  {
    icon: BarChart3,
    title: 'One dashboard for every outlet',
    body: 'Restaurants, clinics, salons — see pending reviews, ratings, and outlet health without opening Google Maps ten times.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp when it matters',
    body: 'Get pinged on your phone for ≤2★ reviews and crisis keywords. Reply by voice note in Hindi or English.',
  },
  {
    icon: Sparkles,
    title: 'AI replies you approve first',
    body: 'Draft professional Hinglish responses in seconds. Nothing posts to Google until you say so.',
  },
  {
    icon: Shield,
    title: 'Weekly email pulse',
    body: 'Every Monday, a summary lands in your inbox — new reviews, rating trend, and top unanswered items.',
  },
  {
    icon: Smartphone,
    title: 'Public reputation score',
    body: 'Share a live score page and embed badge on your website. Turn happy customers into social proof.',
  },
]

export default function LandingBusinessOwners() {
  return (
    <section id="for-business" className="mb-20 rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/85 md:p-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          For business owners
        </p>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
          Can you use this to track everything? Yes.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
          ReviewPulse is your reputation control room: Google reviews, AI replies, WhatsApp alerts, analytics, and
          competitor insights in one INR-priced portal. Connect Google Business once — we sync, alert, and help you
          respond before bad feedback costs you customers.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => {
          const Icon = p.icon
          return (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-950/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.body}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/login">
          <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-600/20">
            Start 14-day Growth trial
          </Button>
        </Link>
        <Link href="/tools/free-reply">
          <Button size="lg" variant="outline" className="rounded-xl">
            Try free AI reply first
          </Button>
        </Link>
      </div>
    </section>
  )
}
