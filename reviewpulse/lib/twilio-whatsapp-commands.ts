import type { Types } from 'mongoose'
import Location from '@/models/Location'
import Review from '@/models/Review'

function appBase(): string {
  return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
}

/** B1 — WhatsApp digest bot responses (plain text, WhatsApp *bold*). Max ~900 chars. */
export async function handleWhatsAppDigestCommand(userId: Types.ObjectId, raw: string): Promise<string> {
  const cmd = raw.trim().toLowerCase()
  const base = appBase()

  if (!cmd || cmd === 'help' || cmd === '?' || cmd === 'hi' || cmd === 'hello') {
    return (
      `*ReviewPulse*\n` +
      `Commands:\n` +
      `• *pending* — top 5 unanswered reviews\n` +
      `• *stats* — today’s review count & avg ★\n` +
      `• *worst* / *best* — this week’s extremes\n` +
      `• *score* — overall avg & total reviews\n` +
      `• *help* — this menu\n\n` +
      `Full inbox: ${base}/reviews\n` +
      `_Reply STOP to unsubscribe_`
    ).slice(0, 1000)
  }

  if (cmd === 'score') {
    const agg = await Review.aggregate<{ n: number; avg: number }>([
      { $match: { userId } },
      { $group: { _id: null, n: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ])
    const row = agg[0]
    if (!row?.n) return `No reviews synced yet. Connect Google: ${base}/locations`
    return `*Reputation*\nAvg ${(row.avg || 0).toFixed(2)}★ across ${row.n} reviews.\n${base}/dashboard`.slice(0, 1000)
  }

  if (cmd === 'stats') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const agg = await Review.aggregate<{ n: number; avg: number }>([
      { $match: { userId, reviewCreatedAt: { $gte: start } } },
      { $group: { _id: null, n: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ])
    const row = agg[0]
    if (!row?.n) return `No reviews yet today (IST midnight–now).\n${base}/reviews`
    return `*Today*\n${row.n} review(s) · avg ${(row.avg || 0).toFixed(2)}★\n${base}/reviews`.slice(0, 1000)
  }

  if (cmd === 'pending') {
    const list = await Review.find({ userId, status: { $in: ['pending', 'scheduled'] } })
      .sort({ reviewCreatedAt: -1 })
      .limit(5)
      .select('rating comment locationId reviewCreatedAt')
      .lean()
    if (!list.length) return `*Inbox clear* — no pending reviews.\n${base}/reviews`

    const locIds = [...new Set(list.map((r) => String(r.locationId)))]
    const locs = await Location.find({ _id: { $in: locIds } })
      .select('name')
      .lean()
    const nameById = new Map(locs.map((l) => [String(l._id), (l as { name: string }).name]))

    let out = '*Pending (top 5)*\n'
    list.forEach((r, i) => {
      const name = nameById.get(String(r.locationId)) || 'Outlet'
      const snippet = (r.comment || '(no text)').slice(0, 72).replace(/\n/g, ' ')
      out += `${i + 1}. ${r.rating}★ ${name} — ${snippet}\n`
    })
    out += `\nOpen: ${base}/reviews`
    return out.slice(0, 1000)
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000)

  if (cmd === 'worst') {
    const r = await Review.findOne({ userId, reviewCreatedAt: { $gte: weekAgo } })
      .sort({ rating: 1, reviewCreatedAt: -1 })
      .select('rating comment reviewerName')
      .lean()
    if (!r) return `No reviews in the last 7 days.\n${base}/reviews`
    return (
      `*Lowest this week*\n${r.rating}★ — ${r.reviewerName}\n"${(r.comment || '').slice(0, 220)}"\n\n${base}/reviews`
    ).slice(0, 1000)
  }

  if (cmd === 'best') {
    const r = await Review.findOne({ userId, reviewCreatedAt: { $gte: weekAgo } })
      .sort({ rating: -1, reviewCreatedAt: -1 })
      .select('rating comment reviewerName')
      .lean()
    if (!r) return `No reviews in the last 7 days.\n${base}/reviews`
    return (
      `*Highest this week*\n${r.rating}★ — ${r.reviewerName}\n"${(r.comment || '').slice(0, 220)}"\n\n${base}/reviews`
    ).slice(0, 1000)
  }

  if (cmd.startsWith('reply')) {
    return (
      `*AI reply*\nUse the web inbox to draft & publish (GBP rules).\n${base}/reviews\n\n_Text commands like "reply 3" coming soon._`
    ).slice(0, 1000)
  }

  return `Unknown command. Send *help* for options.\n${base}/reviews`.slice(0, 1000)
}
