import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { isTwilioWhatsAppConfigured } from '@/lib/twilio-config'
import User from '@/models/User'

const putSchema = z.object({
  whatsappNumber: z
    .union([
      z.string().regex(/^\+[1-9]\d{6,14}$/, 'Use E.164 format, e.g. +919876543210'),
      z.literal(''),
    ])
    .optional(),
  whatsappAlertsEnabled: z.boolean().optional(),
})

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.flatten().formErrors.join(', ') || 'Invalid input', 400)

    await connectDB()

    const $set: Record<string, unknown> = {}
    if (parsed.data.whatsappNumber !== undefined) {
      $set.whatsappNumber = parsed.data.whatsappNumber || undefined
    }
    if (parsed.data.whatsappAlertsEnabled !== undefined) {
      $set.whatsappAlertsEnabled = parsed.data.whatsappAlertsEnabled
    }
    if (Object.keys($set).length === 0) {
      return err('Nothing to update', 400)
    }

    const updated = await User.findByIdAndUpdate(user._id, { $set }, { new: true })
      .select('whatsappNumber whatsappAlertsEnabled plan')
      .lean()

    return ok({
      whatsappNumber: updated?.whatsappNumber ?? '',
      whatsappAlertsEnabled: updated?.whatsappAlertsEnabled !== false,
      planOk: planAllowsWhatsApp((updated?.plan as string) || 'free'),
      twilioConfigured: isTwilioWhatsAppConfigured(),
    })
  } catch (error) {
    console.error('PUT whatsapp failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const u = await User.findById(user._id).select('whatsappNumber whatsappAlertsEnabled plan').lean()
    return ok({
      whatsappNumber: u?.whatsappNumber ?? '',
      whatsappAlertsEnabled: u?.whatsappAlertsEnabled !== false,
      planOk: planAllowsWhatsApp((u?.plan as string) || 'free'),
      twilioConfigured: isTwilioWhatsAppConfigured(),
    })
  } catch (error) {
    console.error('GET whatsapp failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}
