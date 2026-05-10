'use client'

import { REPLY_TEMPLATE_STORE } from '@/lib/reply-template-store'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function TemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (id: string, body: string) => {
    await navigator.clipboard.writeText(body)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Reply template store</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">H3 — bundled snippets (copy into GBP or AI inbox).</p>
      <ul className="mt-6 space-y-4">
        {REPLY_TEMPLATE_STORE.map((t) => (
          <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
            <p className="text-xs font-semibold uppercase text-indigo-600">{t.category}</p>
            <p className="font-semibold">{t.title}</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{t.body}</p>
            <Button type="button" variant="secondary" className="mt-2" onClick={() => void copy(t.id, t.body)}>
              {copied === t.id ? 'Copied' : 'Copy'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
