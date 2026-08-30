import Image from 'next/image'

const SHOTS = [
  {
    src: '/home-preview/screenshots/life-vision.jpg',
    alt: 'Life Vision in Vibration Fit: Version 5 with Forward, Fun, and the twelve life categories',
    label: 'Life Vision',
  },
  {
    src: '/home-preview/screenshots/map.jpg',
    alt: 'My Alignment Plan in Vibration Fit: today\'s Activate, Create, Connect, and Attend plus custom commitments',
    label: 'My Alignment Plan',
  },
  {
    src: '/home-preview/screenshots/vision-board.jpg',
    alt: 'Vision Board in Vibration Fit: actualized items with vision and reality side by side',
    label: 'Vision Board',
  },
] as const

export function PlatformScreens() {
  return (
    <div className="hp-screens" aria-label="Actual Vibration Fit platform screens">
      {SHOTS.map((shot) => (
        <figure key={shot.src} className="hp-screen">
          <figcaption className="hp-screen-label">{shot.label}</figcaption>
          <Image
            src={shot.src}
            alt={shot.alt}
            width={2880}
            height={1840}
            sizes="(min-width: 1024px) 42vw, 94vw"
          />
        </figure>
      ))}
    </div>
  )
}
