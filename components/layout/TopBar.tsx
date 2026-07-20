import Link from 'next/link'
import { LogOut } from 'lucide-react'
import type { Session } from 'next-auth'
import { signOut } from '@/lib/auth'
import { AUTH_DISABLED_FOR_DEV } from '@/lib/auth-dev'
import type { AgencyBrand } from '@/lib/agency-branding'
import { MobileSidebarTrigger } from '@/components/layout/MobileSidebarTrigger'
import NotificationBell from '@/components/layout/NotificationBell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function TopBar({
  session,
  agencyBrand,
}: {
  session: Session | null
  agencyBrand?: AgencyBrand | null
}) {
  const name = session?.user?.name ?? 'Guest'
  const email = session?.user?.email
  const image = session?.user?.image
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const branded = Boolean(agencyBrand)
  const eyebrow = branded ? agencyBrand!.name : 'Overview'
  const title = branded ? agencyBrand!.name : 'Command center'
  const description = branded
    ? 'White-label workspace — review operations under your brand.'
    : 'Sentiment, inbox health, and reply velocity in one place.'

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/95 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/98 sm:px-6 sm:py-3 lg:z-30 lg:bg-white/80 lg:px-8 lg:backdrop-blur-xl dark:lg:bg-slate-900/85">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent dark:via-indigo-500/30" aria-hidden />
      {/* Mobile: one compact row; sm+: room for description + looser actions */}
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:items-start sm:gap-3 md:items-center">
          <MobileSidebarTrigger />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
              <p className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-indigo-600 dark:text-indigo-400 sm:text-[11px] sm:tracking-[0.18em]">
                {eyebrow}
              </p>
              {!branded ? (
                <Link
                  href="/"
                  className="hidden text-[11px] font-medium text-slate-400 transition hover:text-indigo-600 dark:hover:text-indigo-400 md:inline"
                >
                  Marketing site →
                </Link>
              ) : null}
            </div>
            <h1 className="font-heading mt-0.5 truncate text-base font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl md:mt-0 md:text-2xl">
              {title}
            </h1>
            <p className="mt-1 hidden max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:block">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          <NotificationBell />
          <ThemeToggle />
          {AUTH_DISABLED_FOR_DEV ? (
            <Badge className="hidden border border-amber-300/80 bg-amber-50 text-[10px] font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200 sm:inline-flex sm:text-xs">
              Dev mode
            </Badge>
          ) : null}

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/85 py-1 pl-1 pr-1.5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/90 sm:gap-3 sm:rounded-2xl sm:py-1.5 sm:pl-1.5 sm:pr-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80 dark:from-slate-700 dark:to-slate-600 dark:text-slate-100 dark:ring-slate-600/80 sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar hosts vary
                <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
              {email ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p> : null}
            </div>
          </div>

          {!AUTH_DISABLED_FOR_DEV ? (
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <Button
                type="submit"
                variant="outline"
                size="sm"
                aria-label="Sign out"
                title="Sign out"
                className="h-8 rounded-lg border-slate-200 px-2 text-xs dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 sm:h-9 sm:rounded-xl sm:px-3 sm:text-sm"
              >
                <LogOut className="h-4 w-4 shrink-0 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  )
}
