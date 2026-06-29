'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type UpgradeBannerProps = {
  title?: string
  message: string
  plan?: 'starter' | 'growth' | 'scale'
  className?: string
}

export function UpgradeBanner({
  title = 'Upgrade to unlock',
  message,
  plan = 'growth',
  className,
}: UpgradeBannerProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/25 ${className ?? ''}`}
    >
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{title}</p>
      <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">{message}</p>
      <Link href={`/subscribe?plan=${plan}`} className="mt-3 inline-block">
        <Button size="sm" className="h-8 rounded-lg text-xs">
          View {plan} plan
        </Button>
      </Link>
    </div>
  )
}

type UpgradeGateProps = {
  allowed: boolean
  title?: string
  message: string
  plan?: 'starter' | 'growth' | 'scale'
  children: React.ReactNode
}

export function UpgradeGate({ allowed, title, message, plan = 'growth', children }: UpgradeGateProps) {
  if (allowed) return <>{children}</>

  return (
    <Card className="border-amber-200/90 bg-amber-50/40 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div>
          <CardTitle className="text-base text-amber-950 dark:text-amber-100">{title ?? 'Upgrade to unlock'}</CardTitle>
          <CardDescription className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">{message}</CardDescription>
          <Link href={`/subscribe?plan=${plan}`} className="mt-4 inline-block">
            <Button size="sm" className="rounded-xl">
              Upgrade to {plan}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
