import { decrypt } from '@/lib/crypto'

export function encryptionKeyConfigured(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY?.trim())
}

/** Returns true when stored ciphertext decrypts with the current ENCRYPTION_KEY. */
export function canDecryptStoredToken(encrypted: string | undefined | null): boolean {
  if (!encrypted?.trim()) return false
  if (!encryptionKeyConfigured()) return false
  try {
    decrypt(encrypted)
    return true
  } catch {
    return false
  }
}

export type TokenHealthIssue = 'missing_key' | 'decrypt_failed'

export function diagnoseLocationTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined
): TokenHealthIssue | null {
  if (!encryptionKeyConfigured()) return 'missing_key'
  if (!canDecryptStoredToken(accessToken) || !canDecryptStoredToken(refreshToken)) {
    return 'decrypt_failed'
  }
  return null
}
