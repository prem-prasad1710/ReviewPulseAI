import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TokenHealthIssue } from '@/lib/token-health'

export default function GoogleTokenAlert({ issue }: { issue: TokenHealthIssue }) {
  const isMissingKey = issue === 'missing_key'

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              {isMissingKey ? 'ENCRYPTION_KEY is not set on the server' : 'Google tokens need to be refreshed'}
            </p>
            <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
              {isMissingKey ? (
                <>
                  Review sync cannot decrypt stored Google tokens without{' '}
                  <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">ENCRYPTION_KEY</code>. Add the
                  same key to Vercel and local <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">.env.local</code>, redeploy, then reconnect Google.
                </>
              ) : (
                <>
                  Tokens were encrypted with a different key (or are outdated). Set a stable{' '}
                  <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">ENCRYPTION_KEY</code> on Vercel,
                  redeploy, then click <strong>Reconnect Google</strong> below — this re-saves tokens and fixes review sync.
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
              Generate once: <code className="rounded bg-white/60 px-1 dark:bg-black/20">openssl rand -hex 32</code> — never change it after users connect unless they reconnect Google.
            </p>
          </div>
        </div>
        <Link href="/locations/connect" className="shrink-0">
          <Button className="rounded-xl bg-amber-800 text-white hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500">
            Reconnect Google
          </Button>
        </Link>
      </div>
    </div>
  )
}
