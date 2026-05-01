import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

const putSchema = z.object({
  reviewRequestAutomation: z
    .object({
      enabled: z.boolean().optional(),
      bodyTemplate: z.string().max(800).optional(),
    })
    .optional(),
  replyAbTest: z
    .object({
      enabled: z.boolean().optional(),
      variantLabelA: z.string().max(80).optional(),
      variantLabelB: z.string().max(80).optional(),
      activeKey: z.enum(['A', 'B']).optional(),
    })
    .optional(),
  integrations: z
    .object({
      zomato: z.enum(['disconnected', 'connected_stub', 'coming_soon']).optional(),
      googleAds: z.enum(['disconnected', 'connected_stub', 'coming_soon']).optional(),
      justdial: z.enum(['disconnected', 'connected_stub', 'coming_soon']).optional(),
    })
    .optional(),
  managedReplyQueue: z.boolean().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params
    const loc = await Location.findOne({ _id: id, userId: user._id })
      .select(
        'reviewRequestAutomation replyAbTest integrations managedReplyQueue reviewRemovalAlertAt highlightReelManifestJson highlightReelGeneratedAt'
      )
      .lean()
    if (!loc) return err('Location not found', 404)
    return ok({ ...loc, viewerPlan: user.plan })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { id } = await params

    const $set: Record<string, unknown> = {}
    if (parsed.data.reviewRequestAutomation !== undefined) {
      $set.reviewRequestAutomation = parsed.data.reviewRequestAutomation
    }
    if (parsed.data.replyAbTest !== undefined) {
      $set.replyAbTest = parsed.data.replyAbTest
    }
    if (parsed.data.integrations !== undefined) {
      $set.integrations = parsed.data.integrations
    }
    if (parsed.data.managedReplyQueue !== undefined) {
      $set.managedReplyQueue = parsed.data.managedReplyQueue
    }

    const loc = await Location.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set },
      { new: true }
    )
      .select(
        'reviewRequestAutomation replyAbTest integrations managedReplyQueue reviewRemovalAlertAt highlightReelManifestJson highlightReelGeneratedAt'
      )
      .lean()
    if (!loc) return err('Location not found', 404)
    return ok({ ...loc, viewerPlan: user.plan })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
