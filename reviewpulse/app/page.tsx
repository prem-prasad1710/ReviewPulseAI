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
import { Button } from '@/components/ui/button'

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,#bfdbfe_0%,transparent_40%),radial-gradient(circle_at_85%_10%,#bbf7d0_0%,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_35%,#f8fafc_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] opacity-50" />

      <main className="relative mx-auto max-w-7xl px-5 pb-20 pt-6 md:px-8">
        <header className="animate-fade-up mb-14 flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <div className="rounded-lg bg-[#2563EB] p-1.5 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            ReviewPulse AI
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <a href="#customers" className="hover:text-slate-900">
              Customers
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </header>

        <section className="mb-16 grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Indian SMB owners
            </p>
            <h1 className="font-heading mb-4 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
              Reply to every Google review in minutes, not days
            </h1>
            <p className="mb-7 max-w-xl text-base text-slate-700 md:text-lg">
              ReviewPulse connects your locations, fetches reviews daily, generates high-quality bilingual
              replies, and helps you publish instantly with full control.
            </p>

            <div className="mb-7 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Start 14-day trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Open Demo Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                Secure OAuth + encrypted tokens
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-[#2563EB]" />
                Go live in 10 minutes
              </span>
            </div>
          </div>

          <div className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 md:p-6">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Reviews</p>
                <p className="mt-1 text-xl font-bold text-slate-900">1,274</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Avg Rating</p>
                <p className="mt-1 text-xl font-bold text-slate-900">4.6</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="mt-1 text-xl font-bold text-[#DC2626]">18</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-slate-900">Latest Review</p>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="mb-3 text-sm text-slate-700">
                Amazing food and super quick service. Paneer tikka was outstanding.
              </p>
              <div className="rounded-xl bg-[#EFF6FF] p-3 text-sm text-[#1E3A8A]">
                Thank you so much for your kind words. We are thrilled you enjoyed our paneer tikka and
                service. Looking forward to serving you again very soon.
              </div>
            </div>
          </div>
        </section>

        <section id="customers" className="animate-fade-up mb-16">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Growing businesses trust ReviewPulse
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {logos.map((logo) => (
              <div
                key={logo}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-600"
              >
                {logo}
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mb-16">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Features</p>
            <h2 className="font-heading text-3xl font-bold text-slate-900 md:text-4xl">
              Everything you need to scale review operations
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-[#EFF6FF] p-2 text-[#2563EB]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mb-16 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h3 className="mb-6 text-center text-2xl font-bold text-slate-900">How it works</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: '01', text: 'Connect Google Business Profile via secure OAuth.' },
              { step: '02', text: 'Sync all locations and reviews automatically every day.' },
              { step: '03', text: 'Generate, edit, and publish AI replies in one click.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-[#2563EB]">Step {item.step}</p>
                <p className="text-sm text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mb-16">
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Pricing</p>
            <h2 className="font-heading text-3xl font-bold text-slate-900 md:text-4xl">Simple monthly plans</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-5 ${
                  plan.highlighted
                    ? 'border-[#2563EB] bg-[#EFF6FF] shadow-lg shadow-blue-100'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlighted ? (
                  <span className="mb-3 inline-flex rounded-full bg-[#2563EB] px-2.5 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{plan.subtitle}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {plan.price}
                  <span className="text-sm font-medium text-slate-600">/month</span>
                </p>

                <ul className="mt-4 space-y-2">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 text-[#16A34A]" />
                      {point}
                    </li>
                  ))}
                </ul>

                <Link href="/login" className="mt-5 block">
                  <Button variant={plan.highlighted ? 'default' : 'outline'} className="w-full">
                    Choose {plan.name}
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-16 grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-700">“{item.quote}”</p>
              <footer>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </section>

        <section className="rounded-3xl border border-[#BFDBFE] bg-gradient-to-r from-[#EFF6FF] to-[#ECFDF5] p-8 text-center">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            <BadgeCheck className="h-3.5 w-3.5" />
            No card required to start
          </p>
          <h3 className="font-heading mb-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Turn every review into repeat business
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-sm text-slate-700 md:text-base">
            Launch ReviewPulse today and give every customer a fast, thoughtful response that protects your
            reputation and grows trust.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Explore Product
              </Button>
            </Link>
          </div>
        </section>

        <footer className="pt-8 text-center text-sm text-slate-500">
          <p>ReviewPulse AI • Built for Indian SMBs</p>
        </footer>
      </main>
    </div>
  )
}
