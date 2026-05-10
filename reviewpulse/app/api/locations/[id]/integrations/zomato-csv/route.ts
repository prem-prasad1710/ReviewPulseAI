import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsZomatoCsvImport } from '@/lib/plan-access'
import { parseZomatoReviewCsv } from '@/lib/zomato-csv'
import ImportedReview from '@/models/ImportedReview'
import Location from '@/models/Location'
import mongoose from 'mongoose'

const bodySchema = z.object({
  csv: z.string().min(20).max(2_500_000),
})

/** E1 — import Zomato-style review CSV into `ImportedReview` (does not touch GBP reviews). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsZomatoCsvImport(String(user.plan || ''))) {
      return err('Growth or Scale required for Zomato CSV import.', 403)
    }
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid CSV payload', 400)

    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id })
    if (!location) return err('Location not found', 404)

    let rows
    try {
      rows = parseZomatoReviewCsv(parsed.data.csv)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'CSV parse failed'
      return err(msg, 400)
    }

    const uid = user._id as mongoose.Types.ObjectId
    const locId = location._id as mongoose.Types.ObjectId

    for (const row of rows) {
      await ImportedReview.findOneAndUpdate(
        { locationId: locId, userId: uid, source: 'zomato', externalKey: row.externalKey },
        {
          $set: {
            reviewerName: row.reviewerName,
            rating: row.rating,
            comment: row.comment,
            reviewCreatedAt: row.reviewCreatedAt,
            rawRowHash: row.rawRowHash,
          },
        },
        { upsert: true, new: true }
      )
    }

    const prev = (location.integrations || {}) as { googleAds?: string; justdial?: string }
    location.set('integrations', {
      zomato: 'connected_stub',
      googleAds: prev.googleAds ?? 'disconnected',
      justdial: prev.justdial ?? 'disconnected',
    })
    location.zomatoLastImportAt = new Date()
    location.zomatoImportedCount = (location.zomatoImportedCount || 0) + rows.length
    await location.save()

    return ok({ imported: rows.length })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('Zomato CSV import failed:', e)
    return err('Import failed', 500)
  }
}
