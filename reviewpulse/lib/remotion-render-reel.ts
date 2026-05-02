import { readFile, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import type { HighlightReelProps } from '../remotion/compositions/HighlightReel'

/**
 * Renders the HighlightReel composition to an MP4 file, returns buffer.
 * Requires FFmpeg on PATH (local dev: `brew install ffmpeg`). Serverless hosts often lack FFmpeg — use a worker or Remotion Lambda in production.
 */
export async function renderHighlightReelToMp4Buffer(inputProps: HighlightReelProps): Promise<Buffer> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'rp-reel-'))
  const outPath = path.join(tmpDir, 'out.mp4')
  try {
    const entryPoint = path.join(process.cwd(), 'remotion', 'index.tsx')
    const serveUrl = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    })

    const composition = await selectComposition({
      serveUrl,
      id: 'HighlightReel',
      inputProps,
    })

    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    })

    return await readFile(outPath)
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}
