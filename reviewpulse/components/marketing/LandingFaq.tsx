'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'Does ReviewPulse post replies without my approval?',
    a: 'No. You review and edit every AI draft before anything is published to Google. You stay in control of tone and wording.',
  },
  {
    q: 'Which languages are supported for AI replies?',
    a: 'ReviewPulse is tuned for Hindi, English, and natural Hinglish so you can match how your customers actually write.',
  },
  {
    q: 'How does billing work?',
    a: 'Plans are billed monthly in INR through Razorpay. You can upgrade or adjust as you add locations and reply volume.',
  },
  {
    q: 'Is my Google Business data secure?',
    a: 'We use standard OAuth with Google, encrypt sensitive tokens at rest, and follow least-privilege access for connected accounts.',
  },
]

export default function LandingFaq() {
  const [open, setOpen] = useState(0)

  return (
    <div className="mx-auto max-w-2xl">
      {faqs.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            className="border-b border-slate-200/90 last:border-0 dark:border-slate-700/90"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 transition hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-400 md:text-base"
            >
              {item.q}
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-slate-400 motion-safe:transition-transform motion-safe:duration-300 dark:text-slate-500',
                  isOpen && 'rotate-180 text-indigo-600 dark:text-indigo-400'
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
                isOpen ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
