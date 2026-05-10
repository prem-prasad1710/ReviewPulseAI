import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { generatePartnerReferralCode } from '@/lib/partner-code'
import User from '@/models/User'
import { z } from 'zod'

/** H4 — referral code for partner program. */
export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()
    let u = await User.findById(user._id).select('partnerReferralCode referredByUserId').lean()
    if (!u?.partnerReferralCode) {
      let code = generatePartnerReferralCode()
      for (let i = 0; i < 5; i += 1) {
        const clash = await User.findOne({ partnerReferralCode: code }).select('_id').lean()
        if (!clash) break
        code = generatePartnerReferralCode()
      }
      await User.findByIdAndUpdate(user._id, { $set: { partnerReferralCode: code } })
      u = await User.findById(user._id).select('partnerReferralCode referredByUserId').lean()
    }
    return ok({
      code: u?.partnerReferralCode,
      referredBy: u?.referredByUserId ? String(u.referredByUserId) : null,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}

const applySchema = z.object({ code: z.string().min(4).max(32) })

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = applySchema.safeParse(body)
    if (!parsed.success) return err('Invalid code', 400)
    await connectDB()
    const me = await User.findById(user._id).select('referredByUserId').lean()
    if (me?.referredByUserId) return err('Referral already applied', 400)
    const upper = parsed.data.code.trim().toUpperCase()
    const partner = await User.findOne({ partnerReferralCode: upper }).select('_id').lean()
    if (!partner || String(partner._id) === String(user._id)) {
      return err('Invalid referral code', 400)
    }
    await User.findByIdAndUpdate(user._id, { $set: { referredByUserId: partner._id } })
    return ok({ applied: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed', 500)
  }
}
