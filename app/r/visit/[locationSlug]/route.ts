import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationSlug: string }> }
) {
  const { locationSlug } = await params
  const today = new Date()
  const ref = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const url = new URL(`/visit/${encodeURIComponent(locationSlug)}`, base)
  url.searchParams.set('ref', ref)
  return NextResponse.redirect(url, 302)
}
