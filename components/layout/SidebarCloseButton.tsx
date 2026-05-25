'use client'

import { PanelLeftClose, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardShell } from '@/components/layout/dashboard-shell-context'

/** Collapses the drawer on mobile / inline sidebar on desktop. */
export default function SidebarCloseButton() {
  const shell = useDashboardShell()
  if (!shell) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="absolute right-2 top-2 z-[1] h-9 w-9 rounded-xl border-transparent bg-transparent p-0 text-slate-600 shadow-none hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:top-3"
      aria-label="Close sidebar"
      onClick={() => shell.closeSidebar()}
    >
      <X className="h-[1.125rem] w-[1.125rem] lg:hidden" aria-hidden />
      <PanelLeftClose className="hidden h-[1.125rem] w-[1.125rem] lg:block" aria-hidden />
    </Button>
  )
}
