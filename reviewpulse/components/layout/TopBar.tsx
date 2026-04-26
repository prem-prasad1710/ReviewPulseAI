import Link from 'next/link'
import type { Session } from 'next-auth'
import { signOut } from '@/lib/auth'
import { AUTH_DISABLED_FOR_DEV } from '@/lib/auth-dev'
import type { AgencyBrand } from '@/lib/agency-branding'
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
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/85 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent dark:via-indigo-500/30" aria-hidden />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {eyebrow}
            </p>
            {!branded ? (
              <Link
                href="/"
                className="hidden text-[11px] font-medium text-slate-400 transition hover:text-indigo-600 dark:hover:text-indigo-400 sm:inline"
              >
                Marketing site →
              </Link>
            ) : null}
          </div>
          <h1 className="font-heading truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          {AUTH_DISABLED_FOR_DEV ? (
            <Badge className="border border-amber-300/80 bg-amber-50 font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200">
              Dev mode
            </Badge>
          ) : null}

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 py-1.5 pl-1.5 pr-3 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/90">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80 dark:from-slate-700 dark:to-slate-600 dark:text-slate-100 dark:ring-slate-600/80">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar hosts vary
                <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden min-w-0 sm:block">
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
              <Button type="submit" variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                Sign out
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  )
}
