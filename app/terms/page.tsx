import type { Metadata } from 'next'
import Link from 'next/link'
import { AppLogo } from '@/components/brand/AppLogo'
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms for using ${APP_NAME} Google Business review management software.`,
}

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-16 md:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
        <AppLogo variant="wordmark" wordmarkHeight={28} iconSize={32} priority />
        <span>{APP_NAME}</span>
      </Link>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last updated: July 2026</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-p:text-sm prose-li:text-sm">
        <h2>Service</h2>
        <p>
          {APP_NAME} helps businesses manage Google Business Profile reviews with AI-assisted drafts, analytics, and
          optional WhatsApp alerts. You approve every reply before it is published to Google.
        </p>
        <h2>Google connection</h2>
        <p>
          By signing in with Google, you authorize {APP_NAME} to access the Google Business Profile data needed to
          provide the service, as described on our{' '}
          <Link href="/#about">homepage</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <h2>Accounts &amp; billing</h2>
        <p>
          New accounts may receive a trial period. Paid plans renew monthly via Razorpay until cancelled. Plan limits
          (locations, AI replies) are enforced per your subscription tier.
        </p>
        <h2>Acceptable use</h2>
        <ul>
          <li>Only connect business locations you are authorized to manage</li>
          <li>Do not use AI replies to harass reviewers or violate Google policies</li>
          <li>Do not attempt to bypass rate limits or scrape third-party platforms</li>
        </ul>
        <h2>Disclaimer</h2>
        <p>
          AI suggestions are drafts, not legal advice. You are responsible for published replies and compliance with
          platform rules.
        </p>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </div>
  )
}
