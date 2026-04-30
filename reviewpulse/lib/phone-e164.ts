/** Normalize common Indian mobile input to E.164 (+91…). Returns null if not clearly valid. */
export function normalizeIndianMobileToE164(raw: string): string | null {
  const s = raw.trim().replace(/^whatsapp:/i, '').replace(/\s+/g, '')
  if (!s) return null
  if (/^\+[1-9]\d{6,14}$/.test(s)) return s

  const digits = s.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) {
    const rest = digits.slice(2)
    if (/^[6-9]\d{9}$/.test(rest)) return `+91${rest}`
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    const rest = digits.slice(1)
    if (/^[6-9]\d{9}$/.test(rest)) return `+91${rest}`
  }
  return null
}

/** Best-effort E.164: tries India rules, then passes through if already +… and valid length. */
export function normalizeWhatsAppInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const india = normalizeIndianMobileToE164(trimmed)
  if (india) return india
  const compact = trimmed.replace(/\s+/g, '')
  if (/^\+[1-9]\d{6,14}$/.test(compact)) return compact
  return trimmed
}
