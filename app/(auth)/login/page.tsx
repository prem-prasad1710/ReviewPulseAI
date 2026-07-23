import { redirect } from 'next/navigation'
import { Lock, Sparkles } from 'lucide-react'
import { AppLogo } from '@/components/brand/AppLogo'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { getAppSession } from '@/lib/auth-helpers'

const errorMessages: Record<string, string> = {
  AccessDenied:
    'Sign in was denied. If the app is in Google OAuth testing mode, add your email as a test user in Google Cloud Console.',
  DatabaseConnection: 'Database connection failed. Add your current IP in MongoDB Atlas Network Access.',
  Configuration:
    'Google OAuth misconfiguration: redirect URI or client secret mismatch. In Vercel set NEXT_PUBLIC_APP_URL=https://reviewspulse.in, remove any NEXTAUTH_URL pointing at vercel.app, and confirm Google redirect URI https://reviewspulse.in/api/auth/callback/google.',
  OAuthCallbackError:
    'Google rejected the OAuth callback. Check redirect URIs in Google Cloud Console match https://reviewspulse.in/api/auth/callback/google exactly.',
  OAuthSignin:
    'Could not start Google sign-in. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel match Google Cloud Console.',
  CallbackRouteError:
    'OAuth callback failed — usually redirect URI mismatch or invalid client secret. See Vercel logs for [auth][cause].',
}

/** Same-origin path only — prevents open redirects. */
function safePostLoginPath(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v || typeof v !== 'string') return '/dashboard'
  try {
    const decoded = decodeURIComponent(v.trim())
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard'
    if (decoded.includes('://')) return '/dashboard'
    return decoded || '/dashboard'
  } catch {
    return '/dashboard'
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getAppSession()
  const params = await searchParams
  const redirectTo = safePostLoginPath(params?.callbackUrl)
  if (session?.user?.id) redirect(redirectTo)

  const errorParam = params?.error
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam
  const errorMessage = errorCode ? errorMessages[errorCode] || `Authentication error: ${errorCode}` : null
  const limitReason = params?.reason === 'free-reply-limit' || params?.reason?.[0] === 'free-reply-limit'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-blue-500/20 blur-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/90 dark:shadow-black/40 sm:p-10">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <AppLogo variant="wordmark" wordmarkHeight={36} iconSize={44} priority />
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Sign in</h1>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Secure OAuth · Google Business</p>
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

          {limitReason ? (
            <div className="mb-5 rounded-xl border border-indigo-200/90 bg-indigo-50/90 px-4 py-3 text-sm leading-relaxed text-indigo-900 dark:border-indigo-500/35 dark:bg-indigo-950/50 dark:text-indigo-100">
              Your free AI reply preview is used. Sign in with Google, then pick a plan to unlock the full inbox, unlimited AI replies, and one-click publish.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-800">
              {errorMessage}
            </div>
          ) : null}

          <GoogleSignInButton
            callbackUrl={redirectTo}
            className="h-11 w-full rounded-xl text-base font-semibold shadow-md shadow-indigo-600/20"
          />

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
            By continuing you agree to our acceptable use of Google Business data for review management only.
          </p>
        </div>
      </div>
    </div>
  )
}
