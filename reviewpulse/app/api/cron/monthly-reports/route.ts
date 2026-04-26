import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import { sendMonthlyReportEmail } from '@/lib/email-monthly-report'
import { generateMonthlyReportForLocation } from '@/lib/reports/generate-monthly-pdf'
import Location from '@/models/Location'
import User from '@/models/User'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return err('Unauthorized', 401)
    }

    await connectDB()

    const scaleUsers = await User.find({ plan: 'scale' }).select('_id email').lean()
    let generated = 0
    let emailed = 0
    const errors: string[] = []

    for (const u of scaleUsers) {
      const locations = await Location.find({ userId: u._id, isActive: true }).select('_id').lean()
      for (const loc of locations) {
        try {
          const result = await generateMonthlyReportForLocation(loc._id, u._id, 'cron')
          if (!result) continue
          generated += 1
          if (u.email) {
            const send = await sendMonthlyReportEmail({
              to: u.email,
              locationName: result.locationName,
              monthKey: result.monthKey,
              pdfBuffer: result.pdfBuffer,
            })
            if (send.ok) emailed += 1
            else if (send.error) errors.push(`${u.email}: ${send.error}`)
          }
        } catch (e) {
          errors.push(String((e as Error).message))
        }
      }
    }

    return ok({
      scaleUsers: scaleUsers.length,
      reportsGenerated: generated,
      emailsSent: emailed,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    console.error('POST monthly-reports failed:', error)
    return err('Cron failed', 500)
  }
}
