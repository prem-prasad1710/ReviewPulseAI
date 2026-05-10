'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LocationSyncButton({
  locationId,
  label = 'Sync',
  variant = 'outline',
  size = 'md',
  className,
  disabled,
}: {
  locationId: string
  label?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'md'
  className?: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/locations/${locationId}/sync`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Sync failed')
        return
      }
      const n = json?.data?.syncedReviews ?? 0
      toast.success(`Synced ${n} review${n === 1 ? '' : 's'}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn('rounded-xl', className)}
      onClick={() => void run()}
    >
      <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
      {loading ? 'Syncing…' : label}
    </Button>
  )
}
