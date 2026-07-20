'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Contact {
  id: string
  name: string
  phone: string // normalised to E.164-ish
  sent: boolean
  skipped: boolean
}

interface CampaignState {
  locationName: string
  reviewLink: string // public review URL
  contacts: Contact[]
  messageTemplate: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`
  return `+${digits}`
}

function buildWaLink(phone: string, message: string): string {
  const encoded = encodeURIComponent(message)
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encoded}`
}

function personalise(template: string, name: string, reviewLink: string): string {
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{review_link\}/g, reviewLink)
}

function parseContacts(raw: string): { name: string; phone: string }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Accepts: "Ramesh, 9876543210" or "Ramesh 9876543210" or "9876543210, Ramesh"
      const parts = line.split(/[,\t]+/).map((p) => p.trim())
      if (parts.length < 2) return null
      const phoneCandidate = parts.find((p) => /\d{7,}/.test(p.replace(/\s/g, '')))
      const nameParts = parts.filter((p) => p !== phoneCandidate)
      if (!phoneCandidate || nameParts.length === 0) return null
      return { name: nameParts.join(' '), phone: normalisePhone(phoneCandidate) }
    })
    .filter((c): c is { name: string; phone: string } => c !== null)
}

const DEFAULT_TEMPLATE = `Hi {name}! 👋

Thank you for visiting us. We'd love to hear your feedback!

Could you spare 1 minute to leave us a Google review? It really helps small businesses like ours grow.

⭐ Leave a review here: {review_link}

Your honest feedback means the world to us. Thank you!`

const STAT_BOX = 'flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60'

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CampaignPage() {
  const { id } = useParams<{ id: string }>()

  const [locationName, setLocationName] = useState('Your business')
  const [reviewLink, setReviewLink] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(true)

  const [rawContacts, setRawContacts] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [parsed, setParsed] = useState(false)
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [sending, setSending] = useState(false)
  const [currentSendIdx, setCurrentSendIdx] = useState<number | null>(null)

  // ── Fetch location details (name + review link) ───────────────────────────
  useEffect(() => {
    if (!id) return
    void (async () => {
      setLoadingLocation(true)
      try {
        const res = await fetch(`/api/locations/${id}`)
        const json = await res.json()
        // API returns ok({ ...location }) so data is at json.data
        const loc = json?.data
        if (loc) {
          setLocationName(loc.name || 'Your business')
          // Build Google review link from Place ID or fall back to Maps search
          const placeId = loc.placeId || loc.googlePlaceId
          if (placeId) {
            setReviewLink(`https://search.google.com/local/writereview?placeid=${placeId}`)
          } else if (loc.mapsUrl) {
            setReviewLink(loc.mapsUrl)
          } else {
            setReviewLink(`https://g.page/${encodeURIComponent(loc.name || '')}`)
          }
        }
      } catch { /* silent */ } finally {
        setLoadingLocation(false)
      }
    })()
  }, [id])

  // ── Parse contacts ────────────────────────────────────────────────────────
  const parseAndSet = useCallback(() => {
    const items = parseContacts(rawContacts)
    setContacts(
      items.map((c, i) => ({
        id: `${i}-${c.phone}`,
        name: c.name,
        phone: c.phone,
        sent: false,
        skipped: false,
      }))
    )
    setParsed(true)
    setStep(2)
  }, [rawContacts])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = contacts.length
    const sent = contacts.filter((c) => c.sent).length
    const skipped = contacts.filter((c) => c.skipped).length
    const remaining = total - sent - skipped
    return { total, sent, skipped, remaining }
  }, [contacts])

  // ── Send one contact ──────────────────────────────────────────────────────
  const openWhatsApp = (idx: number) => {
    const contact = contacts[idx]
    if (!contact || contact.sent || contact.skipped) return
    const message = personalise(messageTemplate, contact.name, reviewLink)
    const url = buildWaLink(contact.phone, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, sent: true } : c))
    )
  }

  // ── Auto-send (sequential with 1.5 s gap) ────────────────────────────────
  const autoSendRef = useRef(false)
  const startAutoSend = async () => {
    setSending(true)
    autoSendRef.current = true
    const pending = contacts
      .map((c, i) => ({ ...c, idx: i }))
      .filter((c) => !c.sent && !c.skipped)

    for (const c of pending) {
      if (!autoSendRef.current) break
      setCurrentSendIdx(c.idx)
      openWhatsApp(c.idx)
      await new Promise((r) => setTimeout(r, 1800))
    }
    setSending(false)
    setCurrentSendIdx(null)
    autoSendRef.current = false
  }

  const stopAutoSend = () => {
    autoSendRef.current = false
    setSending(false)
    setCurrentSendIdx(null)
  }

  const skipContact = (idx: number) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, skipped: true } : c)))
  }

  const resetSent = (idx: number) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, sent: false, skipped: false } : c)))
  }

  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Preview message for first contact ────────────────────────────────────
  const previewMessage = contacts.length > 0
    ? personalise(messageTemplate, contacts[0].name, reviewLink || 'https://g.page/review')
    : personalise(messageTemplate, 'Ramesh', reviewLink || 'https://g.page/review')

  if (loadingLocation) {
    return (
      <div className="flex h-40 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-600 shadow-md shadow-green-200 dark:shadow-green-900/40">
          <Send className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">WhatsApp Campaign Manager</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Send personalised review request messages to customers via WhatsApp Web — no API keys needed.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (s < step || (s === 2 && parsed)) setStep(s) }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                step === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              )}
            >
              {step > s ? '✓' : s}
            </button>
            <span className={cn('text-xs font-medium hidden sm:inline', step === s ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400')}>
              {s === 1 ? 'Add contacts' : s === 2 ? 'Customise message' : 'Send campaign'}
            </span>
            {s < 3 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" /> : null}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Add contacts ──────────────────────────────────────────── */}
      {step === 1 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700/60 dark:bg-slate-900/60">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Paste customer contacts</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              One per line, format: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">Name, PhoneNumber</code> — 10-digit Indian numbers work too.
            </p>
          </div>
          <textarea
            value={rawContacts}
            onChange={(e) => setRawContacts(e.target.value)}
            placeholder={`Ramesh Kumar, 9876543210\nPriya Sharma, 9988776655\nAnil Mehta, +91 98765 43210`}
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          {/* Review link override */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Google Review link (auto-filled from your location)
            </label>
            <input
              type="url"
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
              placeholder="https://g.page/your-business/review"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Find it in Google Maps → Your Business → Share → Copy link
            </p>
          </div>

          <button
            type="button"
            disabled={!rawContacts.trim()}
            onClick={parseAndSet}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            Parse contacts &amp; continue
          </button>
        </div>
      ) : null}

      {/* ── STEP 2: Customise message ─────────────────────────────────────── */}
      {step === 2 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Customise the message</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Use <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{name}'}</code> and{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{review_link}'}</code> — they are replaced per contact.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMessageTemplate(DEFAULT_TEMPLATE)}
              className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reset
            </button>
          </div>

          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={10}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          {/* Preview */}
          <div>
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {previewOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {previewOpen ? 'Hide preview' : 'Preview for first contact'}
            </button>
            {previewOpen ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-[#dcf8c6] px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#1a3a24] dark:text-slate-100">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">WhatsApp Preview</p>
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{previewMessage}</pre>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <MessageSquare className="h-4 w-4" />
              Ready to send ({contacts.length} contacts)
            </button>
          </div>
        </div>
      ) : null}

      {/* ── STEP 3: Send ─────────────────────────────────────────────────── */}
      {step === 3 ? (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <div className={STAT_BOX}>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            </div>
            <div className={STAT_BOX}>
              <p className="text-2xl font-bold text-emerald-600">{stats.sent}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sent</p>
            </div>
            <div className={STAT_BOX}>
              <p className="text-2xl font-bold text-slate-400">{stats.skipped}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Skipped</p>
            </div>
            <div className={STAT_BOX}>
              <p className="text-2xl font-bold text-indigo-600">{stats.remaining}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
            </div>
          </div>

          {/* Auto-send controls */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-send mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Opens WhatsApp Web for each contact with the message pre-filled.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Edit message
                </button>
                {sending ? (
                  <button
                    type="button"
                    onClick={stopAutoSend}
                    className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={stats.remaining === 0}
                    onClick={() => void startAutoSend()}
                    className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Auto-send all
                  </button>
                )}
              </div>
            </div>
            {sending ? (
              <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-200">
                Sending message {(currentSendIdx ?? 0) + 1} of {stats.total} — please keep this tab open.
              </div>
            ) : null}
          </div>

          {/* Contact list */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Contact list</p>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setParsed(false); setContacts([]) }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[32rem] overflow-y-auto">
              {contacts.map((c, idx) => (
                <li
                  key={c.id}
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3 transition-colors',
                    c.sent && 'bg-emerald-50/60 dark:bg-emerald-950/20',
                    c.skipped && 'opacity-50',
                    currentSendIdx === idx && 'bg-indigo-50/70 dark:bg-indigo-950/30'
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      c.sent
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : c.skipped
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    )}>
                      {c.sent ? '✓' : c.skipped ? '—' : String(idx + 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {c.sent ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                        </span>
                        <button
                          type="button"
                          title="Re-open WhatsApp"
                          onClick={() => resetSent(idx)}
                          className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : c.skipped ? (
                      <button
                        type="button"
                        onClick={() => resetSent(idx)}
                        className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Undo skip
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(idx)}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Send
                        </button>
                        <button
                          type="button"
                          onClick={() => skipContact(idx)}
                          className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Done state */}
          {stats.remaining === 0 && stats.total > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Campaign complete!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{stats.sent} messages sent, {stats.skipped} skipped. Reviews should start coming in within 24–48 hours.</p>
              </div>
            </div>
          ) : null}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>WhatsApp policy reminder:</strong> Only message customers who have opted-in or have an existing business relationship. Do not spam. Google also prohibits incentivised reviews — keep messages neutral.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
