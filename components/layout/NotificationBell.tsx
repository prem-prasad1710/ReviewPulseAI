'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellRing, CheckCheck, AlertTriangle, TrendingUp, Star, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

type NotifType = 'new_review' | 'crisis_alert' | 'velocity_spike' | 'streak_risk' | 'recovery_urgent' | 'health_drop'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  linkHref: string
  createdAt: string
}

function typeIcon(type: NotifType) {
  switch (type) {
    case 'crisis_alert':
    case 'recovery_urgent':
      return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
    case 'velocity_spike':
      return <TrendingUp className="h-4 w-4 text-amber-500 shrink-0" />
    case 'new_review':
      return <Star className="h-4 w-4 text-indigo-500 shrink-0" />
    case 'streak_risk':
      return <Activity className="h-4 w-4 text-orange-500 shrink-0" />
    default:
      return <Bell className="h-4 w-4 text-slate-400 shrink-0" />
  }
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [marking, setMarking] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const json = await res.json()
      setNotifs(json.data?.notifications ?? [])
      setUnread(json.data?.unreadCount ?? 0)
    } catch { /* silent */ }
  }, [])

  // Poll every 60 s
  useEffect(() => {
    void fetchNotifs()
    const id = setInterval(() => void fetchNotifs(), 60_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAll = async () => {
    if (marking) return
    setMarking(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } finally {
      setMarking(false)
    }
  }

  const markOne = async (id: string, href: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
    setOpen(false)
    router.push(href)
  }

  const BellIcon = unread > 0 ? BellRing : Bell

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
          open
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-400 dark:hover:bg-slate-800'
        )}
      >
        <BellIcon className={cn('h-4 w-4', unread > 0 && 'animate-[ring_2s_ease-in-out_infinite]')} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[200] mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/30">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAll()}
                disabled={marking}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            ) : null}
          </div>

          {/* List */}
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifs.length === 0 ? (
              <li className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">You&apos;re all caught up!</p>
              </li>
            ) : (
              notifs.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void markOne(n.id, n.linkHref)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      !n.read && 'bg-indigo-50/60 dark:bg-indigo-950/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcon(n.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-xs font-semibold truncate', n.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100')}>
                            {n.title}
                          </p>
                          {!n.read ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.body}</p>
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{relTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
