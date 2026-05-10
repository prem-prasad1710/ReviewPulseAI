'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { V2_FEATURE_CARDS } from '@/lib/v2-registry'

type Loc = { _id: string; name?: string }

export default function V2OverviewPage() {
  const [locations, setLocations] = useState<Loc[]>([])

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/locations')
      const j = await res.json().catch(() => ({}))
      if (res.ok) setLocations((j?.data as Loc[]) || [])
    })()
  }, [])

  const first = locations[0]?._id

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">v2 feature hub</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Bundled roadmap surface. Deep tools open under each outlet (
        {first ? (
          <Link href={`/locations/${first}/v2-lab`} className="font-semibold text-indigo-600 underline">
            v2 lab
          </Link>
        ) : (
          <Link href="/locations" className="font-semibold text-indigo-600 underline">
            add a location
          </Link>
        )}
        ). B4 interactive WhatsApp buttons require a Twilio Content template approved in Meta Business.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {V2_FEATURE_CARDS.map((f) => {
          const href =
            f.scope === 'workspace' || !first
              ? f.href
              : f.href === '/locations'
                ? `/locations/${first}/v2-lab`
                : f.href
          return (
            <li
              key={f.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">{f.id}</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{f.title}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{f.blurb}</p>
              <Link href={href} className="mt-2 inline-block text-xs font-semibold text-indigo-600 underline">
                Open
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
