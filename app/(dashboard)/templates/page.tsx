'use client'

import { useMemo, useState } from 'react'
import { BookOpen, Copy, Check, Search, Star } from 'lucide-react'
import { REPLY_TEMPLATE_STORE, type ReplyTemplateItem } from '@/lib/reply-template-store'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'Positive', 'Mixed', 'Negative', 'Food', 'Service', 'Delivery', 'Hindi', 'Hinglish', 'Compliance'] as const
type CategoryFilter = (typeof CATEGORIES)[number]

const RATING_FILTERS = [
  { label: 'All ratings', value: 0 },
  { label: '5★ only', value: 5 },
  { label: '4–5★', value: 4 },
  { label: '3★', value: 3 },
  { label: '1–2★', value: 2 },
] as const

function categoryColor(cat: string): string {
  switch (cat) {
    case 'Positive': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    case 'Negative': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
    case 'Mixed': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    case 'Hindi':
    case 'Hinglish': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
    case 'Compliance': return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
    default: return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
  }
}

function TemplateCard({ t, onCopy, copied }: { t: ReplyTemplateItem; onCopy: (id: string, body: string) => void; copied: string | null }) {
  const isCopied = copied === t.id
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', categoryColor(t.category))}>
            {t.category}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn('h-3 w-3', i < t.minRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700')}
              />
            ))}
            <span className="ml-1 text-[10px]">{t.minRating === t.maxRating ? `${t.minRating}★` : `${t.minRating}–${t.maxRating}★`}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onCopy(t.id, t.body)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
            isCopied
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400'
          )}
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t.body}</p>
      {t.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {t.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function TemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [search, setSearch] = useState('')

  const copy = async (id: string, body: string) => {
    await navigator.clipboard.writeText(body)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = useMemo(() => {
    return REPLY_TEMPLATE_STORE.filter((t) => {
      if (category !== 'All' && t.category !== category) return false
      if (ratingFilter > 0) {
        // 2 → show templates that cover 1–2★ range; 3 → 3★; 4 → 4–5★; 5 → 5★ only
        if (ratingFilter === 2 && t.maxRating > 2) return false
        if (ratingFilter === 3 && (t.minRating > 3 || t.maxRating < 3)) return false
        if (ratingFilter === 4 && t.maxRating < 4) return false
        if (ratingFilter === 5 && t.minRating < 5) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
        )
      }
      return true
    })
  }, [category, ratingFilter, search])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reply Template Library</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {REPLY_TEMPLATE_STORE.length} professionally crafted templates — filter by rating or language, copy and paste into any review platform.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
          />
        </div>
        {/* Rating filter */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-500"
        >
          {RATING_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              category === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No templates match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <TemplateCard key={t.id} t={t} onCopy={copy} copied={copied} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 dark:text-slate-600">
        {filtered.length} of {REPLY_TEMPLATE_STORE.length} templates shown
      </p>
    </div>
  )
}
