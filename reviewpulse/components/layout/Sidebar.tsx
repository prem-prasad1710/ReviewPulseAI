import Link from 'next/link'
import { Building2, LifeBuoy } from 'lucide-react'
import SidebarNav from '@/components/layout/SidebarNav'
import type { AgencyBrand } from '@/lib/agency-branding'
import { cn } from '@/lib/utils'

export default function Sidebar({ agencyBrand }: { agencyBrand?: AgencyBrand | null }) {
  const branded = Boolean(agencyBrand)
  const title = branded ? agencyBrand!.name : 'ReviewPulse'
  const subtitle = branded ? 'Partner workspace' : 'Review intelligence'

  return (
    <aside className="relative z-[1] flex w-full min-h-0 flex-col border-b border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/25 lg:min-h-[100dvh] lg:w-64 lg:shrink-0 lg:self-stretch lg:border-b-0 lg:border-r lg:border-slate-200/70 lg:shadow-none dark:lg:border-slate-700/70">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-indigo-200/0 via-indigo-200/40 to-indigo-200/0 dark:from-indigo-500/0 dark:via-indigo-400/25 dark:to-indigo-500/0 lg:block" aria-hidden />
      <Link
        href="/dashboard"
        className="mb-6 flex shrink-0 items-center gap-3 rounded-xl px-1 py-0.5 transition motion-safe:duration-200 hover:opacity-90 active:scale-[0.99] lg:mb-8"
      >
        {branded && agencyBrand?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agencyBrand.logoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-contain ring-1 ring-slate-200/80 dark:ring-slate-600"
          />
        ) : (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20',
              !agencyBrand?.primaryColor && 'bg-gradient-to-br from-indigo-600 to-blue-600'
            )}
            style={agencyBrand?.primaryColor ? { backgroundColor: agencyBrand.primaryColor } : undefined}
          >
            {branded ? (
              <span className="text-sm font-bold text-white">{agencyBrand!.name.slice(0, 1).toUpperCase()}</span>
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
        )}
        <div>
          <p className="font-heading text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] lg:pr-0.5">
        <SidebarNav />
      </div>

      <div className="mt-4 hidden shrink-0 pt-4 lg:mt-auto lg:block lg:pt-8">
        {!branded ? (
          <a
            href="mailto:support@reviewpulse.in"
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-100 hover:bg-white hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
          >
            <LifeBuoy className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            Help &amp; support
          </a>
        ) : null}
        {!branded ? (
          <p className="mt-3 px-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">v0.1 · Beta</p>
        ) : null}
      </div>
    </aside>
  )
}
