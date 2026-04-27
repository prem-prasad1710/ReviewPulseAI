import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import Location from '@/models/Location'

const bodySchema = z.object({
  locationSlug: z.string().min(2).max(200),
  /** YYYY-MM-DD visit date from landing page. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()
    const loc = await Location.findOne({ locationSlug: parsed.data.locationSlug }).select('_id').lean()
    if (!loc) return err('Not found', 404)

    await Location.updateOne({ _id: loc._id }, { $inc: { bridgeVisits: 1 } })

    return ok({ tracked: true })
  } catch (error) {
    console.error('POST /api/bridge/track failed:', error)
    return err('Track failed', 500)
  }
}
