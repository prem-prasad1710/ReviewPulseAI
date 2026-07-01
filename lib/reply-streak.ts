/**
 * Reply streak = consecutive IST calendar days where at least one review was replied to.
 * Computed from the Review collection — no extra field needed on User.
 */

import Review from '@/models/Review'

/** Convert any Date to an "YYYY-MM-DD" string in IST (UTC+5:30) */
export function toISTDateKey(d: Date): string {
  const ist = new Date(d.getTime() + 5.5 * 3600_000)
  return ist.toISOString().slice(0, 10)
}

export type ReplyStreakResult = {
  currentStreak: number   // consecutive days ending today (or yesterday if today has no reply yet)
  bestStreak: number      // longest streak in the last 90 days
  lastReplyDate?: string  // "YYYY-MM-DD" IST of most recent reply
  todayReplied: boolean   // whether at least one reply was made today (IST)
}

export async function computeReplyStreak(userId: string): Promise<ReplyStreakResult> {
  const since = new Date(Date.now() - 90 * 86400_000)

  const replied = await Review.find({
    userId,
    status: 'replied',
    updatedAt: { $gte: since },
  })
    .select('updatedAt repliedAt')
    .lean()

  if (replied.length === 0) {
    return { currentStreak: 0, bestStreak: 0, todayReplied: false }
  }

  // Build a Set of IST date keys where at least one reply was made
  const replyDays = new Set<string>()
  for (const r of replied) {
    const d = r.repliedAt ? new Date(r.repliedAt) : new Date(r.updatedAt)
    replyDays.add(toISTDateKey(d))
  }

  const today = toISTDateKey(new Date())
  const todayReplied = replyDays.has(today)
  const lastReplyDate = Array.from(replyDays).sort().reverse()[0]

  // Compute current streak going backwards from today
  let currentStreak = 0
  {
    const startDay = todayReplied ? today : toISTDateKey(new Date(Date.now() - 86400_000))
    let cursor = new Date(startDay + 'T00:00:00+05:30')
    while (true) {
      const key = toISTDateKey(cursor)
      if (!replyDays.has(key)) break
      currentStreak++
      cursor = new Date(cursor.getTime() - 86400_000)
    }
  }

  // Compute best streak over the 90-day window
  let bestStreak = 0
  let run = 0
  const sortedDays = Array.from(replyDays).sort()
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sortedDays[i - 1] + 'T12:00:00Z')
      const curr = new Date(sortedDays[i] + 'T12:00:00Z')
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400_000)
      if (diffDays === 1) {
        run++
      } else {
        bestStreak = Math.max(bestStreak, run)
        run = 1
      }
    }
  }
  bestStreak = Math.max(bestStreak, run)

  return { currentStreak, bestStreak, lastReplyDate, todayReplied }
}
