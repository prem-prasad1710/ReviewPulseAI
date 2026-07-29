import { err, ok } from '@/lib/api'
import { verifyCronRequest } from '@/lib/cron-auth'
import { sendMorningBriefingToAllUsers } from '@/lib/morning-briefing'

/** Vercel Cron uses GET; POST kept for manual / local testing. */
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    const denied = verifyCronRequest(request)
    if (denied) return denied

    const result = await sendMorningBriefingToAllUsers()
    return ok(result)
  } catch (error) {
    console.error('Morning briefing cron failed:', error)
    return err('Cron failed', 500)
  }
}
