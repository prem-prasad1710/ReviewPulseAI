import { err, ok } from '@/lib/api'
import { sendMorningBriefingToAllUsers } from '@/lib/morning-briefing'

/** Vercel Cron uses GET; POST kept for manual / local testing. */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }

    const result = await sendMorningBriefingToAllUsers()
    return ok(result)
  } catch (error) {
    console.error('Morning briefing cron failed:', error)
    return err('Cron failed', 500)
  }
}
