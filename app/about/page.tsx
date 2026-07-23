import type { Metadata } from 'next'
import Link from 'next/link'
import { AppLogo } from '@/components/brand/AppLogo'
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand'
import { getAppUrl } from '@/lib/app-url'

export const metadata: Metadata = {
  title: `About ${APP_NAME}`,
  description: `What ${APP_NAME} does, how it uses Google Business Profile data, and why we request Google sign-in.`,
  alternates: { canonical: `${getAppUrl()}/about` },
}

export default function AboutPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-16 md:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
      >
        <AppLogo variant="wordmark" wordmarkHeight={28} iconSize={32} priority />
      </Link>

      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-50">
        About {APP_NAME}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Application purpose, features, and Google data use
      </p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-p:text-sm prose-li:text-sm">
        <p>
          <strong>{APP_NAME}</strong> is a web application that helps Indian small businesses manage their{' '}
          <strong>Google Business Profile</strong> reviews in one place. You can sync reviews from connected locations,
          draft AI-assisted replies in English and Hindi, approve every response before it goes live, and track
          sentiment and reputation trends.
        </p>

        <h2>What you can do with {APP_NAME}</h2>
        <ul>
          <li>Connect Google Business Profile locations via secure Google OAuth (Sign in with Google).</li>
          <li>Automatically sync customer reviews into a unified inbox.</li>
          <li>Generate AI reply drafts; you edit and approve before publishing to Google.</li>
          <li>View analytics (sentiment, themes, reply velocity).</li>
          <li>Optionally receive email or WhatsApp alerts for urgent low-star reviews (paid plans).</li>
          <li>
            Try one free public AI reply at{' '}
            <Link href="/tools/free-reply">/tools/free-reply</Link> — no Google account required.
          </li>
        </ul>

        <h2>Why {APP_NAME} requests your Google data</h2>
        <p>
          When you choose <strong>Continue with Google</strong>, we request access only to operate the features above:
        </p>
        <ul>
          <li>
            <strong>Basic profile</strong> (name, email) — to create your {APP_NAME} account and billing identity.
          </li>
          <li>
            <strong>Google Business Profile management</strong> — to list locations you manage, read reviews, and
            publish replies you approve.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> post replies without your approval, sell your review data, or use Google data for
          advertising. OAuth tokens are encrypted at rest. You can disconnect Google from Settings and request deletion
          via our privacy contact.
        </p>

        <h2>Privacy policy</h2>
        <p>
          How we collect, use, store, and delete Google user data is described in our{' '}
          <Link href="/privacy">Privacy Policy</Link> ({getAppUrl()}/privacy).
        </p>

        <h2>Contact</h2>
        <p>
          Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          <Link href="/">Return to {APP_NAME} homepage</Link> · <Link href="/terms">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
