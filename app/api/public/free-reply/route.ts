import { z } from 'zod'
import { NextResponse } from 'next/server'
import { err, ok } from '@/lib/api'
import { clientIp } from '@/lib/client-ip'
import { generatePublicFreeReply } from '@/lib/public-free-reply'
import { checkPublicFreeReplyLimit, markPublicFreeReplyUsed } from '@/lib/public-free-reply-limit'

const bodySchema = z.object({
  reviewText: z.string().min(10).max(4000),
  rating: z.number().int().min(1).max(5),
  businessName: z.string().max(120).optional(),
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
})

/** Acquisition — paste a review, get one professional reply (no login). */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request)
    let limit: Awaited<ReturnType<typeof checkPublicFreeReplyLimit>>
    try {
      limit = await checkPublicFreeReplyLimit(ip)
    } catch (e) {
      if (e instanceof Error && e.message === 'FREE_REPLY_REDIS_REQUIRED') {
        return err(
          'Preview is unavailable: configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for rate limits.',
          503
        )
      }
      throw e
    }

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === 'used'
              ? 'You have used your free preview. Sign in to unlock the full inbox and AI replies.'
              : 'Free preview limit reached. Sign in to continue.',
          code: 'FREE_REPLY_LIMIT',
          redirectTo: limit.redirectTo,
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Paste a review (10+ characters) and pick a star rating.', 400)

    const reply = await generatePublicFreeReply(parsed.data)
    if (!reply || reply.length < 40) {
      return err('Could not generate a reply. Try shorter text or different wording.', 500)
    }

    await markPublicFreeReplyUsed()

    return ok({ reply })
  } catch (e) {
    console.error('public/free-reply:', e)
    if (
      e instanceof Error &&
      (e.message.includes('GROQ_API_KEY') ||
        e.message.includes('OPENAI_API_KEY') ||
        e.message.includes('AI features') ||
        e.message.includes('Set GROQ'))
    ) {
      return err('AI preview is temporarily unavailable.', 503)
    }
    return err('Something went wrong.', 500)
  }
}

export function GET() {
  return NextResponse.json({
    name: 'ReviewPulse free reply preview',
    usage: 'POST JSON { reviewText, rating, businessName?, language? } — one free try per visitor',
  })
}
