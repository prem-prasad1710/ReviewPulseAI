import { randomBytes } from 'crypto'

/** H4 — short shareable referral token. */
export function generatePartnerReferralCode(): string {
  return `RP-${randomBytes(3).toString('hex').toUpperCase()}`
}
