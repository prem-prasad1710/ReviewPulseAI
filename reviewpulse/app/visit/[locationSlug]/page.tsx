import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'
import VisitBridgeClient from './VisitBridgeClient'

type Props = { params: Promise<{ locationSlug: string }>; searchParams: Promise<{ ref?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locationSlug } = await params
  await connectDB()
  const loc = await Location.findOne({ locationSlug }).select('name category').lean()
  if (!loc) return { title: 'Visit' }
  return { title: `Thank you — ${loc.name}`, description: 'Leave a Google review' }
}

export default async function VisitPage({ params, searchParams }: Props) {
  const { locationSlug } = await params
  const sp = await searchParams
  await connectDB()
  const loc = await Location.findOne({ locationSlug }).select('name category googlePlaceId _id').lean()
  if (!loc?.googlePlaceId) notFound()

  const ref = sp.ref || ''
  const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(loc.googlePlaceId)}`

  return (
    <VisitBridgeClient
      key={`${locationSlug}-${ref || 'na'}`}
      businessName={loc.name}
      category={loc.category || 'Business'}
      locationSlug={locationSlug}
      refDate={ref}
      googleReviewUrl={googleReviewUrl}
    />
  )
}
