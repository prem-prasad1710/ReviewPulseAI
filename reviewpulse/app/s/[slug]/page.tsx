'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Q = { id: string; label: string; type: 'text' | 'rating' }

export default function PublicSurveyPage() {
  const params = useParams()
  const slug = String(params?.slug || '')
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Q[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/surveys/${encodeURIComponent(slug)}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j?.error || 'Not found')
        return
      }
      setTitle(j?.data?.survey?.title || 'Survey')
      setQuestions((j?.data?.survey?.questions as Q[]) || [])
    })()
  }, [slug])

  const submit = async () => {
    setErr(null)
    const res = await fetch(`/api/public/surveys/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setErr(j?.error || 'Failed')
    else setDone(true)
  }

  if (err) return <div className="p-8 text-center text-red-600">{err}</div>
  if (done) return <div className="p-8 text-center text-lg font-semibold text-emerald-700">Thank you!</div>

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <div className="mt-6 space-y-4">
        {questions.map((q) => (
          <label key={q.id} className="block text-sm">
            {q.label}
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <Button type="button" className="mt-6 w-full" onClick={() => void submit()}>
        Submit
      </Button>
    </div>
  )
}
