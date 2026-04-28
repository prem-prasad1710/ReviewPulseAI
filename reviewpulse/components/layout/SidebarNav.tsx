'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react'
import { LOCATION_HUB_LINKS, hrefForLocationHubSegment } from '@/lib/location-hub-features'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/locations', label: 'Locations', icon: MapPin },
  { href: '/analytics', label: 'Analytics', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/agency', label: 'Agency', icon: Building2 },
  { href: '/subscribe', label: 'Plans', icon: Zap },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const QUICK_SEGMENTS = ['inbox', 'heatmap', 'menu-insights', 'offline-bridge', 'tone-trainer'] as const

type LocRow = { _id: string; name?: string; locationSlug?: string | null }

export default function SidebarNav() {
  const pathname = usePathname()
  const [locations, setLocations] = useState<LocRow[]>([])
  const [locLoaded, setLocLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/locations')
        const json = await res.json().catch(() => ({}))
        if (!res.ok || cancelled) return
        const list = (json?.data || []) as LocRow[]
        if (!cancelled) setLocations(list)
      } finally {
        if (!cancelled) setLocLoaded(true)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const primary = locations[0]

  return (
    <div className="flex flex-col gap-6">
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

      {locLoaded ? (
        <div className="hidden lg:block">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Outlet shortcuts
          </p>
          {primary ? (
            <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-2 dark:border-slate-700/80 dark:bg-slate-800/40">
              <p className="truncate px-2 pb-1 text-xs font-medium text-slate-600 dark:text-slate-300" title={primary.name}>
                {primary.name || 'Location'}
              </p>
              {QUICK_SEGMENTS.map((seg) => {
                const meta = LOCATION_HUB_LINKS.find((l) => l.segment === seg)
                if (!meta) return null
                const href = hrefForLocationHubSegment(seg, String(primary._id), primary.locationSlug)
                const Icon = meta.icon
                const active = pathname === href || pathname.startsWith(href.split('?')[0])
                return (
                  <Link
                    key={seg}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-indigo-600/15 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
                  </Link>
                )
              })}
              <Link
                href={`/locations/${String(primary._id)}`}
                className="mt-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                All tools
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-600 dark:bg-slate-800/30">
              <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">No outlets yet—connect Google</p>
              <Link
                href="/api/auth/signin/google?callbackUrl=/locations"
                className="mt-2 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <MapPin className="h-3 w-3" />
                Add locations
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
