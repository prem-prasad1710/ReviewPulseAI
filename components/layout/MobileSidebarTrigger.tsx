'use client'

import { Menu, PanelLeft, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardShell } from '@/components/layout/dashboard-shell-context'
import { cn } from '@/lib/utils'

/** Opens/closes sidebar on mobile (drawer) and desktop (collapse). */
export function MobileSidebarTrigger() {
  const shell = useDashboardShell()
  if (!shell) return null

  const open = shell.isSidebarOpen

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'h-9 shrink-0 gap-1.5 rounded-xl border-slate-200 bg-white px-2.5 dark:border-slate-600 dark:bg-slate-800/90',
        'lg:gap-2'
      )}
      aria-label={open ? 'Collapse navigation sidebar' : 'Open navigation sidebar'}
      aria-expanded={open}
      onClick={() => shell.toggleSidebar()}
    >
      {open ? (
        <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <>
          <Menu className="h-4 w-4 shrink-0 lg:hidden" aria-hidden />
          <PanelLeft className="hidden h-4 w-4 shrink-0 lg:inline" aria-hidden />
        </>
      )}
      <span className="hidden text-xs font-semibold sm:inline">{open ? 'Hide' : 'Menu'}</span>
    </Button>
  )
}
