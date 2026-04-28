'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, MessageCircle, RadioTower, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function WhatsAppCard() {
  const [number, setNumber] = useState('')
  const [alertsOn, setAlertsOn] = useState(true)
  const [planOk, setPlanOk] = useState(false)
  const [twilioOk, setTwilioOk] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const load = async () => {
    const res = await fetch('/api/user/whatsapp')
    const json = await res.json()
    setNumber(json?.data?.whatsappNumber || '')
    setAlertsOn(json?.data?.whatsappAlertsEnabled !== false)
    setPlanOk(Boolean(json?.data?.planOk))
    setTwilioOk(Boolean(json?.data?.twilioConfigured))
  }

  useEffect(() => {
    const run = async () => {
      try {
        await load()
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: number.trim(),
          whatsappAlertsEnabled: alertsOn,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Save failed')
        return
      }
      toast.success('WhatsApp settings saved')
      setNumber(json?.data?.whatsappNumber || '')
      setAlertsOn(json?.data?.whatsappAlertsEnabled !== false)
      setTwilioOk(Boolean(json?.data?.twilioConfigured))
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/user/whatsapp/test', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Test failed')
        return
      }
      toast.success('Test message sent — check WhatsApp on your phone.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-slate-200/90 p-6 dark:border-slate-700/80 sm:p-7">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading WhatsApp settings…
        </div>
      </Card>
    )
  }

  const canTest = planOk && twilioOk && alertsOn && /^\+[1-9]\d{6,14}$/.test(number.trim())

  return (
    <Card className="border-slate-200/90 p-6 dark:border-slate-700/80 sm:p-7">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="font-heading text-lg dark:text-slate-100">WhatsApp alerts</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              twilioOk
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
            )}
          >
            {twilioOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            Twilio {twilioOk ? 'ready' : 'incomplete'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              planOk
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            Plan {planOk ? 'OK' : 'Free'}
          </span>
        </div>
      </div>

      <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
        Server-side Twilio WhatsApp: instant pings for <strong>≤2★ reviews</strong> (pending) and{' '}
        <strong>keyword matches</strong> (Growth+). Max 10 WhatsApp alerts per day per account.
      </CardDescription>

      {!planOk ? (
        <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          Upgrade to Starter or above for WhatsApp delivery.{' '}
          <Link href="/subscribe" className="font-semibold underline">
            View plans
          </Link>
        </p>
      ) : null}

      {!twilioOk ? (
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          Set <code className="rounded bg-white px-1 dark:bg-slate-950">TWILIO_ACCOUNT_SID</code>,{' '}
          <code className="rounded bg-white px-1 dark:bg-slate-950">TWILIO_AUTH_TOKEN</code>, and{' '}
          <code className="rounded bg-white px-1 dark:bg-slate-950">TWILIO_WHATSAPP_FROM</code> (sandbox or approved sender,
          e.g. <code className="whitespace-nowrap">whatsapp:+14155238886</code>). Restart the server after changing{' '}
          <code className="rounded bg-white px-1 dark:bg-slate-950">.env</code>.
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950/40">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Enable WhatsApp alerts</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={alertsOn}
            onChange={(e) => setAlertsOn(e.target.checked)}
            disabled={!planOk}
          />
        </label>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your WhatsApp (E.164)
          </label>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+919876543210"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Use the same number you joined the Twilio WhatsApp sandbox with (reply “join …” to the sandbox code).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" disabled={saving || !planOk} onClick={() => void save()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save settings'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={testing || !canTest}
            title={!canTest ? 'Needs valid number, Twilio env, paid plan, and alerts on' : undefined}
            onClick={() => void sendTest()}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send test message
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-[11px] text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
          <p className="flex items-start gap-2">
            <RadioTower className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              In Twilio Console → Messaging → Senders → WhatsApp sandbox, add your callback URL for status updates:{' '}
              <code className="break-all rounded bg-white/80 px-1 dark:bg-slate-900/80">
                https://YOUR_DOMAIN/api/webhooks/twilio
              </code>
              . For signature checks in production, set{' '}
              <code className="whitespace-nowrap rounded bg-white/80 px-1 dark:bg-slate-900/80">
                TWILIO_WEBHOOK_PUBLIC_URL
              </code>{' '}
              to that same origin.
            </span>
          </p>
        </div>
      </div>
    </Card>
  )
}
