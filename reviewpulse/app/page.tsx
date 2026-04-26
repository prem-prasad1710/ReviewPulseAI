import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  Check,
  Clock3,
  Globe2,
  MessageCircleReply,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import LandingFaq from '@/components/marketing/LandingFaq'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const logos = ['Saffron Dine', 'The Skin Route', 'TrimCraft Salon', 'Namma Biryani', 'ClinicNova']

const features = [
  {
    title: 'Unified Review Inbox',
    description: 'View every location and every review in one dashboard with filters for sentiment and urgency.',
    icon: Globe2,
  },
  {
    title: 'AI Replies in Hindi & English',
    description: 'Generate context-aware responses in Hindi, English, or Hinglish with tone controls.',
    icon: Bot,
  },
  {
    title: 'One-Click Publish',
    description: 'Review, edit, and publish to Google directly without switching tabs or tools.',
    icon: MessageCircleReply,
  },
  {
    title: 'Owner-Ready Analytics',
    description: 'Spot negative trends early and track how response time impacts your rating growth.',
    icon: TrendingUp,
  },
]

const plans = [
  {
    name: 'Starter',
    price: '₹999',
    subtitle: 'Perfect for one location',
    points: ['1 location', '100 AI replies/month', 'Google review sync', 'Email support'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '₹2,499',
    subtitle: 'For multi-outlet operators',
    points: ['3 locations', '500 AI replies/month', 'Priority sync', 'Weekly digest email'],
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '₹5,999',
    subtitle: 'For serious expansion',
    points: ['10 locations', 'Unlimited AI replies', 'White-label ready', 'Priority support'],
    highlighted: false,
  },
]

const testimonials = [
  {
    quote:
      'We cut review response time from two days to under one hour. Our 1-star escalations are now handled before they spread.',
    name: 'Rhea Malhotra',
    role: 'Founder, TrimCraft Salon',
  },
  {
    quote:
      'The Hindi replies feel natural and respectful. Patients now mention our responsiveness in new reviews.',
    name: 'Dr. Nitin Sharma',
    role: 'Owner, ClinicNova',
  },
]

export default function Home() {
  return (
    <div className="bg-mesh relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60 dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] dark:opacity-100" />

      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-5 md:px-8">
        <header className="animate-fade-in sticky top-4 z-50 mb-12 flex items-center justify-between rounded-2xl border border-white/50 bg-white/45 px-4 py-3 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.75)] ring-1 ring-slate-900/[0.04] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/40 dark:border-white/[0.12] dark:bg-slate-950/35 dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-white/[0.06] dark:supports-[backdrop-filter]:bg-slate-950/30 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-bold text-slate-900 transition hover:opacity-90 dark:text-white">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 p-2 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-heading tracking-tight drop-shadow-sm dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">ReviewPulse</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-indigo-700 dark:hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-indigo-700 dark:hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-indigo-700 dark:hover:text-white">
              FAQ
            </a>
            <a href="#customers" className="transition hover:text-indigo-700 dark:hover:text-white">
              Customers
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-300/80 bg-white/50 shadow-sm backdrop-blur-sm hover:bg-white/80 dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/10"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="rounded-xl shadow-md shadow-indigo-600/20">
                Start free
              </Button>
            </Link>
          </div>
        </header>

        <Reveal>
          <section className="mb-20 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Built for Indian SMB owners
              </p>
              <h1 className="font-heading mb-4 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-slate-50 md:text-6xl">
                Reply to every Google review in{' '}
                <span className="text-gradient-brand">minutes</span>, not days
              </h1>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
                ReviewPulse connects your locations, syncs reviews on a schedule, drafts bilingual AI replies you
                approve, and publishes to Google Business Profile in one streamlined flow.
              </p>

              <div className="mb-8 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg" className="gap-2 rounded-xl shadow-lg shadow-indigo-600/25">
                    Start 14-day trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="rounded-xl border-slate-200 bg-white/80 dark:border-slate-600 dark:bg-slate-800/60">
                    Open demo dashboard
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Secure OAuth + encrypted tokens
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  Go live in under 10 minutes
                </span>
              </div>
            </div>

            <div className="animate-float-soft relative rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-900/[0.04] dark:border-slate-700/90 dark:bg-slate-900/90 dark:shadow-black/40 dark:ring-white/[0.06] md:p-7">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Total reviews', value: '1,274', tone: 'text-slate-900 dark:text-slate-100' },
                  { label: 'Avg rating', value: '4.6', tone: 'text-slate-900 dark:text-slate-100' },
                  { label: 'Pending', value: '18', tone: 'text-rose-600 dark:text-rose-400' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3 transition hover:border-indigo-100 hover:shadow-sm dark:border-slate-600/80 dark:from-slate-800/90 dark:to-slate-900/90 dark:hover:border-indigo-500/35"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</p>
                    <p className={`mt-1 text-xl font-bold tabular-nums ${m.tone}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-600/70 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Latest review</p>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  Amazing food and super quick service. Paneer tikka was outstanding.
                </p>
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/80 p-3 text-sm leading-relaxed text-indigo-950 dark:border-indigo-500/30 dark:from-indigo-950/70 dark:to-blue-950/50 dark:text-indigo-100">
                  Thank you for your kind words—we are thrilled you enjoyed our paneer tikka and service. We look
                  forward to welcoming you again soon.
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section id="customers" className="mb-20">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Trusted by growing brands
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {logos.map((logo, i) => (
                <div
                  key={logo}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="motion-safe:animate-fade-up rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3.5 text-center text-sm font-semibold text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-slate-900 hover:shadow-md dark:border-slate-700/90 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-slate-50 dark:hover:shadow-black/30"
                >
                  {logo}
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section id="features" className="mb-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Features</p>
              <h2 className="font-heading mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
                Everything you need to scale review operations
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Purpose-built workflows for owners, ops leads, and agencies who cannot afford a missed review.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="motion-safe:animate-fade-up group rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-xl hover:shadow-indigo-900/5 dark:border-slate-700/90 dark:bg-slate-900/80 dark:hover:border-indigo-500/40 dark:hover:shadow-black/25"
                  >
                    <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:scale-105 group-hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-500/30 dark:group-hover:bg-indigo-900/50">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="mb-20 rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm dark:border-slate-700/90 dark:bg-slate-900/80 md:p-10">
            <h3 className="mb-2 text-center font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">How it works</h3>
            <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-600 dark:text-slate-400">
              Three steps from signup to published replies—no spreadsheets, no tab overload.
            </p>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { step: '01', text: 'Connect Google Business Profile with secure OAuth.' },
                { step: '02', text: 'Sync every location and review on a schedule you control.' },
                { step: '03', text: 'Generate, edit, and publish AI replies with one click.' },
              ].map((item, i) => (
                <div
                  key={item.step}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="motion-safe:animate-fade-up relative rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-5 transition hover:border-indigo-100 hover:shadow-md dark:border-slate-600/70 dark:from-slate-800/80 dark:to-slate-900/90 dark:hover:border-indigo-500/35"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Step {item.step}</p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section id="pricing" className="mb-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Pricing</p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Simple INR plans</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">Transparent limits. Upgrade when you add locations or volume.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`motion-safe:animate-fade-up flex flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/90 to-white shadow-xl shadow-indigo-900/10 ring-1 ring-indigo-500/20 dark:border-indigo-400 dark:from-indigo-950/70 dark:to-slate-900/90 dark:shadow-indigo-950/30 dark:ring-indigo-400/25'
                      : 'border-slate-200/90 bg-white/95 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700/90 dark:bg-slate-900/80 dark:hover:border-indigo-500/40 dark:hover:shadow-black/25'
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="mb-3 w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Most popular
                    </span>
                  ) : (
                    <span className="mb-3 h-7" aria-hidden />
                  )}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.subtitle}</p>
                  <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {plan.price}
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/mo</span>
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <Link href="/login" className="mt-6 block">
                    <Button variant={plan.highlighted ? 'default' : 'outline'} className="w-full rounded-xl">
                      Choose {plan.name}
                    </Button>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="mb-20 grid gap-5 md:grid-cols-2">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md dark:border-slate-700/90 dark:bg-slate-900/80 dark:hover:border-indigo-500/35 dark:hover:shadow-black/25"
              >
                <div className="mb-3 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">“{item.quote}”</p>
                <footer className="border-t border-slate-100 pt-4 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section id="faq" className="mb-20 rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/85 md:p-10">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">FAQ</p>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">Answers before you onboard</h2>
            </div>
            <LandingFaq />
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-emerald-50/80 p-10 text-center shadow-lg shadow-indigo-900/5 dark:border-indigo-500/25 dark:from-indigo-950/50 dark:via-slate-900 dark:to-emerald-950/30 dark:shadow-black/30 md:p-12">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-800 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-indigo-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              No card required to start
            </p>
            <h3 className="font-heading mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Turn every review into repeat business
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
              Launch ReviewPulse and give every customer a fast, thoughtful response that protects your reputation and
              compounds trust over time.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2 rounded-xl shadow-lg shadow-indigo-600/25">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="rounded-xl border-slate-200 bg-white/90 dark:border-slate-600 dark:bg-slate-800/80">
                  Explore product
                </Button>
              </Link>
            </div>
          </section>
        </Reveal>

        <footer className="mt-16 border-t border-slate-200/80 pt-10 text-sm text-slate-600 dark:border-slate-700/80 dark:text-slate-400">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ReviewPulse AI
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium md:justify-end">
              <Link href="/login" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                Sign in
              </Link>
              <a href="#pricing" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                Pricing
              </a>
              <a href="#faq" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                FAQ
              </a>
              <Link href="/dashboard" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                Dashboard
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">© {new Date().getFullYear()} ReviewPulse · Built for Indian SMBs</p>
        </footer>
      </main>
    </div>
  )
}
