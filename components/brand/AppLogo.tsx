'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { BRAND_ICON_SRC, BRAND_WORDMARK_ASPECT, BRAND_WORDMARK_LIGHT_SRC } from '@/lib/brand-assets'

export { BRAND_ICON_SRC, BRAND_WORDMARK_LIGHT_SRC } from '@/lib/brand-assets'

type LogoImageProps = {
  size?: number
  className?: string
  priority?: boolean
}

/** Square icon mark — works on light and dark backgrounds. */
export function AppMark({ size = 40, className, priority = false }: LogoImageProps) {
  return (
    <Image
      src={BRAND_ICON_SRC}
      alt="ReviewsPulse"
      width={size}
      height={size}
      priority={priority}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}

type AppLogoProps = {
  variant?: 'icon' | 'wordmark'
  /** Icon size when variant is `icon`, or dark-mode wordmark companion icon size. */
  iconSize?: number
  /** Wordmark height in px (light theme PNG). */
  wordmarkHeight?: number
  className?: string
  priority?: boolean
}

/** Full brand lockup — light PNG wordmark; dark mode uses icon + styled text for contrast. */
export function AppLogo({
  variant = 'wordmark',
  iconSize = 36,
  wordmarkHeight = 32,
  className,
  priority = false,
}: AppLogoProps) {
  if (variant === 'icon') {
    return <AppMark size={iconSize} className={className} priority={priority} />
  }

  const wordmarkWidth = Math.round(wordmarkHeight * BRAND_WORDMARK_ASPECT)

  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      <Image
        src={BRAND_WORDMARK_LIGHT_SRC}
        alt=""
        width={wordmarkWidth}
        height={wordmarkHeight}
        priority={priority}
        className="h-auto w-auto dark:hidden"
        style={{ maxHeight: wordmarkHeight, width: 'auto' }}
      />
      <span className="hidden items-center gap-2 dark:inline-flex">
        <AppMark size={iconSize} priority={priority} className="rounded-lg" />
        <span className="font-heading text-lg font-bold leading-none tracking-tight" aria-hidden>
          <span className="text-slate-100">Reviews</span>
          <span className="text-[#2563EB]">Pulse</span>
        </span>
      </span>
      {/* Accessible name when wordmark image uses alt="" in dark companion layout */}
      {/* <span className="sr-only">ReviewsPulse</span> */}
    </span>
  )
}
