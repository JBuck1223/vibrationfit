import { MarketingImage } from './MarketingImage'

type Shot = {
  src: string
  alt: string
  width: number
  height: number
}

const LEFT: Shot[] = [
  {
    src: '/home-preview/screenshots/vibe-tribe.jpg',
    alt: 'Vibe Tribe community feed with member wins',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/life-vision.jpg',
    alt: 'Life Vision with the twelve life categories',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/dashboard.jpg',
    alt: 'Vibration Fit dashboard',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/journal.jpg',
    alt: 'Journal entries in Vibration Fit',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/audio-studio.jpg',
    alt: 'Audio Studio playing Life Vision audio',
    width: 1440,
    height: 1560,
  },
  {
    src: '/home-preview/screenshots/abundance-tracker.jpg',
    alt: 'Abundance Tracker',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/projects.jpg',
    alt: 'Projects in Vibration Fit',
    width: 2880,
    height: 1840,
  },
]

const RIGHT: Shot[] = [
  {
    src: '/home-preview/screenshots/vision-board.jpg',
    alt: 'Vision Board with actualized items',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/map.jpg',
    alt: 'My Alignment Plan for today',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/tracking.jpg',
    alt: 'Tracking streaks and metrics',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/alignment-gym.jpg',
    alt: 'The Alignment Gym',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/daily-paper.jpg',
    alt: 'Daily Paper',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/profile.jpg',
    alt: 'Profile in Vibration Fit',
    width: 2880,
    height: 1840,
  },
  {
    src: '/home-preview/screenshots/stories.jpg',
    alt: 'Stories in Vibration Fit',
    width: 2880,
    height: 1840,
  },
]

function Column({
  shots,
  direction,
}: {
  shots: Shot[]
  direction: 'up' | 'down'
}) {
  return (
    <div className={`hp-note-collage-col is-${direction}`}>
      <div className="hp-note-collage-track">
        {shots.map((shot) => (
          <figure key={shot.src} className="hp-note-collage-tile">
            <MarketingImage
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              sizes="(min-width: 1024px) 22vw, 46vw"
            />
          </figure>
        ))}
        {shots.map((shot) => (
          <figure key={`${shot.src}-loop`} className="hp-note-collage-tile" aria-hidden="true">
            <MarketingImage
              src={shot.src}
              alt=""
              width={shot.width}
              height={shot.height}
              sizes="(min-width: 1024px) 22vw, 46vw"
            />
          </figure>
        ))}
      </div>
    </div>
  )
}

export function PlatformScreens() {
  return (
    <div className="hp-note-collage" aria-label="Vibration Fit platform screens">
      <Column shots={LEFT} direction="up" />
      <Column shots={RIGHT} direction="down" />
    </div>
  )
}
