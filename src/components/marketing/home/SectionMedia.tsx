import { MarketingImage } from './MarketingImage'

type Photo = { src: string; alt: string }

export function SectionMedia({
  src,
  alt,
  photos,
  graphic,
  side = 'right',
  children,
}: {
  src?: string
  alt?: string
  photos?: Photo[]
  graphic?: React.ReactNode
  side?: 'left' | 'right'
  children: React.ReactNode
}) {
  const items = photos ?? (src && alt ? [{ src, alt }] : [])
  const isCollage = items.length > 1

  return (
    <div className={`hp-with-photo ${side === 'left' ? 'is-flip' : ''} ${isCollage ? 'has-collage' : ''}`}>
      <div className="hp-with-photo-copy">{children}</div>
      <div className="hp-with-photo-media">
        <div className="hp-with-photo-sticky">
          {graphic ? (
            graphic
          ) : isCollage ? (
            <div className={`hp-life-collage hp-life-collage-${Math.min(items.length, 4)}`}>
              {items.map((photo) => (
                <div key={photo.src} className="hp-life-tile">
                  <MarketingImage src={photo.src} alt={photo.alt} width={1200} height={800} className="h-auto w-full" loading="eager" />
                </div>
              ))}
            </div>
          ) : items[0] ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <MarketingImage src={items[0].src} alt={items[0].alt} width={1200} height={800} className="h-auto w-full" loading="eager" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
