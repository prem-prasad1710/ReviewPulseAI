'use client'

import * as Sentry from '@sentry/nextjs'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { isSentryEnabled } from '@/lib/sentry-config'

export default function SentryUserContext() {
  const { data } = useSession()

  useEffect(() => {
    if (!isSentryEnabled()) return

    if (data?.user?.id) {
      Sentry.setUser({
        id: data.user.id,
        email: data.user.email ?? undefined,
        username: data.user.name ?? undefined,
      })
      if (data.user.plan) Sentry.setTag('plan', data.user.plan)
    } else {
      Sentry.setUser(null)
    }
  }, [data?.user?.email, data?.user?.id, data?.user?.name, data?.user?.plan])

  return null
}
