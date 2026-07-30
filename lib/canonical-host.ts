import { getAppUrl } from '@/lib/app-url'

/** Hostname from `NEXT_PUBLIC_APP_URL` (no port). */
export function getCanonicalHost(): string | null {
  try {
    return new URL(getAppUrl()).hostname
  } catch {
    return null
  }
}

/** www ↔ apex counterpart for the configured canonical host. */
export function getAlternateHost(canonicalHost: string): string {
  return canonicalHost.startsWith('www.')
    ? canonicalHost.slice(4)
    : `www.${canonicalHost}`
}
