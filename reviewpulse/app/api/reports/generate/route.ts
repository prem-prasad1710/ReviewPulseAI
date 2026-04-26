import { z } from 'zod'
import mongoose from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generateMonthlyReportForLocation } from '@/lib/reports/generate-monthly-pdf'

const bodySchema = z.object({
  locationId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    const result = await generateMonthlyReportForLocation(
      new mongoose.Types.ObjectId(parsed.data.locationId),
      user._id as mongoose.Types.ObjectId,
      'manual'
    )

    if (!result) {
      return err('Could not generate report (rate limit, missing Blob token, or location not found).', 400)
    }

    return ok({ url: result.url, month: result.monthKey })
  } catch (error) {
    console.error('POST reports/generate failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to generate report', 500)
  }
}
