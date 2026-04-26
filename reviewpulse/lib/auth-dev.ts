/**
 * Development auth bypass: dashboard and API routes use the first MongoDB user
 * instead of a Google session. Production is unaffected (NODE_ENV === 'production').
 *
 * To test real Google auth locally, set ENABLE_AUTH_IN_DEV=true in .env.local.
 */
export const AUTH_DISABLED_FOR_DEV =
  process.env.NODE_ENV === 'development' && process.env.ENABLE_AUTH_IN_DEV !== 'true'
