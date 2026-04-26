import Link from 'next/link'
import { Building2, LayoutDashboard, MapPin, MessageSquare, Settings, Sparkles } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/locations', label: 'Locations', icon: MapPin },
  { href: '/analytics', label: 'Analytics', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2">
        <div className="rounded-md bg-[#2563EB] p-2 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">ReviewPulse AI</p>
          <p className="text-xs text-slate-500">India SMB Reviews</p>
        </div>
      </Link>

      <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
