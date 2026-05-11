'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Tab = 'instagram' | 'whatsapp' | 'google'

export default function SocialPostModal({
  open,
  reviewId,
  businessName,
  rating,
  reviewerName,
  comment,
  onClose,
}: {
  open: boolean
  reviewId: string
  businessName: string
  rating: number
  reviewerName: string
  comment?: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('instagram')
  const [ig, setIg] = useState('')
  const [wa, setWa] = useState('')
  const [gp, setGp] = useState('')
  const [loading, setLoading] = useState(false)
  const [canFull, setCanFull] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setIg('')
        setWa('')
        setGp('')
        setTab('instagram')
        setCanFull(false)
      })
    }
  }, [open])

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'English' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Generation failed')
        return
      }
      setIg(json?.data?.instagram || '')
      setWa(json?.data?.whatsapp || '')
      setGp(json?.data?.googlePost || '')
      setCanFull(Boolean(json?.data?.canDownloadGraphic))
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const drawGraphic = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = 1080
    const h = 1080
    canvas.width = w
    canvas.height = h
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 42px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const quote = (comment || 'Thank you for the kind words!').slice(0, 220)
    wrapText(ctx, `"${quote}"`, w / 2, 360, w - 160, 48)
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText(`${'★'.repeat(rating)} · ${reviewerName}`, w / 2, 720)
    ctx.font = '36px system-ui, sans-serif'
    ctx.fillStyle = '#1e293b'
    ctx.fillText(businessName, w / 2, 820)
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('Verified Google Review · ReviewPulse', w / 2, 1000)
  }, [businessName, comment, rating, reviewerName])

  const downloadPng = () => {
    if (!canFull) {
      toast.message('Upgrade to Growth or Scale to download the graphic.')
      return
    }
    drawGraphic()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `review-social-${reviewId}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const postGoogle = async () => {
    if (!canFull) {
      toast.message('Upgrade to Growth or Scale to post from ReviewPulse.')
      return
    }
    const res = await fetch(`/api/reviews/${reviewId}/social/post-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: gp }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Post failed')
      return
    }
    toast.success('Posted to Google (if API accepted the payload)')
  }

  if (!open) return null

  const value = tab === 'instagram' ? ig : tab === 'whatsapp' ? wa : gp
  const onValue = (v: string) => {
    if (tab === 'instagram') setIg(v)
    else if (tab === 'whatsapp') setWa(v)
    else setGp(v)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-slate-50">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-300">Social content</p>
          <h2 className="font-heading text-lg font-bold">Create social content</h2>
        </div>
        <button type="button" className="rounded-lg px-3 py-1 text-sm text-slate-300 hover:bg-slate-800" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:flex-row">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            {(['instagram', 'whatsapp', 'google'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tab === t ? 'default' : 'secondary'}
                className="rounded-xl capitalize"
                onClick={() => setTab(t)}
              >
                {t === 'google' ? 'Google post' : t}
              </Button>
            ))}
          </div>
          <Button className="rounded-xl" disabled={loading} onClick={() => void generate()}>
            {loading ? 'Generating…' : ig ? 'Regenerate' : 'Generate all formats'}
          </Button>
          <textarea
            value={value}
            onChange={(e) => onValue(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="rounded-xl" onClick={() => void copy(value)} disabled={!value}>
              Copy
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-600" onClick={downloadPng}>
              Download graphic
            </Button>
            {tab === 'google' ? (
              <Button className="rounded-xl" onClick={() => void postGoogle()} disabled={!gp}>
                Post to Google
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-slate-400">
            Graphic: 1080×1080 PNG with quote, stars, and business name. Google post uses your connected Business Profile.
          </p>
        </div>
        <div className="hidden w-[360px] shrink-0 md:block">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Preview canvas</p>
          <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-700 bg-white" style={{ maxHeight: 360 }} />
        </div>
      </div>
    </div>
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, yy)
      line = `${words[n]} `
      yy += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, yy)
}
