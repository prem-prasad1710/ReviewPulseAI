'use client'

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardShellContext } from '@/components/layout/dashboard-shell-context'
import { cn } from '@/lib/utils'

function useIsLargeScreen(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(min-width: 1024px)')
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    /** Mobile-first SSR so first client snapshot matches on phones; sidebar wrapper uses suppressHydrationWarning for class churn. Desktop may flash expanded after hydration. */
    () => false
  )
}

export default function DashboardAppShell({
  sidebar,
  header,
  children,
}: {
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()
  const isDesktop = useIsLargeScreen()

  /** Mobile/off-canvas drawer. */
  const [mobileOpen, setMobileOpen] = useState(false)
  /** Desktop inline sidebar width expanded/collapsed. */
  const [desktopOpen, setDesktopOpen] = useState(true)

  const sidebarVisible = isDesktop ? desktopOpen : mobileOpen

  const openSidebar = useCallback(() => {
    if (isDesktop) setDesktopOpen(true)
    else setMobileOpen(true)
  }, [isDesktop])

  const closeSidebar = useCallback(() => {
    if (isDesktop) setDesktopOpen(false)
    else setMobileOpen(false)
  }, [isDesktop])

  const toggleSidebar = useCallback(() => {
    if (isDesktop) setDesktopOpen((v) => !v)
    else setMobileOpen((v) => !v)
  }, [isDesktop])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen && !isDesktop) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [mobileOpen, isDesktop])

  useEffect(() => {
    if (!mobileOpen || isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, isDesktop])

  const shellValue = {
    isSidebarOpen: sidebarVisible,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    openMobileNav: openSidebar,
    closeMobileNav: closeSidebar,
  }

  const showDesktopSidebar = isDesktop && desktopOpen
  const showMobileDrawer = mobileOpen

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardShellContext.Provider value={shellValue}>
        {!isDesktop && mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            /** Solid scrim avoids iOS stacking-blur bleed on content under the drawer. */
            className="fixed inset-0 z-40 bg-slate-900/55 dark:bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden lg:z-10 lg:flex-row">
          <div
            suppressHydrationWarning
            className={cn(
              'flex min-h-0 flex-col overflow-hidden border-transparent transition-[transform,width,opacity,border-color,padding] duration-300 ease-out dark:border-slate-700/70',
              // Mobile drawer
              'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(18rem,88vw)] max-lg:max-w-[18rem]',
              showMobileDrawer
                ? 'max-lg:translate-x-0 max-lg:border-r max-lg:border-slate-200/80 max-lg:bg-white max-lg:shadow-xl max-lg:shadow-slate-900/12 dark:max-lg:border-slate-700/80 dark:max-lg:bg-slate-900 dark:max-lg:shadow-black/35'
                : 'max-lg:pointer-events-none max-lg:-translate-x-full',
              // Desktop: in-flow collapsible strip
              'lg:relative lg:z-[2] lg:h-[100dvh] lg:max-h-[100dvh] lg:shrink-0 lg:translate-x-0 lg:shadow-none',
              showDesktopSidebar
                ? 'lg:w-64 lg:border-r lg:border-slate-200/70 lg:opacity-100 dark:lg:border-slate-700/70'
                : 'lg:w-0 lg:min-w-0 lg:max-w-0 lg:border-0 lg:p-0 lg:opacity-0 lg:overflow-hidden lg:pointer-events-none'
            )}
          >
            {sidebar}
          </div>

          <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {header}
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-3 py-4 sm:px-6 sm:py-6 lg:px-8 [-webkit-overflow-scrolling:touch]">
              {/** On small screens avoid backdrop-blur on content chrome (blurry text on some mobile GPUs). */}
              <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/95 sm:p-6 sm:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.08)] lg:rounded-3xl lg:border-slate-200/70 lg:bg-white/90 lg:p-8 lg:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.1)] lg:ring-1 lg:ring-white/70 lg:backdrop-blur-[2px] dark:lg:bg-slate-900/35 dark:lg:shadow-black/25 dark:lg:ring-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DashboardShellContext.Provider>
    </div>
  )
}
