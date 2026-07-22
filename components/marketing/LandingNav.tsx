'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AppLogo } from '@/components/brand/AppLogo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/tools/free-reply', label: 'Free reply tool' },
  { href: '#electric-flow', label: 'Product map' },
  { href: '#features', label: 'Features' },
  { href: '#for-business', label: 'For owners' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#customers', label: 'Customers' },
] as const

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <header className="animate-fade-in sticky top-4 z-50 mb-12 flex items-center justify-between rounded-2xl border border-white/50 bg-white/45 px-4 py-3 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.75)] ring-1 ring-slate-900/[0.04] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/40 dark:border-white/[0.12] dark:bg-slate-950/35 dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-white/[0.06] dark:supports-[backdrop-filter]:bg-slate-950/30 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-bold text-slate-900 transition hover:opacity-90 active:scale-[0.98] dark:text-white"
        >
          <AppLogo variant="wordmark" wordmarkHeight={28} iconSize={32} priority />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex md:gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-lg px-3 py-2 transition hover:bg-slate-900/[0.04] hover:text-indigo-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <span className="relative z-10">{label}</span>
              <span
                className="pointer-events-none absolute inset-x-2 bottom-1.5 h-0.5 origin-left scale-x-0 rounded-full bg-indigo-500/80 transition duration-300 group-hover:scale-x-100 dark:bg-indigo-400/70"
                aria-hidden
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300/80 bg-white/50 shadow-sm backdrop-blur-sm transition hover:bg-white/80 active:scale-[0.98] dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/10"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/login" className="hidden sm:block">
            <Button size="sm" className="rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-[0.98]">
              Start free
            </Button>
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 text-slate-800 shadow-sm transition hover:bg-white hover:shadow-md active:scale-[0.97] md:hidden dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </header>

      <div
        id="landing-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          'fixed inset-0 z-[60] md:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity dark:bg-black/50',
            open ? 'opacity-100' : 'opacity-0'
          )}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            'absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-slate-200/90 bg-white/95 p-5 pt-20 shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-950/95',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <nav className="flex flex-col gap-1 text-base font-medium text-slate-800 dark:text-slate-100">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 transition hover:bg-indigo-50 hover:text-indigo-800 active:scale-[0.99] dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-slate-200/80 pt-5 dark:border-slate-700">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl">
                Sign in
              </Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full rounded-xl">Start free</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
