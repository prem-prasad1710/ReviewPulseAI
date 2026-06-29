import { SEED_GOOGLE_ID_PREFIX } from '@/lib/seed-test-data'
import { encryptionKeyConfigured } from '@/lib/token-health'

/** AES-GCM ciphertext stored by lib/crypto.ts — iv:authTag:payload (all hex). */
export function looksLikeEncryptedPayload(value: string | undefined | null): boolean {
  if (!value?.trim()) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  return parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 16)
}

export function isSeedGoogleLocationId(googleLocationId: string | undefined | null): boolean {
  return Boolean(googleLocationId?.startsWith(SEED_GOOGLE_ID_PREFIX))
}

export function explainTokenDecryptFailure(
  googleLocationId: string | undefined,
  accessToken?: string | null,
  refreshToken?: string | null
): string {
  if (isSeedGoogleLocationId(googleLocationId)) {
    return (
      'This outlet is sample/demo data and cannot sync to Google. Remove sample data (Locations → Reset & reload) or use Reconnect Google to import your real restaurant.'
    )
  }

  if (!encryptionKeyConfigured()) {
    return (
      'ENCRYPTION_KEY is missing on this server. Add the same key to Vercel → Environment Variables and local .env, redeploy, then use Reconnect Google (not Sync alone).'
    )
  }

  const plain =
    !looksLikeEncryptedPayload(accessToken) || !looksLikeEncryptedPayload(refreshToken)
  if (plain) {
    return (
      'Google tokens in the database are outdated or unencrypted. Use Reconnect Google at /locations/connect to re-save tokens, then sync again.'
    )
  }

  return (
    'Tokens cannot be decrypted with the current ENCRYPTION_KEY (key changed or env mismatch between local and Vercel). Use the same ENCRYPTION_KEY everywhere, redeploy, then Reconnect Google.'
  )
}
