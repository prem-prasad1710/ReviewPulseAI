import { render } from '@react-email/render'
import { Resend } from 'resend'
import WeeklyDigest from '@/emails/WeeklyDigest'

export async function sendWeeklyDigestEmail(params: {
  to: string
  businessName: string
  totalReviews: number
  avgRatingThisWeek: number
  avgRatingLastWeek: number
  positive: number
  neutral: number
  negative: number
  topUnanswered: { reviewerName: string; rating: number; comment?: string }[]
  dashboardUrl: string
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  if (!key) return { ok: false, error: 'RESEND_API_KEY missing' }

  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const html = await render(
    WeeklyDigest({
      ...params,
      unsubscribeUrl: `${base}/settings`,
    })
  )

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `📊 Weekly review pulse — ${params.businessName}`,
    html,
  })

  if (error) {
    console.error('sendWeeklyDigestEmail:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
