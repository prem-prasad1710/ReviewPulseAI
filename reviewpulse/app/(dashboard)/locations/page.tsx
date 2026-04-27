import Link from 'next/link'
import { ExternalLink, MapPin, RefreshCw } from 'lucide-react'
import { MOCK_LOCATIONS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { getAppSession } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default async function LocationsPage() {
  await connectDB()
  const session = await getAppSession()
  const useMocks = shouldUseDashboardMocks()
  const userId = session?.user?.id
  const locations = useMocks
    ? MOCK_LOCATIONS
    : userId
      ? await Location.find({ userId }).sort({ createdAt: -1 }).lean()
      : []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Connected locations
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Sync hours, reply SLAs, and ratings are tracked per outlet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl shadow-sm">Add location</Button>
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync all
          </Button>
        </div>
      </div>

      {locations.length === 0 ? (
        <Card className="dark:bg-slate-900/70">
          <CardDescription className="dark:text-slate-400">
            No locations connected yet. Add your Google Business Profile to start syncing reviews.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <Card
              key={String((location as { _id: { toString(): string } | string })._id)}
              className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/70"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-lg dark:text-slate-100">{location.name}</CardTitle>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <CardDescription className="mt-1 dark:text-slate-400">{location.address}</CardDescription>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Reviews</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{location.totalReviews}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Avg</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{location.averageRating.toFixed(1)} / 5</p>
                </div>
                {'category' in location && location.category ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{location.category}</p>
                  </div>
                ) : null}
              </div>
              {'_id' in location ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-700/80">
                  {[
                    ['Tone trainer', 'tone-trainer'],
                    ['Competitors', 'competitors'],
                    ['Booster', 'booster'],
                    ['Keywords', 'keywords'],
                    ['Reply schedule', 'settings'],
                    ['Staff tracker', 'staff-tracker'],
                    ['Heatmap', 'heatmap'],
                    ['Menu insights', 'menu-insights'],
                    ['Offline bridge', 'offline-bridge'],
                  ].map(([label, path]) => (
                    <Link
                      key={path}
                      href={`/locations/${String((location as { _id: { toString(): string } })._id)}/${path}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
                    >
                      {label}
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </Link>
                  ))}
                  {'locationSlug' in location && (location as { locationSlug?: string }).locationSlug ? (
                    <Link
                      href={`/score/${(location as { locationSlug?: string }).locationSlug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200"
                    >
                      Public score
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
