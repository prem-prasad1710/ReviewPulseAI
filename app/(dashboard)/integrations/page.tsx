'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Loc = { _id: string; name?: string }

export default function IntegrationsPage() {
  const [locations, setLocations] = useState<Loc[]>([])
  const [sel, setSel] = useState('')
  const [z, setZ] = useState('disconnected')
  const [g, setG] = useState('disconnected')
  const [j, setJ] = useState('disconnected')

  const [webhookUrl, setWebhookUrl] = useState('')
  const [maskedSecret, setMaskedSecret] = useState<string | null>(null)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [webhookMsg, setWebhookMsg] = useState<string | null>(null)

  const [yelpId, setYelpId] = useState('')
  const [yelpMsg, setYelpMsg] = useState<string | null>(null)

  const [csv, setCsv] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importBusy, setImportBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/locations')
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        const list = (j?.data as Loc[]) || []
        setLocations(list)
        if (list[0]) setSel(String(list[0]._id))
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/user/webhook-settings')
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.data) {
        setWebhookUrl(j.data.partnerWebhookUrl || '')
        setMaskedSecret(j.data.partnerWebhookSecretMasked ?? null)
      }
    })()
  }, [])

  useEffect(() => {
    if (!sel) return
    void (async () => {
      const res = await fetch(`/api/locations/${sel}/v2-settings`)
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.data?.integrations) {
        setZ(j.data.integrations.zomato || 'disconnected')
        setG(j.data.integrations.googleAds || 'disconnected')
        setJ(j.data.integrations.justdial || 'disconnected')
      }
      const mr = await fetch(`/api/locations/${sel}/meta`)
      const mj = await mr.json().catch(() => ({}))
      if (mr.ok && mj?.data) {
        setYelpId((mj.data.yelpBusinessId as string) || '')
      }
    })()
  }, [sel])

  const save = async () => {
    await fetch(`/api/locations/${sel}/v2-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integrations: { zomato: z as 'disconnected', googleAds: g as 'disconnected', justdial: j as 'disconnected' },
      }),
    })
    alert('Connector flags saved.')
  }

  const saveWebhook = async () => {
    setWebhookMsg(null)
    const body: Record<string, string> = {}
    body.partnerWebhookUrl = webhookUrl.trim()
    if (webhookSecret.trim()) body.partnerWebhookSecret = webhookSecret.trim()
    const res = await fetch('/api/user/webhook-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    setWebhookMsg(res.ok ? 'Saved partner webhook.' : j?.error || 'Save failed')
    if (res.ok) {
      setWebhookSecret('')
      setMaskedSecret(j?.data?.partnerWebhookSecretMasked ?? null)
    }
  }

  const clearWebhook = async () => {
    setWebhookMsg(null)
    const res = await fetch('/api/user/webhook-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerWebhookUrl: '', partnerWebhookSecret: '' }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      setWebhookUrl('')
      setWebhookSecret('')
      setMaskedSecret(null)
      setWebhookMsg('Webhook disconnected.')
    } else setWebhookMsg(j?.error || 'Clear failed')
  }

  const saveYelpId = async () => {
    if (!sel) return
    setYelpMsg(null)
    const res = await fetch(`/api/locations/${sel}/meta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yelpBusinessId: yelpId.trim() }),
    })
    const j = await res.json().catch(() => ({}))
    setYelpMsg(res.ok ? 'Yelp ID saved.' : j?.error || 'Save failed')
  }

  const importZomato = async () => {
    if (!sel || !csv.trim()) return
    setImportBusy(true)
    setImportMsg(null)
    try {
      const res = await fetch(`/api/locations/${sel}/integrations/zomato-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })
      const j = await res.json().catch(() => ({}))
      setImportMsg(res.ok ? `Imported ${j?.data?.imported ?? 0} rows.` : j?.error || 'Import failed')
      if (res.ok) {
        setCsv('')
        const s = await fetch(`/api/locations/${sel}/v2-settings`)
        const sj = await s.json().catch(() => ({}))
        if (s.ok && sj?.data?.integrations) {
          setZ(sj.data.integrations.zomato || 'disconnected')
        }
      }
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Connect acquisition channels per the PDF roadmap · Zomato CSV · Yelp Fusion excerpts · Zapier-ready HTTPS
        webhooks.
      </p>
      <label className="mt-6 block text-xs font-semibold uppercase text-slate-500">Outlet</label>
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        value={sel}
        onChange={(e) => setSel(e.target.value)}
      >
        {locations.map((l) => (
          <option key={l._id} value={l._id}>
            {l.name}
          </option>
        ))}
      </select>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Partner webhook (HTTPS + HMAC)</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          We POST JSON for <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">review.new</code> when a GBP review
          is first synced. Headers:{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">X-ReviewPulse-Signature</code>.
        </p>
        <Link href="/developer" className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Rotate API keys here →
        </Link>
        <label className="mt-4 block text-xs font-semibold text-slate-500">Webhook URL</label>
        <input
          type="url"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="https://hooks.zapier.com/…"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <label className="mt-3 block text-xs font-semibold text-slate-500">Signing secret</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Min 12 characters"
          autoComplete="off"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
        />
        {maskedSecret ? (
          <p className="mt-2 text-xs text-slate-500">
            Stored secret (masked): <span className="font-mono">{maskedSecret}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void saveWebhook()}>
            Save webhook
          </Button>
          <Button type="button" variant="outline" onClick={() => void clearWebhook()}>
            Disconnect
          </Button>
        </div>
        {webhookMsg ? <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{webhookMsg}</p> : null}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Yelp Fusion (reviews excerpt)</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Yelp returns up to three excerpts per Fusion call. Paste the business alias from Yelp’s URL{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">businesses/[id]</code>, then probe with{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">GET /api/locations/&lt;id&gt;/yelp-reviews</code>.
        </p>
        <label className="mt-3 block text-xs font-semibold text-slate-500">Yelp Business ID</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="e.g. my-restaurant-city"
          value={yelpId}
          onChange={(e) => setYelpId(e.target.value)}
        />
        <Button className="mt-4" type="button" disabled={!sel} onClick={() => void saveYelpId()}>
          Save Yelp ID for this outlet
        </Button>
        {yelpMsg ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{yelpMsg}</p> : null}
      </div>

      <p className="mt-10 text-xs font-semibold uppercase text-slate-500">Classic connectors</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        E1 Zomato/Swiggy · E2 Google Ads · E3 Justdial/IndiaMart. CSV import mirrors Zomato-style exports.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          Zomato / Swiggy
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={z} onChange={(e) => setZ(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
        <label className="block text-sm">
          Google Ads
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={g} onChange={(e) => setG(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
        <label className="block text-sm">
          Justdial / IndiaMart
          <select className="mt-1 w-full rounded-lg border px-2 py-1 text-sm" value={j} onChange={(e) => setJ(e.target.value)}>
            <option value="disconnected">Disconnected</option>
            <option value="connected_stub">Connected (demo stub)</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>
      </div>
      <Button className="mt-6" type="button" onClick={() => void save()}>
        Save connector flags
      </Button>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Zomato CSV import (E1)</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Growth+ · Paste CSV including header row.
        </p>
        <textarea
          className="mt-3 h-40 w-full rounded-lg border border-slate-200 p-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-900"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Rating,Review,Reviewer,Date&#10;5,Great food,Ravi,2025-01-10"
        />
        <Button className="mt-2" type="button" disabled={importBusy || !csv.trim()} onClick={() => void importZomato()}>
          {importBusy ? 'Importing…' : 'Import CSV'}
        </Button>
        {importMsg ? <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{importMsg}</p> : null}
      </div>
    </div>
  )
}
