import { Suspense } from 'react'
import ReviewsInbox from '@/app/(dashboard)/reviews/ReviewsInbox'
import { Skeleton } from '@/components/ui/skeleton'

function ReviewsFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-9 w-2/3 max-w-md rounded-lg" />
        <Skeleton className="h-4 w-full max-w-lg rounded-md" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsFallback />}>
      <ReviewsInbox />
    </Suspense>
  )
}
