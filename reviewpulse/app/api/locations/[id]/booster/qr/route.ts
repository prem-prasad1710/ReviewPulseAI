import QRCode from 'qrcode'
import sharp from 'sharp'
import { err } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import { planAllowsBooster } from '@/lib/plan-access'
import { escapeXml } from '@/lib/xml-escape'
import Location from '@/models/Location'

function filenameSafe(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'location'
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!planAllowsBooster(user.plan as string)) {
      return err('Upgrade to a paid plan to download Review Booster QR codes.', 403)
    }
    await connectDB()
    const { id } = await params
    const location = await Location.findOne({ _id: id, userId: user._id }).lean()
    if (!location) return err('Location not found', 404)
    const pid = location.googlePlaceId
    if (!pid) {
      return err('Set Google Place ID on this location to generate the review link QR.', 400)
    }

    const url = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`
    const qrSize = 400
    const qr = await QRCode.toBuffer(url, { type: 'png', width: qrSize, margin: 2 })

    const labelSvg = Buffer.from(
      `<svg width="${qrSize}" height="56" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="50%" y="34" text-anchor="middle" font-size="14" font-family="system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(location.name)}</text></svg>`
    )
    const labelPng = await sharp(labelSvg).png().toBuffer()

    const out = await sharp({
      create: {
        width: qrSize,
        height: qrSize + 56,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qr, top: 0, left: 0 },
        { input: labelPng, top: qrSize, left: 0 },
      ])
      .png()
      .toBuffer()

    return new Response(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${filenameSafe(location.name)}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('GET booster qr failed:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    return err('Failed to generate QR', 500)
  }
}
