import { getAppUrl } from '@/lib/app-url'

/** Must match Google Cloud → Authorized redirect URIs and Auth.js callback path. */
export function getGoogleOAuthRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  return `${getAppUrl()}/api/auth/callback/google`
}
