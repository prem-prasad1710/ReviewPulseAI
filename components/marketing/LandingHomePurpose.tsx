import Link from 'next/link'
import { APP_NAME } from '@/lib/brand'

/** Visible on homepage for Google OAuth verification — purpose + privacy link (no login). */
export default function LandingHomePurpose() {
  return (
    <section
      aria-labelledby="home-purpose-heading"
      className="mb-16 rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/80 md:p-8"
    >
      <h2 id="home-purpose-heading" className="font-heading text-xl font-bold text-slate-900 dark:text-slate-50 md:text-2xl">
        {APP_NAME} — what this application does
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
        <strong>{APP_NAME}</strong> is review-management software for Indian small businesses. We connect to your{' '}
        <strong>Google Business Profile</strong>, sync customer reviews into one inbox, help you draft bilingual AI
        replies, and publish responses only after you approve them. Optional analytics and WhatsApp alerts help you
        respond faster to urgent feedback.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
        Sign-in uses Google OAuth so we can read and reply to reviews on locations you manage. We never post without
        your approval and we do not sell review data. Read how we handle Google user data on our{' '}
        <Link href="/about" className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
          About {APP_NAME}
        </Link>{' '}
        page and in our{' '}
        <Link href="/privacy" className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  )
}
