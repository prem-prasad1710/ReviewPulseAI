import type { Types } from 'mongoose'
import { extractMenuInsightsFromBatch } from '@/lib/openai'
import {
  menuInsightModeForCategory,
  normalizeMenuItemName,
  type MenuInsightMode,
} from '@/lib/menu-insight-helpers'
import Location from '@/models/Location'
import Review from '@/models/Review'

function mergeItems(
  acc: Map<string, { name: string; positiveCount: number; negativeCount: number; sampleQuote: string }>,
  batch: Array<{ name: string; positiveCount: number; negativeCount: number; sampleQuote: string }>
) {
  for (const row of batch) {
    const key = normalizeMenuItemName(row.name)
    if (!key) continue
    const existing = acc.get(key)
    if (!existing) {
      acc.set(key, {
        name: row.name.trim(),
        positiveCount: row.positiveCount,
        negativeCount: row.negativeCount,
        sampleQuote: row.sampleQuote,
      })
    } else {
      existing.positiveCount += row.positiveCount
      existing.negativeCount += row.negativeCount
      if (!existing.sampleQuote && row.sampleQuote) existing.sampleQuote = row.sampleQuote
    }
  }
}

export async function runMenuInsightsForLocation(locationId: Types.ObjectId): Promise<void> {
  const location = await Location.findById(locationId).lean()
  if (!location) return

  const mode: MenuInsightMode = menuInsightModeForCategory(location.category)
  const consultantLabel = mode === 'service' ? 'salon' : 'restaurant'
  const itemLabel = mode === 'service' ? 'service' : 'food item'

  const reviews = await Review.find({ locationId })
    .select('comment')
    .limit(500)
    .lean()

  const texts = reviews.map((r) => (r.comment || '').trim()).filter(Boolean)
  if (texts.length === 0) {
    await Location.findByIdAndUpdate(locationId, {
      $set: { menuInsights: { items: [], lastRunAt: new Date() } },
    })
    return
  }

  const acc = new Map<
    string,
    { name: string; positiveCount: number; negativeCount: number; sampleQuote: string }
  >()

  const batchSize = 50
  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize)
    const reviewsBatch = chunk.map((t, j) => `${j + 1}. ${t}`).join('\n')
    const batch = await extractMenuInsightsFromBatch({
      consultantLabel,
      itemLabel,
      reviewsBatch,
    })
    mergeItems(acc, batch)
  }

  const items = Array.from(acc.values()).sort(
    (a, b) => b.positiveCount + b.negativeCount - (a.positiveCount + a.negativeCount)
  )

  await Location.findByIdAndUpdate(locationId, {
    $set: {
      menuInsights: {
        items,
        lastRunAt: new Date(),
      },
    },
  })
}
