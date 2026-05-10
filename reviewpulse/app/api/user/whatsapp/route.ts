import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { normalizeWhatsAppInput } from '@/lib/phone-e164'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { isTwilioWhatsAppConfigured } from '@/lib/twilio-config'
import User from '@/models/User'

const e164OrEmpty = z.union([
  z.literal(''),
  z.string().regex(/^\+[1-9]\d{6,14}$/, 'Use a valid mobile: 10-digit Indian number or +country…'),
])

const putSchema = z.object({
  whatsappNumber: z
    .string()
    .optional()
    .transform((s) => (s === undefined ? undefined : normalizeWhatsAppInput(s)))
    .pipe(e164OrEmpty.optional()),
  whatsappAlertsEnabled: z.boolean().optional(),
})

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.flatten().formErrors.join(', ') || 'Invalid input', 400)

    await connectDB()

    const plan = (user.plan as string) || 'free'

    const $set: Record<string, unknown> = {}
    if (parsed.data.whatsappNumber !== undefined) {
      $set.whatsappNumber = parsed.data.whatsappNumber || undefined
    }
    if (parsed.data.whatsappAlertsEnabled !== undefined) {
      const wantOn = parsed.data.whatsappAlertsEnabled
      $set.whatsappAlertsEnabled = wantOn && !planAllowsWhatsApp(plan) ? false : wantOn
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
