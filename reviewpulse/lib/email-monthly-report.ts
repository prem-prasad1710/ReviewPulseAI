import { Resend } from 'resend'

export async function sendMonthlyReportEmail(params: {
  to: string
  locationName: string
  monthKey: string
  pdfBuffer: Buffer
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  if (!key) {
    return { ok: false, error: 'RESEND_API_KEY missing' }
  }

  const resend = new Resend(key)
  const filename = `reviewpulse-report-${params.monthKey}-${params.locationName.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.pdf`

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Your monthly reputation report — ${params.locationName} (${params.monthKey})`,
    html: `<p>Hi,</p><p>Your automated <strong>${params.monthKey}</strong> reputation PDF for <strong>${params.locationName}</strong> is attached.</p><p>— ReviewPulse</p>`,
    attachments: [
      {
        filename,
        content: params.pdfBuffer.toString('base64'),
      },
    ],
  })

  if (error) {
    console.error('sendMonthlyReportEmail:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
