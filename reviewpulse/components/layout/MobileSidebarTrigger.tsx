'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardShell } from '@/components/layout/dashboard-shell-context'

export function MobileSidebarTrigger() {
  const shell = useDashboardShell()
  if (!shell) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-2 rounded-xl border-slate-200 bg-white/90 px-2.5 lg:hidden dark:border-slate-600 dark:bg-slate-800/80"
      aria-label="Open navigation menu"
      aria-expanded={false}
      onClick={() => shell.openMobileNav()}
    >
      <Menu className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-xs font-semibold">Menu</span>
    </Button>
  )
}
