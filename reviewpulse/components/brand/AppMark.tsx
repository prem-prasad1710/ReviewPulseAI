'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

/** App favicon as a mark — use with a visible label or `sr-only` “ReviewPulse” nearby for a11y. */
export function AppMark({
  size = 40,
  className,
  priority = false,
}: {
  size?: number
  className?: string
  /** Set true above the fold (nav, sidebar). */
  priority?: boolean
}) {
  return (
    <Image
      src="/favicon.ico"
      alt=""
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
