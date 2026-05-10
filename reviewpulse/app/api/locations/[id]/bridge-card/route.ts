import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsOfflineBridge } from '@/lib/plan-access'
import { buildBridgeCardBuffer } from '@/lib/bridge-card-pdf'
import Location from '@/models/Location'
import QRCode from 'qrcode'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await connectDB()
    const { id } = await params

    const plan = String(user.plan || '')
    if (!planAllowsOfflineBridge(plan)) {
      return NextResponse.json({ error: 'Upgrade to a paid plan to download bridge cards.' }, { status: 403 })
    }

    const location = await Location.findOne({ _id: id, userId: user._id })
      .select('name locationSlug')
      .lean()
    if (!location?.locationSlug) {
      return NextResponse.json({ error: 'Location slug missing' }, { status: 400 })
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const target = `${base.replace(/\/$/, '')}/r/visit/${encodeURIComponent(location.locationSlug)}`
    const qrDataUrl = await QRCode.toDataURL(target, { margin: 2, width: 400, errorCorrectionLevel: 'M' })

    const buf = await buildBridgeCardBuffer({
      businessName: location.name,
      qrDataUrl,
    })

    const safeName = location.name.replace(/[^\w\s-]/g, '').slice(0, 40).trim() || 'location'
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="review-bridge-${safeName}.pdf"`,
      },
    })
  } catch (error) {
    console.error('GET bridge-card failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
