import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { AUTH_DISABLED_FOR_DEV } from '@/lib/auth-dev'
import { getAgencyBrandFromHeaders } from '@/lib/agency-branding'
import { getAppSession } from '@/lib/auth-helpers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession()
  if (!AUTH_DISABLED_FOR_DEV && !session?.user?.id) redirect('/login')

  const agencyBrand = await getAgencyBrandFromHeaders()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#eef2fb] via-[#f2f5fc] to-[#e8efff] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(at 0% 0%, rgb(199 210 254) 0px, transparent 52%),
            radial-gradient(at 100% 0%, rgb(186 230 253) 0px, transparent 48%),
            radial-gradient(at 80% 100%, rgb(233 213 255) 0px, transparent 42%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-40 dark:block"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(at 0% 0%, rgb(67 56 202 / 0.35) 0px, transparent 52%),
            radial-gradient(at 100% 0%, rgb(30 64 175 / 0.3) 0px, transparent 48%),
            radial-gradient(at 80% 100%, rgb(88 28 135 / 0.28) 0px, transparent 42%)`,
        }}
      />
      <Sidebar agencyBrand={agencyBrand} />
      <div className="relative z-[1] flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar session={session} agencyBrand={agencyBrand} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-[2px] dark:border-slate-700/50 dark:bg-slate-900/35 dark:shadow-black/25 dark:ring-0 sm:p-6 lg:rounded-3xl lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
