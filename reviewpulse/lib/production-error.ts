import { err } from '@/lib/api'

/** Logs full error; returns a safe 500 payload in production. */
export function serverErr(context: string, error: unknown, status = 500) {
  console.error(`[${context}]`, error)
  const safe =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : error instanceof Error
        ? error.message
        : 'Unexpected error'
  return err(safe, status)
}
