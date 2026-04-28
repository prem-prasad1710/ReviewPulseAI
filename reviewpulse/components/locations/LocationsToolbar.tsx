'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, RefreshCw } from 'lucide-react'

export default function LocationsToolbar({ useMocks }: { useMocks: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const syncAll = async () => {
    if (useMocks) {
      toast.message('Sync is disabled in dashboard mock mode')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/locations/sync-all', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Sync all failed')
        return
      }
      const n = json?.data?.locations ?? 0
      const total = json?.data?.totalReviewsSynced ?? 0
      const failures = (json?.data?.results as Array<{ error?: string }> | undefined)?.filter((r) => r.error).length ?? 0
      toast.success(`Synced ${n} location${n === 1 ? '' : 's'} · ${total} review pull${total === 1 ? '' : 's'}`)
      if (failures > 0) {
        toast.message(`${failures} location(s) reported an error — check tokens or GBP access.`)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {useMocks ? (
        <span className="inline-flex h-10 cursor-not-allowed items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500 opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <MapPin className="mr-2 h-4 w-4" />
          Add location
        </span>
      ) : (
        <Link
          href="/api/auth/signin/google?callbackUrl=/locations"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#1f56c8] active:scale-[0.98] dark:shadow-indigo-950/30"
          title="Re-authorize with Google to import Business Profile locations into ReviewPulse"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Add locations
        </Link>
      )}
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        disabled={useMocks || loading}
        onClick={() => void syncAll()}
        title={useMocks ? 'Turn off DEV_MOCK_DASHBOARD to sync real data' : 'Pull latest reviews from Google for every connected outlet'}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing all…' : 'Sync all'}
      </button>
    </div>
  )
}
