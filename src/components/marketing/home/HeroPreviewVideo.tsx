'use client'

import { useRef, useState } from 'react'
import { reportVideoStart, reportVideoMilestone, reportVideoComplete } from '@/lib/tracking/engagement'

const SRC = 'https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-1080p.mp4'
const POSTER = 'https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-thumb.0000000.jpg'

// Same tracking id as HeroLayout's split-variant player so the preview page
// reports one video regardless of layout variant.
const TRACKING_ID = 'home-preview-hero-video'

const MILESTONES = [25, 50, 75, 95] as const

export function HeroPreviewVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const withSoundRef = useRef(false)
  const [withSound, setWithSound] = useState(false)
  const milestonesReached = useRef<Set<number>>(new Set())

  const startWithSound = () => {
    const video = videoRef.current
    if (!video || withSoundRef.current) return
    video.muted = false
    video.loop = false
    video.currentTime = 0
    withSoundRef.current = true
    setWithSound(true)
    reportVideoStart(TRACKING_ID)
    void video.play().catch(() => {})
  }

  // Milestones only count for intentional (sound-on) viewing -- the muted
  // autoplay loop would otherwise fire milestones for every visitor.
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !withSound || !video.duration) return
    const percentage = (video.currentTime / video.duration) * 100
    for (const milestone of MILESTONES) {
      if (percentage >= milestone && !milestonesReached.current.has(milestone)) {
        milestonesReached.current.add(milestone)
        reportVideoMilestone(TRACKING_ID, milestone, video.currentTime)
      }
    }
  }

  const handleEnded = () => {
    if (withSound) {
      reportVideoComplete(TRACKING_ID)
    }
  }

  return (
    <div className="hp-hero-video">
      <div className="relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={SRC}
          poster={POSTER}
          autoPlay
          muted
          loop={!withSound}
          playsInline
          preload="auto"
          controls={withSound}
          onClick={withSound ? undefined : startWithSound}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className={`w-full h-auto ${withSound ? '' : 'cursor-pointer'}`}
          style={{ aspectRatio: '16 / 9' }}
        />
        {!withSound && (
          <button
            type="button"
            onClick={startWithSound}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors duration-300 hover:bg-black/35"
            aria-label="Play with sound from the beginning"
          >
            <span className="flex h-12 w-[68px] items-center justify-center rounded-2xl bg-[#39FF14] transition-transform duration-300 hover:scale-110">
              <span className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-black" />
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-sm tracking-wide text-neutral-400">
        {withSound ? 'Five minute overview video' : 'Autoplaying muted. Click to watch with sound.'}
      </p>
    </div>
  )
}
