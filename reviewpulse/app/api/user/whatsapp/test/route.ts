import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsWhatsApp } from '@/lib/plan-access'
import { isTwilioWhatsAppConfigured } from '@/lib/twilio-config'
import { sendWhatsAppMessage } from '@/lib/twilio-whatsapp'
import User from '@/models/User'

/** Send a one-off test message to the user’s saved WhatsApp number. */
export async function POST() {
  try {
    const user = await requireAuth()
    await connectDB()

    const plan = (user.plan as string) || 'free'
    if (!planAllowsWhatsApp(plan)) {
      return err('WhatsApp alerts require Starter or higher.', 403)
    }

    if (!isTwilioWhatsAppConfigured()) {
      return err('Twilio is not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM).', 503)
    }

    const u = await User.findById(user._id).select('whatsappNumber whatsappAlertsEnabled').lean()
    const num = u?.whatsappNumber?.trim()
    if (!num) {
      return err('Save your WhatsApp number first.', 400)
    }
    if (u?.whatsappAlertsEnabled === false) {
      return err('Turn WhatsApp alerts on before sending a test.', 400)
    }

    const text = `ReviewPulse — test alert ✓

If you received this, Twilio WhatsApp is configured correctly for your workspace.

— ReviewPulse`
    const result = await sendWhatsAppMessage(num, text)
    if (result.error) {
      return err(result.error, 400)
    }

    return ok({ sid: result.sid })
  } catch (error) {
    console.error('POST whatsapp/test failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Test send failed', 500)
  }
}
