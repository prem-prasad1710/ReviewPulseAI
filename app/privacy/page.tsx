import type { Metadata } from 'next'
import Link from 'next/link'
import { AppMark } from '@/components/brand/AppMark'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How ReviewPulse AI collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-16 md:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
        <AppMark size={32} className="rounded-lg" />
        ReviewPulse AI
      </Link>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last updated: June 2026</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-p:text-sm prose-li:text-sm">
        <h2>What we collect</h2>
        <p>
          When you sign in with Google, we store your account profile, connected Google Business Profile locations, synced
          reviews, and settings you configure (WhatsApp number, alert preferences, billing status).
        </p>
        <h2>How we use data</h2>
        <p>
          We use your data to sync reviews, generate AI reply drafts, send alerts you enable, process subscriptions via
          Razorpay, and improve product reliability. We do not sell your review data.
        </p>
        <h2>Third parties</h2>
        <ul>
          <li>Google — OAuth and Business Profile API</li>
          <li>Razorpay — subscription billing</li>
          <li>Twilio — WhatsApp alerts (when configured)</li>
          <li>AI providers (Groq/OpenAI) — reply generation</li>
        </ul>
        <h2>Contact</h2>
        <p>For privacy requests, email the address listed on your ReviewPulse account invoice or support channel.</p>
      </div>
    </div>
  )
}
