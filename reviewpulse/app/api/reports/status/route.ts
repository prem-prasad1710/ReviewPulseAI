import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'

/** Lets the reports UI show whether PDFs will be stored on Vercel Blob. */
export async function GET() {
  try {
    await requireAuth()
    const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
    return ok({ blobConfigured })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('GET reports/status failed:', error)
    return err('Failed to load status', 500)
  }
}
