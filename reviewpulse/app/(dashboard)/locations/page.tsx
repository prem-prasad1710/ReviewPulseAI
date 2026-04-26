import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function LocationsPage() {
  await connectDB()
  const session = await auth()
  const userId = session?.user?.id
  const locations = userId ? await Location.find({ userId }).sort({ createdAt: -1 }).lean() : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Connected Locations</h2>
          <p className="text-sm text-slate-600">Manage your Google Business Profiles</p>
        </div>
        <Button>Add Location</Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardDescription>
            No locations connected yet. Add your Google Business Profile to start syncing reviews.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <Card key={String(location._id)}>
              <CardTitle>{location.name}</CardTitle>
              <CardDescription className="mt-1">{location.address}</CardDescription>
              <CardDescription className="mt-2">Reviews: {location.totalReviews}</CardDescription>
              <CardDescription>Avg Rating: {location.averageRating.toFixed(1)} / 5</CardDescription>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
