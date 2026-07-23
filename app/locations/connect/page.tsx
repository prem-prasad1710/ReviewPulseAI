'use client'

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { APP_NAME } from '@/lib/brand'

/** Reconnect Google Business Profile — uses browser origin for OAuth callback. */
export default function ConnectGooglePage() {
  useEffect(() => {
    void signIn('google', { callbackUrl: '/locations' })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Redirecting to Google to connect your Business Profile with {APP_NAME}…
      </p>
    </div>
  )
}
