'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, FileText, LayoutDashboard, MapPin, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/locations', label: 'Locations', icon: MapPin },
  { href: '/analytics', label: 'Analytics', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/agency', label: 'Agency', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all motion-safe:duration-200',
              active
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/10'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
