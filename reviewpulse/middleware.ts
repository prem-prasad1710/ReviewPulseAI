import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Optional white-label: set `AGENCY_HOST_MAP=hostname:agencyMongoObjectId`
 * Forwards `x-agency-id` on the *request* so Server Components can read `headers()`.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] || ''
  const map = process.env.AGENCY_HOST_MAP || ''
  if (!host || !map) return NextResponse.next()

  for (const part of map.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const idx = trimmed.lastIndexOf(':')
    if (idx <= 0) continue
    const domain = trimmed.slice(0, idx).trim()
    const id = trimmed.slice(idx + 1).trim()
    if (domain && id && host === domain) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-agency-id', id)
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
