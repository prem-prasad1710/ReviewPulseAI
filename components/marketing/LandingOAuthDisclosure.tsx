import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand'

/** Google OAuth verification — purpose, functionality, and data use (public, no login). */
export default function LandingOAuthDisclosure() {
  return (
    <section
      id="about"
      aria-labelledby="about-reviewspulse-heading"
      className="mb-20 scroll-mt-24 rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-900/85 dark:ring-white/[0.04] md:p-10"
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          About {APP_NAME}
        </p>
        <h2
          id="about-reviewspulse-heading"
          className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl"
        >
          What {APP_NAME} is and why we use Google sign-in
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
          <strong>{APP_NAME}</strong> is a web application that helps Indian small businesses manage their{' '}
          <strong>Google Business Profile</strong> reviews in one place. You can sync reviews from your connected
          locations, draft AI-assisted replies in English and Hindi, approve every response before it goes live, and
          track sentiment and reputation trends — without switching between tools.
        </p>

        <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-50">What you can do with {APP_NAME}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>Connect one or more Google Business Profile locations via secure Google OAuth (Sign in with Google).</li>
          <li>Automatically sync new and existing customer reviews into a unified inbox.</li>
          <li>Generate AI reply drafts; you edit and approve before anything is published back to Google.</li>
          <li>View analytics (sentiment, themes, reply velocity) to improve customer experience.</li>
          <li>Optionally receive email or WhatsApp alerts for urgent low-star reviews (paid plans).</li>
          <li>
            Try one free public AI reply at{' '}
            <Link
              href="/tools/free-reply"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              /tools/free-reply
            </Link>{' '}
            — no Google account required.
          </li>
        </ul>

        <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-50">
          Why {APP_NAME} requests your Google data
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          When you choose <strong>Continue with Google</strong>, we ask for access only to operate the features above.
          We use your Google account to identify you and to access the Business Profile APIs on your behalf:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            <strong>Basic profile</strong> (name, email) — to create your {APP_NAME} account and billing identity.
          </li>
          <li>
            <strong>Google Business Profile management</strong> — to list locations you manage, read reviews, and publish
            replies you approve.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          We do <strong>not</strong> post replies without your approval, sell your review data, or use Google data for
          advertising. OAuth tokens are encrypted at rest. You can disconnect Google anytime from Settings and request
          deletion via our privacy contact.
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700 dark:text-indigo-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Privacy policy</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                How we collect, use, store, and delete Google user data — required for OAuth apps.
              </p>
            </div>
          </div>
          <Link
            href="/privacy"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Read Privacy Policy
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Questions?{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
            {SUPPORT_EMAIL}
          </a>
          {' · '}
          <Link href="/terms" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
            Terms of Service
          </Link>
        </p>
      </div>
    </section>
  )
}
