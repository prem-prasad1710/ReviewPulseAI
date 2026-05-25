import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-[55vh] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">Page not found</h1>
      <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
        The route you entered does not exist or was renamed. Links from the sidebar stay up-to-date — start there after logging in.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
        <Link href="/" className="text-sm font-semibold text-[#2563EB] underline-offset-4 hover:underline">
          Marketing home
        </Link>
        <Link href="/login" className="text-sm font-semibold text-[#2563EB] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </div>
    </main>
  )
}
