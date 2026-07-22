import type { Metadata } from 'next'
import Link from 'next/link'
import { AppLogo } from '@/components/brand/AppLogo'
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand'
import { getAppUrl } from '@/lib/app-url'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${APP_NAME} collects, uses, stores, and deletes Google user data and other information.`,
  alternates: { canonical: `${getAppUrl()}/privacy` },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-16 md:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
        <AppLogo variant="wordmark" wordmarkHeight={28} iconSize={32} priority />
        <span>{APP_NAME}</span>
      </Link>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last updated: July 2026 · Applies to {APP_NAME}</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-p:text-sm prose-li:text-sm">
        <p>
          {APP_NAME} (&quot;we&quot;, &quot;us&quot;) provides Google Business Profile review management software for
          businesses. This policy explains what data we collect, why we collect it, and your choices. Our homepage at{' '}
          <Link href="/">{getAppUrl()}</Link> describes how the product works without requiring you to sign in.
        </p>

        <h2>Information we collect</h2>
        <h3>When you sign in with Google</h3>
        <ul>
          <li>Google account profile: name, email address, and Google account identifier</li>
          <li>
            Google Business Profile data for locations you connect: business name, address, reviews (text, rating,
            reviewer display name, timestamps), and metadata needed to sync and publish replies
          </li>
          <li>OAuth tokens (access and refresh), encrypted at rest, used only to call Google APIs on your behalf</li>
        </ul>
        <h3>When you use {APP_NAME} without Google sign-in</h3>
        <ul>
          <li>
            Public tools (e.g. free AI reply preview): review text you paste, optional business name, and basic rate-limit
            identifiers (IP address, cookie) — not linked to Google
          </li>
        </ul>
        <h3>Account and billing</h3>
        <ul>
          <li>Settings you configure: WhatsApp number, alert preferences, plan tier</li>
          <li>Billing status via Razorpay (we do not store full payment card numbers)</li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>Authenticate you and maintain your {APP_NAME} account</li>
          <li>Sync reviews from Google Business Profile and display them in your inbox</li>
          <li>Generate AI-assisted reply drafts that you review and approve before publishing</li>
          <li>Publish replies to Google only after your explicit action</li>
          <li>Send alerts and digests you enable (email, WhatsApp on paid plans)</li>
          <li>Process subscriptions and enforce plan limits</li>
          <li>Maintain security, prevent abuse, and improve reliability</li>
        </ul>
        <p>
          We do <strong>not</strong> sell Google user data, use it for third-party advertising, or allow human reading of
          review content except when you request support, comply with law, or for security investigations.
        </p>

        <h2>Google API Services User Data Policy</h2>
        <p>
          {APP_NAME}&apos;s use of information received from Google APIs adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Google data is used only to provide and improve user-facing features
          you request in {APP_NAME}.
        </p>

        <h2>Data sharing</h2>
        <ul>
          <li>Google — OAuth and Business Profile API (to sync and publish on your behalf)</li>
          <li>AI providers (e.g. Groq, OpenAI) — review text sent only to generate reply drafts you request</li>
          <li>Razorpay — subscription payments</li>
          <li>Twilio — WhatsApp alerts when you enable them</li>
          <li>Email provider (Resend) — transactional email</li>
          <li>Infrastructure hosts (e.g. Vercel, MongoDB Atlas) — encrypted storage and processing</li>
        </ul>

        <h2>Retention and deletion</h2>
        <p>
          We retain Google-linked data while your account is active and as needed to provide the service. You may
          disconnect Google locations in Settings or delete your account by contacting us. We will delete or anonymize
          associated Google user data within a reasonable period after a verified deletion request, except where retention
          is required by law.
        </p>

        <h2>Security</h2>
        <p>
          Google OAuth tokens are encrypted at rest. Access to production systems is restricted. You are responsible for
          securing access to your Google account and {APP_NAME} session.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy requests, data deletion, or questions:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          <Link href="/">Return to {APP_NAME} homepage</Link> · <Link href="/terms">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
