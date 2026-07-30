'use client'

import { useCallback, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const VIDEO_SRC = '/brand/reviewpulse-product-video.mp4'
const POSTER_SRC = '/brand/video-poster.webp'
const CAPTIONS_SRC = '/brand/demo-captions.vtt'

type LandingDemoVideoProps = {
  title: string
}

/** Defers the ~2.6 MB MP4 until the visitor chooses to play. */
export default function LandingDemoVideo({ title }: LandingDemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)

  const startPlayback = useCallback(() => {
    setActive(true)
    requestAnimationFrame(() => {
      void videoRef.current?.play()
    })
  }, [])

  if (!active) {
    return (
      <div className="relative aspect-video w-full bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element -- static poster, not in image CDN */}
        <img
          src={POSTER_SRC}
          alt=""
          width={640}
          height={340}
          className="aspect-video h-full w-full object-cover"
          decoding="async"
        />
        <button
          type="button"
          onClick={startPlayback}
          aria-label={`Play ${title}`}
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-3',
            'bg-slate-950/35 text-white transition hover:bg-slate-950/50',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400'
          )}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-indigo-700 shadow-lg ring-1 ring-white/40">
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-wide">Watch product demo</span>
        </button>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full bg-black object-contain"
      controls
      playsInline
      preload="none"
      poster={POSTER_SRC}
      aria-label={title}
    >
      <source src={VIDEO_SRC} type="video/mp4" />
      <track kind="captions" src={CAPTIONS_SRC} srcLang="en" label="English" default />
      Your browser does not support embedded video.
    </video>
  )
}
