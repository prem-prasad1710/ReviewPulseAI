'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type ClientRow = {
  id: string
  name: string
  email: string
  plan: string
  subscriptionStatus: string
}

export default function AgencyWorkspace({
  initialAgency,
  clients,
}: {
  initialAgency: { name: string; slug: string; inviteToken: string; customDomain?: string } | null
  clients: ClientRow[]
}) {
  const [agency, setAgency] = useState(initialAgency)
  const [name, setName] = useState(initialAgency?.name || '')
  const [busy, setBusy] = useState(false)

  const bootstrap = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/agency/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'My Agency' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Failed')
        return
      }
      const a = json?.data?.agency
      if (a) {
        setAgency({
          name: a.name,
          slug: a.slug,
          inviteToken: a.inviteToken,
          customDomain: a.customDomain,
        })
      }
      toast.success(json?.data?.created ? 'Agency created' : 'Loaded existing agency')
    } finally {
      setBusy(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteUrl = agency ? `${origin}/join/${agency.inviteToken}` : ''

  return (
    <div className="space-y-6">
      {!agency ? (
        <Card className="space-y-3 p-6 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-base dark:text-slate-100">Agency name</CardTitle>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
          />
          <Button className="rounded-xl" disabled={busy} onClick={bootstrap}>
            Create agency &amp; invite token
          </Button>
        </Card>
      ) : (
        <Card className="space-y-2 p-6 dark:border-slate-700 dark:bg-slate-900/60">
          <CardTitle className="text-base dark:text-slate-100">{agency.name}</CardTitle>
          <CardDescription>Slug: {agency.slug}</CardDescription>
          <p className="text-xs text-slate-500">Invite clients with:</p>
          <code className="block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">{inviteUrl}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              void navigator.clipboard.writeText(inviteUrl)
              toast.success('Invite link copied')
            }}
          >
            Copy invite link
          </Button>
        </Card>
      )}

      <Card className="p-0 overflow-hidden dark:border-slate-700 dark:bg-slate-900/60">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <CardTitle className="text-base dark:text-slate-100">Clients</CardTitle>
          <CardDescription>Accounts linked through your invite flow.</CardDescription>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {clients.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-slate-500">No clients yet.</li>
          ) : null}
          {clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                <p className="text-xs text-slate-500">{c.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {c.plan} · {c.subscriptionStatus.replace(/_/g, ' ')}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
