import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'

export type HighlightClipProp = {
  reviewerName: string
  rating: number
  quote: string
}

export type HighlightReelProps = {
  title: string
  clips: HighlightClipProp[]
}

const FPS = 30
const FRAMES_PER_CLIP = FPS * 3

export const HighlightReel: React.FC<HighlightReelProps> = ({ title, clips }) => {
  const list =
    clips.length > 0
      ? clips.slice(0, 8)
      : [{ reviewerName: 'Guest', rating: 5, quote: 'Thanks for dining with us!' }]

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {list.map((c, i) => (
        <Sequence key={i} from={i * FRAMES_PER_CLIP} durationInFrames={FRAMES_PER_CLIP}>
          <AbsoluteFill
            style={{
              padding: 72,
              justifyContent: 'center',
              borderTop: '6px solid #6366f1',
            }}
          >
            <p style={{ fontSize: 34, opacity: 0.75, marginBottom: 16 }}>{title}</p>
            <p style={{ fontSize: 56, fontWeight: 800, letterSpacing: 2 }}>{'★'.repeat(Math.min(5, Math.max(1, c.rating)))}</p>
            <p style={{ fontSize: 40, lineHeight: 1.35, marginTop: 28, maxWidth: 920 }}>{c.quote}</p>
            <p style={{ fontSize: 34, marginTop: 36, opacity: 0.85 }}>— {c.reviewerName}</p>
            <p style={{ fontSize: 22, marginTop: 48, opacity: 0.45 }}>ReviewPulse highlight reel</p>
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
