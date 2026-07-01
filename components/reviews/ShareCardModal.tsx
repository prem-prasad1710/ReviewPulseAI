'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Image, Loader2, Share2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ShareCardModalProps {
  reviewId: string
  reviewerName: string
  rating: number
  comment?: string
  locationName?: string
  onClose: () => void
}

export default function ShareCardModal({
  reviewId,
  reviewerName,
  rating,
  comment,
  locationName,
  onClose,
}: ShareCardModalProps) {
  const [loading, setLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  const cardUrl = `/api/reviews/${reviewId}/share-card`
  const waText = `${rating}★ review${locationName ? ` for ${locationName}` : ''}:\n\n"${(comment || '').slice(0, 300)}"\n\n— ${reviewerName.split(' ')[0]}`

  useEffect(() => {
    setLoading(true)
    setError(false)
    const img = new window.Image()
    img.onload = () => { setImgSrc(cardUrl); setLoading(false) }
    img.onerror = () => { setError(true); setLoading(false) }
    img.src = cardUrl
  }, [cardUrl])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = cardUrl
    a.download = `review-${reviewId}.png`
    a.click()
    toast.success('Card downloaded!')
  }

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(waText)
    toast.success('Review text copied!')
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review Share Card</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-5">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="text-4xl">⭐</div>
                <p className="text-lg font-semibold text-white">{rating}★ — {reviewerName.split(' ')[0]}</p>
                <p className="text-sm text-indigo-200 line-clamp-3">{comment ? `"${comment}"` : ''}</p>
                {locationName && <p className="text-xs text-slate-400">{locationName}</p>}
                <p className="mt-1 text-xs text-indigo-400">ReviewPulse</p>
              </div>
            ) : imgSrc ? (
              <img src={imgSrc} alt="Review card" className="h-full w-full object-cover" />
            ) : null}
          </div>

          {/* Rating info */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-amber-500">{'★'.repeat(rating)}</span>
              <span className="ml-2 text-slate-500">{reviewerName.split(' ')[0]}</span>
            </p>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              1080×1080 • PNG
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
          <Button className="w-full gap-2 rounded-xl" onClick={handleDownload} disabled={loading || error}>
            <Download className="h-4 w-4" />
            Download as PNG
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" className="w-full gap-1.5 rounded-xl text-sm" onClick={() => void handleCopyText()}>
              Copy text
            </Button>
            <Button
              variant="outline"
              className="w-full gap-1.5 rounded-xl bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 dark:text-[#25D366] text-sm"
              onClick={handleWhatsApp}
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
          <p className="text-center text-[11px] text-slate-400">
            Share on Instagram, WhatsApp status, or Facebook — your customers&apos; words are your best marketing!
          </p>
        </div>
      </div>
    </div>
  )
}
