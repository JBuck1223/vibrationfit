import { OptimizedVideo } from '@/components/OptimizedVideo'
import { HeroPreviewVideo } from './HeroPreviewVideo'

function HeroVideo() {
  return (
    <div className="hp-hero-video">
      <OptimizedVideo
        url="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-1080p.mp4"
        thumbnailUrl="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-thumb.0000000.jpg"
        context="single"
        caption="Five minute overview video"
        trackingId="home-preview-hero-video"
        saveProgress={true}
        className="w-full h-auto"
      />
    </div>
  )
}

export function HeroLayout({
  intro,
  children,
  variant = 'split',
}: {
  intro: React.ReactNode
  children?: React.ReactNode
  variant?: 'split' | 'stacked'
}) {
  if (variant === 'stacked') {
    return (
      <div className="hp-hero-stack" data-hero="stacked">
        <div className="hp-hero-intro">{intro}</div>
        <HeroPreviewVideo />
        {children ? <div className="hp-hero-copy">{children}</div> : null}
      </div>
    )
  }

  return (
    <div className="hp-hero-stack" data-hero="split-under-law">
      <div className="hp-hero-intro">{intro}</div>
      <div className="hp-hero-split">
        <div className="hp-hero-copy">{children}</div>
        <HeroVideo />
      </div>
    </div>
  )
}
