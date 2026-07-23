'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BookOpen, Copy, ExternalLink, Mail, MessageCircleQuestion } from 'lucide-react'
import { toast } from 'sonner'
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand'
import { Button } from '@/components/ui/button'

export default function SupportPageClient() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      toast.success('Support email copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the email manually')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Support</p>
        <h1 className="font-heading mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Help &amp; support</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Billing, Google connection, and product questions for {APP_NAME}.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/85">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">Email us</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              We usually reply within one business day (IST).
            </p>
            <p className="mt-3 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{SUPPORT_EMAIL}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => void copyEmail()}>
                <Copy className="mr-2 h-4 w-4" aria-hidden />
                {copied ? 'Copied' : 'Copy email'}
              </Button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`}
                className="inline-flex h-8 items-center justify-center rounded-xl bg-[#2563EB] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#1f56c8]"
              >
                <Mail className="mr-2 h-4 w-4" aria-hidden />
                Open in mail app
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/85">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
          <MessageCircleQuestion className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
          Common topics
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <strong>Billing / Razorpay:</strong> Plans are Starter ₹999, Growth ₹2,499, Scale ₹5,999 per month. If checkout shows the wrong amount, your Razorpay plan ids in Vercel need updating — email us with a screenshot.
          </li>
          <li>
            <strong>Google sign-in:</strong> Use the same Google account that manages your Business Profile. Reconnect from{' '}
            <Link href="/locations/connect" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
              Locations → Connect Google
            </Link>
            .
          </li>
          <li>
            <strong>Plan limits:</strong> Upgrade anytime from{' '}
            <Link href="/settings#billing" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
              Settings → Billing
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <BookOpen className="mr-2 h-4 w-4" aria-hidden />
          Product docs
        </Link>
        <Link
          href="/#faq"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
          FAQ on homepage
        </Link>
      </section>
    </div>
  )
}
