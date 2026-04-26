import { auth, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function TopBar() {
  const session = await auth()

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">Manage reviews and publish smart replies</p>
      </div>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}
      >
        <Button type="submit" variant="outline">
          Sign out {session?.user?.name ? `(${session.user.name})` : ''}
        </Button>
      </form>
    </header>
  )
}
