import { z } from 'zod'
import mongoose from 'mongoose'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { getOpenAI, resolveLlmChatModel } from '@/lib/openai'
import Review from '@/models/Review'

const bodySchema = z.object({
  locationId: z.string().optional(),
})

/**
 * Owner Coach — three operational improvements (LLM_CHAT_MODEL / Groq or OpenAI defaults).
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    const match: Record<string, unknown> = { userId: user._id }
    if (parsed.data.locationId && mongoose.Types.ObjectId.isValid(parsed.data.locationId)) {
      match.locationId = new mongoose.Types.ObjectId(parsed.data.locationId)
    }

    const since = new Date(Date.now() - 30 * 86400000)
    const rows = await Review.find({
      ...match,
      reviewCreatedAt: { $gte: since },
      rating: { $lte: 3 },
      comment: { $exists: true, $nin: [null, ''] },
    })
      .sort({ reviewCreatedAt: -1 })
      .limit(40)
      .select('comment rating')
      .lean()

    const snippets = rows
      .map((r) => String((r as { comment?: string }).comment || '').trim())
      .filter((c) => c.length > 8)
      .slice(0, 25)

    if (snippets.length === 0) {
      return ok({
        tips: [
          'No low-star text reviews in the last 30 days — great discipline.',
          'When the next critical review arrives, reply within a few hours to protect walk-ins.',
          'Turn on WhatsApp alerts in Settings so nothing slips on busy nights.',
        ],
      })
    }

    const bundle = snippets.map((c, i) => `[${i + 1}] ${c.slice(0, 220)}`).join('\n')

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: resolveLlmChatModel(),
      temperature: 0.35,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an operational coach for Indian SMBs (restaurants, salons, clinics).
Given short customer complaint excerpts, return JSON: { "tips": string[] } with EXACTLY 3 items.
Each tip: one concrete operational fix (staffing, process, AC, billing queue, packaging, peak hours, training).
Be specific to patterns in the excerpts. Max 140 chars per tip. No markdown.`,
        },
        { role: 'user', content: `Excerpts:\n${bundle}` },
      ],
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    let tips: string[] = []
    try {
      const parsedJson = JSON.parse(raw) as { tips?: unknown }
      if (Array.isArray(parsedJson.tips)) {
        tips = parsedJson.tips.map((t) => String(t).trim()).filter(Boolean).slice(0, 3)
      }
    } catch {
      tips = []
    }
    if (tips.length < 3) {
      tips = [
        'Review mentions suggest tightening peak-hour staffing and handoffs.',
        'Add a visible manager on the floor during rush windows to catch issues early.',
        'Follow up personally on the last 2★ review within 24h — speed signals care.',
      ].slice(0, 3)
    }

    return ok({ tips })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('owner-coach:', e)
    return err('Coach unavailable', 500)
  }
}
