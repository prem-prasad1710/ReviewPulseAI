'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardShellContext } from '@/components/layout/dashboard-shell-context'
import { cn } from '@/lib/utils'

export default function DashboardAppShell({
  sidebar,
  header,
  children,
}: {
  /** Server-rendered top bar (must stay a Server Component for sign-out action). */
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const openMobileNav = useCallback(() => setMobileOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, closeMobileNav])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardShellContext.Provider value={{ openMobileNav, closeMobileNav }}>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px] transition-opacity dark:bg-black/55 lg:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          className={cn(
            'relative z-[2] flex min-h-0 flex-col overflow-hidden border-slate-200/70 transition-transform duration-300 ease-out dark:border-slate-700/70',
            'fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] max-w-[18rem] border-r shadow-2xl shadow-slate-900/10 dark:shadow-black/40',
            'lg:static lg:z-[2] lg:h-[100dvh] lg:max-h-[100dvh] lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {sidebar}
        </div>

        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {header}
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-4 py-6 sm:px-6 lg:px-8 [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-[2px] dark:border-slate-700/50 dark:bg-slate-900/35 dark:shadow-black/25 dark:ring-0 sm:p-6 lg:rounded-3xl lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardShellContext.Provider>
    </div>
  )
}
