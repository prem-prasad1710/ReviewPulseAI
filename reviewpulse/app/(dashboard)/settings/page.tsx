import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { PLAN_LIMITS } from '@/lib/plans'

export default async function SettingsPage() {
  await connectDB()
  const session = await auth()

  const user = session?.user?.id ? await User.findById(session.user.id).lean() : null

  if (!user) {
    return <p className="text-sm text-slate-500">Unable to load user settings.</p>
  }

  const currentLimit = PLAN_LIMITS[user.plan]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Settings & Billing</h2>
      <Card>
        <CardTitle>Current Plan: {user.plan.toUpperCase()}</CardTitle>
        <CardDescription className="mt-1">Subscription status: {user.subscriptionStatus}</CardDescription>
        <CardDescription className="mt-2">
          Reply quota this month: {user.repliesUsedThisMonth} /{' '}
          {currentLimit.repliesPerMonth === -1 ? 'Unlimited' : currentLimit.repliesPerMonth}
        </CardDescription>
      </Card>
    </div>
  )
}
