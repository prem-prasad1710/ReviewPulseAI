'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ReplyModal({
  reviewId,
  open,
  onClose,
}: {
  reviewId: string | null
  open: boolean
  onClose: () => void
}) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open || !reviewId) return null

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, language: 'english', tone: 'professional' }),
      })
      const json = await res.json()
      setReply(json?.data?.reply || '')
    } finally {
      setLoading(false)
    }
  }

  const publish = async () => {
    setLoading(true)
    try {
      await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: reply }),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">AI Reply Assistant</h3>
          <button className="text-slate-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-3">
          <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Generated reply will appear here" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            <Button onClick={publish} variant="secondary" disabled={loading || reply.length < 20}>
              Publish Reply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
