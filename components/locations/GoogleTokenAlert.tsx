import Link from 'next/link'
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TokenHealthIssue } from '@/lib/token-health'

export default function GoogleTokenAlert({ issue }: { issue: TokenHealthIssue | 'seed_data' }) {
  const isMissingKey = issue === 'missing_key'
  const isSeed = issue === 'seed_data'

  const title = isSeed
    ? 'Sample restaurants cannot sync to Google'
    : isMissingKey
      ? 'ENCRYPTION_KEY is not configured on the server'
      : 'Google tokens need to be refreshed'

  const body = isSeed ? (
    <>
      You loaded demo outlets (Namma Kitchen, etc.). Review sync only works for real Google Business
      locations. Use <strong>Reset &amp; reload sample data</strong> to clear them, or click{' '}
      <strong>Reconnect Google</strong> to import your actual business.
    </>
  ) : isMissingKey ? (
    <>
      Review sync cannot decrypt stored Google tokens without{' '}
      <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">ENCRYPTION_KEY</code>.
      Add the same 64-character hex key to Vercel → Environment Variables and your local{' '}
      <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">.env</code>, redeploy,
      then reconnect Google.
    </>
  ) : (
    <>
      Tokens were encrypted with a different key or have expired. Set a stable{' '}
      <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">ENCRYPTION_KEY</code>{' '}
      on Vercel, redeploy, then click <strong>Reconnect Google</strong> — this re-saves fresh
      tokens and fixes review sync immediately.
    </>
  )

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          {isMissingKey ? (
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          )}
          <div>
            <p className="font-semibold text-amber-950 dark:text-amber-100">{title}</p>
            <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">{body}</p>
            {!isSeed && (
              <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
                Generate a key:{' '}
                <code className="rounded bg-white/60 px-1 dark:bg-black/20">
                  openssl rand -hex 32
                </code>{' '}
                — never change it after users connect, or they must reconnect.
              </p>
            )}
          </div>
        </div>
        {!isMissingKey && (
          <Link href="/locations/connect" className="shrink-0">
            <Button className="gap-2 rounded-xl bg-amber-800 text-white hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500">
              <RefreshCw className="h-4 w-4" />
              Reconnect Google
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
