'use client'

import { createContext, useContext } from 'react'

export type DashboardShellApi = {
  openMobileNav: () => void
  closeMobileNav: () => void
}

export const DashboardShellContext = createContext<DashboardShellApi | null>(null)

export function useDashboardShell() {
  return useContext(DashboardShellContext)
}
