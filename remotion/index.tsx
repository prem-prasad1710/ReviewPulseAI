import type React from 'react'
import { Composition, registerRoot } from 'remotion'
import { HighlightReel } from './compositions/HighlightReel'

const FPS = 30
const SEC_PER_CLIP = 3
const FRAMES_PER_CLIP = FPS * SEC_PER_CLIP
const MAX_CLIPS = 8

const Root: React.FC = () => (
  <>
    <Composition
      id="HighlightReel"
      component={HighlightReel}
      durationInFrames={FRAMES_PER_CLIP * MAX_CLIPS}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        title: 'Customer love',
        clips: [{ reviewerName: 'Guest', rating: 5, quote: 'Great experience at our place!' }],
      }}
    />
  </>
)

registerRoot(Root)
