import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { formatCurrencyINR } from '@/lib/utils'
import { AlertCircle, IndianRupee, MessageSquareReply, Star } from 'lucide-react'

export default function StatsCards({
  totalReviews,
  averageRating,
  pendingReplies,
  repliedThisMonth,
}: {
  totalReviews: number
  averageRating: number
  pendingReplies: number
  repliedThisMonth: number
}) {
  const stats = [
    {
      label: 'Total Reviews',
      value: totalReviews.toLocaleString('en-IN'),
      helper: 'Across connected locations',
      icon: MessageSquareReply,
      iconClass: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Average Rating',
      value: `${averageRating.toFixed(1)} / 5`,
      helper: averageRating >= 4 ? 'Excellent customer sentiment' : 'Track improvements weekly',
      icon: Star,
      iconClass: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Pending Replies',
      value: pendingReplies.toLocaleString('en-IN'),
      helper: pendingReplies > 0 ? 'Action needed to protect response rate' : 'Great job staying responsive',
      icon: AlertCircle,
      iconClass: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Revenue Potential',
      value: formatCurrencyINR(repliedThisMonth * 999),
      helper: 'Estimated based on replied reviews',
      icon: IndianRupee,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="relative overflow-hidden border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-5 translate-x-5 rounded-full bg-slate-100/60" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <CardDescription className="text-slate-500">{stat.label}</CardDescription>
                <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</CardTitle>
              </div>
              <span className={`rounded-xl p-2 ${stat.iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{stat.helper}</p>
          </Card>
        )
      })}
    </div>
  )
}
