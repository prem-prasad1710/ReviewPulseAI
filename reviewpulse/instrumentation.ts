export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'production') return

  const missing: string[] = []
  if (!process.env.MONGODB_URI?.trim()) missing.push('MONGODB_URI')
  if (!process.env.NEXTAUTH_SECRET?.trim()) missing.push('NEXTAUTH_SECRET')

  if (missing.length > 0) {
    console.error(
      `[ReviewPulse] Missing required env in production: ${missing.join(', ')}. Set these before going live.`
    )
  }
}
