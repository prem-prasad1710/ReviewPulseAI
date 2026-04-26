import { redirect } from 'next/navigation'
import { Building2, Lock, Sparkles } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { getAppSession } from '@/lib/auth-helpers'
import { Button } from '@/components/ui/button'

const errorMessages: Record<string, string> = {
  AccessDenied: 'Sign in was denied. Please check Google OAuth test users and MongoDB connection.',
  DatabaseConnection: 'Database connection failed. Add your current IP in MongoDB Atlas Network Access.',
  Configuration: 'OAuth configuration issue detected. Verify Google OAuth client settings.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getAppSession()
  if (session?.user?.id) redirect('/dashboard')

  const params = await searchParams
  const errorParam = params?.error
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam
  const errorMessage = errorCode ? errorMessages[errorCode] || `Authentication error: ${errorCode}` : null

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-blue-500/20 blur-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/90 dark:shadow-black/40 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">ReviewPulse</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Secure sign-in</p>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Connect your Google Business Profile and manage every review from one professional workspace.
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 dark:border-indigo-500/35 dark:bg-indigo-950/50 dark:text-indigo-200">
              <Sparkles className="h-3 w-3" />
              AI replies · Hindi &amp; English
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Lock className="h-3 w-3" />
              OAuth only — we never store passwords
            </span>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-800">
              {errorMessage}
            </div>
          ) : null}

          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/dashboard' })
            }}
          >
            <Button type="submit" className="h-11 w-full rounded-xl text-base font-semibold shadow-md shadow-indigo-600/20">
              Continue with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
            By continuing you agree to our acceptable use of Google Business data for review management only.
          </p>
        </div>
      </div>
    </div>
  )
}
