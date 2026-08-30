import Image from 'next/image'
import { Check } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { PILLAR_META } from '@/lib/map/map-pillar-config'

const BOARD = [
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
    alt: 'Dream home on the vision board',
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-actualized.jpg',
    alt: 'Italy on the vision board',
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-3-actualized.jpg',
    alt: 'Fit couple on the vision board',
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/australia-actualized.jpg',
    alt: 'Australia on the vision board',
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/van-actualized-2.jpg',
    alt: 'Minivan on the vision board',
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-actualized.jpg',
    alt: 'Mountain chalet on the vision board',
  },
]

const MAP_ROWS = [
  { pillar: 'activations', done: true, label: 'Listen to Life Vision audio' },
  { pillar: 'creations', done: true, label: 'Journal the contrast, rewrite the story' },
  { pillar: 'connections', done: false, label: 'Heart a Vibe Tribe win' },
  { pillar: 'sessions', done: false, label: 'Alignment Gym replay' },
] as const

const CATEGORIES = VISION_CATEGORIES.filter(
  (category) => category.key !== 'forward' && category.key !== 'conclusion',
)

function Chrome({ title }: { title: string }) {
  return (
    <div className="hp-screen-chrome">
      <span className="hp-screen-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p>{title}</p>
    </div>
  )
}

export function PlatformScreens() {
  return (
    <div className="hp-screens" aria-label="Vibration Fit platform: Life Vision, MAP, and Vision Board">
      <article className="hp-screen hp-screen-board">
        <Chrome title="Vision Board" />
        <div className="hp-screen-board-grid">
          {BOARD.map((photo) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={400}
              height={300}
              sizes="(min-width: 1024px) 14vw, 30vw"
            />
          ))}
        </div>
      </article>

      <article className="hp-screen hp-screen-vision">
        <Chrome title="Life I Choose" />
        <ul className="hp-screen-cats">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <li key={category.key}>
                <Icon aria-hidden="true" strokeWidth={1.75} />
                <span>{category.label}</span>
              </li>
            )
          })}
        </ul>
      </article>

      <article className="hp-screen hp-screen-map">
        <Chrome title="My Alignment Plan" />
        <p className="hp-screen-map-kicker">Today</p>
        <ul className="hp-screen-map-rows">
          {MAP_ROWS.map((row) => (
            <li key={row.pillar} className={row.done ? 'is-done' : undefined}>
              <span className="hp-screen-check" aria-hidden="true">
                {row.done ? <Check strokeWidth={2.5} /> : null}
              </span>
              <span>
                <b style={{ color: PILLAR_META[row.pillar].color }}>{PILLAR_META[row.pillar].label}</b>
                {row.label}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
