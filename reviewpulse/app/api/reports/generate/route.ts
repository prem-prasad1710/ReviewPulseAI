import { z } from 'zod'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generateMonthlyReportForLocation } from '@/lib/reports/generate-monthly-pdf'

const bodySchema = z.object({
  locationId: z.string().min(1),
})

const failMessages: Record<string, string> = {
  not_found: 'Location not found or access denied.',
  rate_limited: 'You can generate one PDF per location per day. Try again tomorrow.',
  cron_already_this_month: 'Report for this month already exists.',
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)

    await connectDB()

    const out = await generateMonthlyReportForLocation(
      new mongoose.Types.ObjectId(parsed.data.locationId),
      user._id as mongoose.Types.ObjectId,
      'manual'
    )

    if (!out.ok) {
      const msg = failMessages[out.code] || 'Could not generate report.'
      const status = out.code === 'not_found' ? 404 : 400
      return err(msg, status)
    }

    if (out.url) {
      return ok({ url: out.url, month: out.monthKey, mode: 'blob' as const })
    }

    const safeName = out.locationName.replace(/[^a-z0-9]+/gi, '-').slice(0, 48) || 'report'
    const filename = `reviewpulse-${out.monthKey}-${safeName}.pdf`
    return new NextResponse(new Uint8Array(out.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-ReviewPulse-Month': out.monthKey,
        'X-ReviewPulse-Mode': 'download',
      },
    })
  } catch (error) {
    console.error('POST reports/generate failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to generate report', 500)
  }
}
