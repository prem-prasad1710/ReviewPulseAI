import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ReviewPulse AI — Google review inbox with Hindi & English AI replies'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0f172a 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 16 }}>ReviewPulse AI</div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Reply to every Google review in minutes
        </div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>
          Hindi · English · Hinglish · Built for Indian SMBs
        </div>
      </div>
    ),
    { ...size }
  )
}
