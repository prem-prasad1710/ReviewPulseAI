import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

function requiresDashboardSession(pathname: string): boolean {
  if (pathname.startsWith('/api/') || pathname === '/login' || pathname === '/') return false
  if (
    pathname.startsWith('/join/') ||
    pathname.startsWith('/score/') ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/visit/')
  ) {
    return false
  }
  const prefixes = [
    '/dashboard',
    '/settings',
    '/reviews',
    '/locations',
    '/analytics',
    '/agency',
    '/reports',
    '/subscribe',
  ]
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function applyAgencyHostHeader(request: NextRequest): NextResponse {
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

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.ENABLE_AUTH_IN_DEV !== 'true'

  if (!devBypass && requiresDashboardSession(pathname)) {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    if (secret) {
      try {
        const base = process.env.NEXTAUTH_URL || request.nextUrl.origin
        const token = await getToken({
          req: request,
          secret,
          secureCookie: base.startsWith('https://'),
        })
        const id = (token as { id?: string } | null)?.id
        if (!id) {
          const login = new URL('/login', request.nextUrl.origin)
          login.searchParams.set('callbackUrl', pathname + search)
          return NextResponse.redirect(login)
        }
      } catch (e) {
        console.error('middleware getToken:', e)
      }
    }
  }

  return applyAgencyHostHeader(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
