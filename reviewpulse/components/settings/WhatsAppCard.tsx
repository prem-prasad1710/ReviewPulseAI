'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function WhatsAppCard() {
  const [number, setNumber] = useState('')
  const [planOk, setPlanOk] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const res = await fetch('/api/user/whatsapp')
      const json = await res.json()
      setNumber(json?.data?.whatsappNumber || '')
      setPlanOk(Boolean(json?.data?.planOk))
      setLoading(false)
    }
    run()
  }, [])

  const save = async () => {
    const res = await fetch('/api/user/whatsapp', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: number.trim() }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json?.error || 'Save failed')
      return
    }
    toast.success('WhatsApp number saved')
    setNumber(json?.data?.whatsappNumber || '')
  }

  if (loading) return null

  return (
    <Card className="border-slate-200/90 p-6 dark:border-slate-700/80 sm:p-7">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <CardTitle className="font-heading text-lg dark:text-slate-100">WhatsApp alerts (Feature 3)</CardTitle>
      </div>
      <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
        Instant alerts for low-star reviews when Twilio is configured. Paid plans only; free tier can preview the UI
        here.
      </CardDescription>

      {!planOk ? (
        <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          Upgrade to Starter or above for WhatsApp delivery.{' '}
          <Link href="/settings" className="font-semibold underline">
            View plans
          </Link>
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">WhatsApp (E.164)</label>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="+919876543210"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
        />
        <p className="text-[11px] text-slate-500">
          Configure <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">TWILIO_*</code> env vars. Max 10
          alerts per user per day.
        </p>
        <Button className="rounded-xl" onClick={save}>
          Save number
        </Button>
      </div>
    </Card>
  )
}
