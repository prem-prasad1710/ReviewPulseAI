import Link from 'next/link'
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
import { AppMark } from '@/components/brand/AppMark'
import LandingEdgeCards from '@/components/marketing/LandingEdgeCards'
import LandingElectricFlow from '@/components/marketing/LandingElectricFlow'
import LandingFaq from '@/components/marketing/LandingFaq'
import LandingFeaturesExplorer, { type LandingFeatureItem } from '@/components/marketing/LandingFeaturesExplorer'
import LandingFinalCta from '@/components/marketing/LandingFinalCta'
import LandingHero3D from '@/components/marketing/LandingHero3D'
import LandingHowItWorks from '@/components/marketing/LandingHowItWorks'
import LandingLogoMarquee from '@/components/marketing/LandingLogoMarquee'
import LandingNav from '@/components/marketing/LandingNav'
import LandingPricingShowcase from '@/components/marketing/LandingPricingShowcase'
import LandingStatChips from '@/components/marketing/LandingStatChips'
import LandingTestimonialsSlider from '@/components/marketing/LandingTestimonialsSlider'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'

const logos = ['Saffron Dine', 'The Skin Route', 'TrimCraft Salon', 'Namma Biryani', 'ClinicNova']

const features: LandingFeatureItem[] = [
  {
    title: 'Unified Review Inbox',
    description: 'View every location and every review in one dashboard with filters for sentiment and urgency.',
    icon: 'Globe2',
  },
  {
    title: 'AI Replies in Hindi & English',
    description: 'Generate context-aware responses in Hindi, English, or Hinglish with tone controls.',
    icon: 'Bot',
  },
  {
    title: 'One-Click Publish',
    description: 'Review, edit, and publish to Google directly without switching tabs or tools.',
    icon: 'MessageCircleReply',
  },
  {
    title: 'Owner-Ready Analytics',
    description: 'Spot negative trends early and track how response time impacts your rating growth.',
    icon: 'TrendingUp',
  },
]

const plans = [
  {
    planKey: 'starter' as const,
    name: 'Starter',
    price: '₹999',
    subtitle: 'Perfect for one location',
    points: ['1 location', '100 AI replies/month', 'Google review sync', 'Email support'],
    highlighted: false,
  },
  {
    planKey: 'growth' as const,
    name: 'Growth',
    price: '₹2,499',
    subtitle: 'For multi-outlet operators',
    points: ['3 locations', '500 AI replies/month', 'Priority sync', 'Weekly digest email'],
    highlighted: true,
  },
  {
    planKey: 'scale' as const,
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
    <div className="bg-mesh relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60 dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] dark:opacity-100" />

      <main className="relative mx-auto max-w-7xl px-5 pb-28 pt-5 md:px-8">
        <LandingNav />

        {/* Hero */}
        <Reveal>
          <section className="mb-16 grid items-center gap-12 lg:mb-20 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Built for Indian SMB owners
              </p>
              <LandingStatChips />
              <h1 className="font-heading mb-4 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
                Turn ignored reviews into <span className="text-gradient-brand">growth</span>, not churn
              </h1>
              <p className="mb-3 max-w-xl text-base font-medium text-slate-800 dark:text-slate-200 md:text-lg">
                “You have 217 unanswered reviews.” Restaurants lose bookings when bad feedback sits silent.
              </p>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
                ReviewPulse is the India-first reputation layer: connect Google Business in about a minute, see sentiment
                and themes instantly, and ship professional replies — including a free public generator for tough reviews.
              </p>

              <div className="mb-8 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg" className="gap-2 rounded-xl shadow-lg shadow-indigo-600/25">
                    Start 14-day trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/tools/free-reply">
                  <Button size="lg" variant="outline" className="rounded-xl border-slate-200 bg-white/80 dark:border-slate-600 dark:bg-slate-800/60">
                    Free AI reply — no login
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

            <div className="lg:pl-2">
              <LandingHero3D />
            </div>
          </section>
        </Reveal>

        {/* Electric flow — product story */}
        <Reveal delay={30}>
          <LandingElectricFlow />
        </Reveal>

        <Reveal delay={40}>
          <LandingEdgeCards />
        </Reveal>

        <Reveal delay={40}>
          <section id="customers" className="mb-20">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Trusted by growing brands
            </p>
            <LandingLogoMarquee logos={logos} />
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section id="features" className="mb-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Features</p>
              <h2 className="font-heading mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
                Explore the stack — scroll, tap, and dive in
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Interactive 3D cards on desktop; swipe horizontally on your phone. Same workflows your team uses after signup.
              </p>
            </div>
            <LandingFeaturesExplorer items={features} />
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="mb-20">
            <LandingHowItWorks />
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section id="pricing" className="mb-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Pricing</p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Simple INR plans</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">Transparent limits. Upgrade when you add locations or volume.</p>
            </div>
            <LandingPricingShowcase plans={plans} />
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="mb-20">
            <div className="relative mb-8 text-center md:text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Stories</p>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">Teams that reply faster</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400 md:mx-0">
                Swipe on mobile or use arrows on desktop — same quotes, easier to browse.
              </p>
            </div>
            <LandingTestimonialsSlider items={testimonials} />
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
          <LandingFinalCta />
        </Reveal>

        <footer className="mt-20 border-t border-slate-200/80 pt-12 text-sm text-slate-600 dark:border-slate-700/80 dark:text-slate-400">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <Link href="/" className="flex items-center gap-3 font-bold text-slate-900 transition hover:opacity-90 dark:text-slate-100">
              <AppMark size={40} className="rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-600" />
              <span>
                <span className="font-heading block text-base tracking-tight">ReviewPulse AI</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reputation for Indian SMBs</span>
              </span>
            </Link>
            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium md:justify-end">
              <Link href="/login" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                Sign in
              </Link>
              <a href="#electric-flow" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">
                Product map
              </a>
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
          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">© {new Date().getFullYear()} ReviewPulse · Built for Indian SMBs</p>
        </footer>
      </main>
    </div>
  )
}
