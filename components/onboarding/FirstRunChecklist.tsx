'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  hasLocations: boolean
  hasReviews: boolean
  pendingCount: number
  whatsappConfigured: boolean
}

export default function FirstRunChecklist({
  hasLocations,
  hasReviews,
  pendingCount,
  whatsappConfigured,
}: Props) {
  const steps = [
    {
      done: hasLocations,
      title: 'Connect Google Business',
      body: 'Import your outlets from Google in about 90 seconds.',
      href: '/locations/connect',
      cta: 'Connect Google',
    },
    {
      done: hasReviews,
      title: 'Sync your first reviews',
      body: 'We pull reviews automatically after connect — or sync manually from Locations.',
      href: '/locations',
      cta: 'Open locations',
    },
    {
      done: pendingCount === 0 && hasReviews,
      title: 'Reply to your first review',
      body: pendingCount > 0 ? `${pendingCount} review(s) waiting in your inbox.` : 'Generate an AI draft and publish to Google.',
      href: '/reviews',
      cta: 'Open inbox',
    },
    {
      done: whatsappConfigured,
      title: 'Enable WhatsApp alerts',
      body: 'Get instant pings for ≤2★ reviews on your phone.',
      href: '/settings#whatsapp',
      cta: 'Set up WhatsApp',
    },
  ]

  const completed = steps.filter((s) => s.done).length
  if (completed === steps.length) return null

  return (
    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 p-6 shadow-sm dark:border-indigo-500/30 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-violet-950/30">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Getting started</p>
      <h3 className="font-heading mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
        {completed}/{steps.length} setup steps complete
      </h3>
      <ul className="mt-5 space-y-4">
        {steps.map((step) => (
          <li key={step.title} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="flex gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
              )}
              <div>
                <p className={cn('text-sm font-semibold', step.done ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-slate-100')}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{step.body}</p>
              </div>
            </div>
            {!step.done ? (
              <Link href={step.href}>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                  {step.cta}
                </Button>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
