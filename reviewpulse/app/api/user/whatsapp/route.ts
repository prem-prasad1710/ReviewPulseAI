import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import User from '@/models/User'

const putSchema = z.object({
  whatsappNumber: z.union([
    z.string().regex(/^\+[1-9]\d{6,14}$/, 'Use E.164 format, e.g. +919876543210'),
    z.literal(''),
  ]),
})

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.flatten().formErrors.join(', ') || 'Invalid input', 400)

    await connectDB()
    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          whatsappNumber: parsed.data.whatsappNumber || undefined,
        },
      },
      { new: true }
    )
      .select('whatsappNumber plan')
      .lean()

    return ok({
      whatsappNumber: updated?.whatsappNumber ?? '',
      planOk: planAllowsWhatsApp((updated?.plan as string) || 'free'),
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
    const u = await User.findById(user._id).select('whatsappNumber plan').lean()
    return ok({
      whatsappNumber: u?.whatsappNumber ?? '',
      planOk: planAllowsWhatsApp((u?.plan as string) || 'free'),
    })
  } catch (error) {
    console.error('GET whatsapp failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}
