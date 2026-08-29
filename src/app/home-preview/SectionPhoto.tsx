import Image from 'next/image'

type Photo = { src: string; alt: string }

export function SectionPhoto({
  src,
  alt,
  photos,
  side = 'right',
  children,
}: {
  src?: string
  alt?: string
  photos?: Photo[]
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
          {isCollage ? (
            <div className={`hp-life-collage hp-life-collage-${Math.min(items.length, 4)}`}>
              {items.map((photo) => (
                <div key={photo.src} className="hp-life-tile">
                  <Image src={photo.src} alt={photo.alt} width={1200} height={800} className="h-auto w-full" loading="eager" />
                </div>
              ))}
            </div>
          ) : items[0] ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Image src={items[0].src} alt={items[0].alt} width={1200} height={800} className="h-auto w-full" loading="eager" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
