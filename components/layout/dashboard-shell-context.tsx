'use client'

import { createContext, useContext } from 'react'

export type DashboardShellApi = {
  /** Whether navigation panel is expanded for the active viewport (< lg = drawer open; ≥ lg = inline sidebar expanded). */
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  /** @deprecated Alias for openSidebar */
  openMobileNav: () => void
  /** @deprecated Alias for closeSidebar */
  closeMobileNav: () => void
}

export const DashboardShellContext = createContext<DashboardShellApi | null>(null)

export function useDashboardShell() {
  return useContext(DashboardShellContext)
}
