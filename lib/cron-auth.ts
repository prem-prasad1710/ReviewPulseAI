import { err } from '@/lib/api'

/** Validates `Authorization: Bearer $CRON_SECRET` — returns error response or null if OK. */
export function verifyCronRequest(request: Request): Response | null {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return err('Cron not configured', 503)
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return err('Unauthorized', 401)
  }

  return null
}
