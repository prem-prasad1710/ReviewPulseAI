import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  )
}
