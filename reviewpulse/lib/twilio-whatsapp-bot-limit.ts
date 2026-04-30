import type { Types } from 'mongoose'
import User from '@/models/User'

const MAX_BOT_INTERACTIONS_PER_DAY = 50

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** B1 — consume one WhatsApp digest-bot slot (50/day per user, UTC). */
export async function tryConsumeWhatsAppBotSlot(userId: Types.ObjectId): Promise<boolean> {
  const day = utcDayKey(new Date())
  const u = await User.findById(userId).select('whatsappBotDayKey whatsappBotInteractions').lean()
  if (!u) return false
  const key = u.whatsappBotDayKey
  const n = u.whatsappBotInteractions ?? 0
  if (key !== day) {
    await User.findByIdAndUpdate(userId, {
      $set: { whatsappBotDayKey: day, whatsappBotInteractions: 1 },
    })
    return true
  }
  if (n >= MAX_BOT_INTERACTIONS_PER_DAY) return false
  await User.findByIdAndUpdate(userId, { $inc: { whatsappBotInteractions: 1 } })
  return true
}
