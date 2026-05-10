import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey() {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('Missing ENCRYPTION_KEY')
  return createHash('sha256').update(raw).digest()
}

export function encrypt(text: string) {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedValue: string) {
  const [ivHex, authTagHex, encrypted] = encryptedValue.split(':')
  if (!ivHex || !authTagHex || !encrypted) throw new Error('Invalid encrypted payload')

  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
