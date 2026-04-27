import Link from 'next/link'
import { ExternalLink, LayoutGrid, MapPin } from 'lucide-react'
import { MOCK_LOCATIONS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { getAppSession } from '@/lib/auth-helpers'
import { hrefForLocationHubSegment, LOCATION_HUB_LINKS } from '@/lib/location-hub-features'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import LocationSyncButton from '@/components/locations/LocationSyncButton'
import LocationsToolbar from '@/components/locations/LocationsToolbar'
import { Card, CardDescription } from '@/components/ui/card'

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
            Sync pulls Google reviews for every outlet, then powers inbox, AI, heatmaps, staff shoutouts, and alerts.
          </p>
        </div>
        <LocationsToolbar useMocks={useMocks} />
      </div>

      {locations.length === 0 ? (
        <Card className="dark:bg-slate-900/70">
          <CardDescription className="dark:text-slate-400">
            No locations connected yet. Sign in with Google (Business Profile scope), then add outlets from the same
            account. Use <strong>Add location</strong> above to re-authenticate if you need more listings.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => {
            const id = String((location as { _id: { toString(): string } })._id)
            const slug = (location as { locationSlug?: string }).locationSlug
            const lastSyncedAt = (location as { lastSyncedAt?: Date }).lastSyncedAt
            const last = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'
            return (
              <Card
                key={id}
                className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/70"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/locations/${id}`}
                        className="font-heading block truncate text-lg font-bold text-slate-900 hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        {location.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Synced {last}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Live
                    </span>
                    <LocationSyncButton locationId={id} label="Sync" disabled={useMocks} />
                  </div>
                </div>
                <CardDescription className="mt-1 dark:text-slate-400">{location.address}</CardDescription>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Reviews</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{location.totalReviews}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Avg</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{Number(location.averageRating).toFixed(1)} / 5</p>
                  </div>
                  {'category' in location && location.category ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{location.category}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700/80">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Features</p>
                    <Link
                      href={`/locations/${id}`}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#1f56c8] active:scale-[0.98]"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Open hub
                    </Link>
                  </div>
                  <div className="flex max-h-[7.5rem] flex-wrap gap-1.5 overflow-y-auto pr-1 md:max-h-none">
                    {LOCATION_HUB_LINKS.map((item) => (
                      <Link
                        key={item.segment}
                        href={hrefForLocationHubSegment(item.segment, id, slug)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
                      >
                        {item.label}
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden />
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
