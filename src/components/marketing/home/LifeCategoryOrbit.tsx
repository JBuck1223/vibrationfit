'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { ImageLightbox } from '@/lib/design-system'
import { LIFE_CATEGORY_PHOTOS } from './life-category-photos'

const CYCLE_MS = 2800

export function LifeCategoryOrbit() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const current = LIFE_CATEGORY_PHOTOS[active]
  const paused = hovered || lightboxOpen

  const lightboxImages = useMemo(
    () =>
      LIFE_CATEGORY_PHOTOS.map((photo) => ({
        url: photo.src,
        alt: photo.alt,
        caption: photo.label,
      })),
    [],
  )

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % LIFE_CATEGORY_PHOTOS.length)
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div
      className={`hp-orbit${paused ? ' is-paused' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="hp-orbit-stage" role="group" aria-label="Twelve life categories">
        <div className="hp-orbit-spin">
          {LIFE_CATEGORY_PHOTOS.map((photo, index) => {
            const isActive = index === active

            return (
              <button
                key={photo.key}
                type="button"
                className={`hp-orbit-node${isActive ? ' is-active' : ''}`}
                style={{ '--orbit-angle': `${index * 30 - 90}deg` } as React.CSSProperties}
                onClick={() => setActive(index)}
                aria-label={`${photo.label}${isActive ? ', showing now' : ''}`}
                aria-pressed={isActive}
              >
                <span className="hp-orbit-node-body">
                  <span className="hp-orbit-node-face">
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      sizes="80px"
                      className="hp-orbit-node-img"
                      style={{ objectPosition: photo.focus }}
                    />
                  </span>
                  <span className="hp-orbit-node-meta">
                    <photo.icon className="hp-orbit-node-icon" aria-hidden="true" />
                    <span className="hp-orbit-node-label">{photo.label}</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="hp-orbit-center"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View ${current.label} photo`}
        >
          <Image
            key={current.key}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(min-width: 1024px) 800px, 90vw"
            quality={90}
            className="hp-orbit-center-img"
            style={{ objectPosition: current.focus }}
            priority
          />
        </button>
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={active}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setActive}
        showCopyButton={false}
        showThumbnails
        showCounter
      />
    </div>
  )
}
