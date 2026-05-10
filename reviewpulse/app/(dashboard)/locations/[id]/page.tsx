import Link from 'next/link'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import LocationSyncButton from '@/components/locations/LocationSyncButton'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { MOCK_LOCATIONS, shouldUseDashboardMocks } from '@/lib/dev-mock-dashboard'
import { getAppSession } from '@/lib/auth-helpers'
import { hrefForLocationHubSegment, LOCATION_HUB_LINKS } from '@/lib/location-hub-features'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

type Props = { params: Promise<{ id: string }> }

export default async function LocationHubPage({ params }: Props) {
  const { id } = await params
  await connectDB()
  const session = await getAppSession()
  const userId = session?.user?.id
  if (!userId) notFound()

  let fromMock = false
  let location = await Location.findOne({
    _id: id,
    userId: new mongoose.Types.ObjectId(userId),
  }).lean()

  if (!location && shouldUseDashboardMocks()) {
    const mock = MOCK_LOCATIONS.find((l) => String(l._id) === id)
    if (mock) {
      fromMock = true
      location = {
        ...mock,
        lastSyncedAt: undefined,
      } as unknown as NonNullable<typeof location>
    }
  }

  if (!location) notFound()

  const last = location.lastSyncedAt ? new Date(location.lastSyncedAt).toLocaleString('en-IN') : 'Never'

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/locations"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <ArrowLeft className="h-4 w-4" />
            All locations
          </Link>
          <h1 className="font-heading mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {location.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{location.address}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last synced: <span className="font-medium text-slate-700 dark:text-slate-300">{last}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <LocationSyncButton locationId={id} label="Sync reviews" variant="default" size="md" disabled={fromMock} />
          {location.locationSlug ? (
            <Link
              href={`/score/${encodeURIComponent(location.locationSlug)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Public score
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase text-slate-500">Reviews</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{location.totalReviews}</p>
        </Card>
        <Card className="border-slate-200/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase text-slate-500">Avg rating</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{Number(location.averageRating || 0).toFixed(1)} / 5</p>
        </Card>
        <Card className="border-slate-200/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase text-slate-500">Category</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{location.category || '—'}</p>
        </Card>
      </div>

      <div>
        <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">All features for this outlet</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Every tool is scoped to this location. Sync reviews first so AI, heatmaps, and staff insights stay fresh.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOCATION_HUB_LINKS.map((item) => {
            const href = hrefForLocationHubSegment(item.segment, id, location.locationSlug)
            const Icon = item.icon
            return (
              <Link
                key={item.segment}
                href={href}
                className="group flex gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800/60">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                    {item.label}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-relaxed dark:text-slate-400">{item.description}</CardDescription>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
