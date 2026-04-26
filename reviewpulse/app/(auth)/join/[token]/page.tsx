'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export default function JoinAgencyPage() {
  const params = useParams()
  const router = useRouter()
  const token = String(params.token)
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/agency/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteToken: token }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Could not join')
        return
      }
      toast.success(`Joined ${json?.data?.name || 'agency'}`)
      router.push('/dashboard')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <Card className="p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
        <CardTitle className="text-xl dark:text-slate-50">Join agency workspace</CardTitle>
        <CardDescription className="mt-2">
          You must be signed in. This links your account to the agency that invited you.
        </CardDescription>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="rounded-xl" disabled={busy} onClick={join}>
            {busy ? 'Joining…' : 'Accept invite'}
          </Button>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Sign in first
          </Link>
        </div>
      </Card>
    </div>
  )
}
