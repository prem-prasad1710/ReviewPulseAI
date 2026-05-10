import { z } from 'zod'
import { NextResponse } from 'next/server'
import { err, ok } from '@/lib/api'
import { publicFreeReplyLimiter } from '@/lib/rate-limit'
import { generatePublicFreeReply } from '@/lib/public-free-reply'

const bodySchema = z.object({
  reviewText: z.string().min(10).max(4000),
  rating: z.number().int().min(1).max(5),
  businessName: z.string().max(120).optional(),
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
})

function clientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (xf) return xf.slice(0, 64)
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  return 'unknown'
}

/** Acquisition — paste a review, get a professional reply (no login). Rate-limited when Redis is configured. */
export async function POST(request: Request) {
  try {
    if (publicFreeReplyLimiter) {
      const ip = clientIp(request)
      const { success } = await publicFreeReplyLimiter.limit(`free-reply:${ip}`)
      if (!success) {
        return err('Too many tries this hour. Create a free account for full inbox.', 429)
      }
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Paste a review (10+ characters) and pick a star rating.', 400)

    const reply = await generatePublicFreeReply(parsed.data)
    if (!reply || reply.length < 40) {
      return err('Could not generate a reply. Try shorter text or different wording.', 500)
    }

    return ok({ reply })
  } catch (e) {
    console.error('public/free-reply:', e)
    if (e instanceof Error && e.message.includes('OPENAI_API_KEY')) {
      return err('AI preview is temporarily unavailable.', 503)
    }
    return err('Something went wrong.', 500)
  }
}

export function GET() {
  return NextResponse.json({
    name: 'ReviewPulse free reply preview',
    usage: 'POST JSON { reviewText, rating, businessName?, language? }',
  })
}
