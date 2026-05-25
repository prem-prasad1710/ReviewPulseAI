import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

function maskSecret(s: string | undefined): string | null {
  if (!s || s.length < 8) return s ? '••••••••' : null
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((u) => u.startsWith('https://'), 'Webhook URL must use https://')

const patchSchema = z.object({
  partnerWebhookUrl: z.union([z.literal(''), httpsUrl]).optional(),
  partnerWebhookSecret: z.union([z.literal(''), z.string().trim().min(12).max(256)]).optional(),
})

/** Optional HTTPS outbound webhook — PDF partner / Zapier integration. Signed with HMAC-SHA256 body digest in `X-ReviewPulse-Signature`. */
export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    const u = await User.findById(user._id).select('+partnerWebhookSecret partnerWebhookUrl').lean()
    if (!u) return err('User not found', 404)
    return ok({
      partnerWebhookUrl: u.partnerWebhookUrl || '',
      partnerWebhookSecretMasked: maskSecret(u.partnerWebhookSecret),
      signatureHeader: 'X-ReviewPulse-Signature',
    })
  } catch (error) {
    console.error('GET webhook-settings failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to load', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    if (Object.keys(parsed.data).length === 0) return err('No fields to update', 400)

    await connectDB()

    const current = await User.findById(user._id).select('+partnerWebhookSecret partnerWebhookUrl').lean()
    if (!current) return err('User not found', 404)

    const $set: Record<string, string> = {}
    const $unset: Record<string, 1> = {}

    if (parsed.data.partnerWebhookUrl !== undefined) {
      if (parsed.data.partnerWebhookUrl === '') {
        $unset.partnerWebhookUrl = 1
        $unset.partnerWebhookSecret = 1
      } else {
        $set.partnerWebhookUrl = parsed.data.partnerWebhookUrl
      }
    }

    if (parsed.data.partnerWebhookSecret !== undefined && !('partnerWebhookUrl' in $unset)) {
      if (parsed.data.partnerWebhookSecret === '') {
        $unset.partnerWebhookSecret = 1
      } else {
        const url = $set.partnerWebhookUrl ?? current.partnerWebhookUrl
        if (!url?.trim()) {
          return err('Set partnerWebhookUrl before storing a signing secret.', 400)
        }
        $set.partnerWebhookSecret = parsed.data.partnerWebhookSecret
      }
    }

    const hasOps = Object.keys($set).length > 0 || Object.keys($unset).length > 0
    if (!hasOps) return err('No changes to apply', 400)

    await User.findByIdAndUpdate(user._id, {
      ...(Object.keys($set).length ? { $set } : {}),
      ...(Object.keys($unset).length ? { $unset } : {}),
    })

    const u = await User.findById(user._id).select('+partnerWebhookSecret partnerWebhookUrl').lean()
    return ok({
      partnerWebhookUrl: u?.partnerWebhookUrl || '',
      partnerWebhookSecretMasked: maskSecret(u?.partnerWebhookSecret),
    })
  } catch (error) {
    console.error('PATCH webhook-settings failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to save', 500)
  }
}
