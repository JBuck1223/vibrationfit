'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { LIFE_CATEGORY_PHOTOS } from './life-category-photos'

const CYCLE_MS = 2800

export function LifeCategoryOrbit() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = LIFE_CATEGORY_PHOTOS[active]

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
              </button>
            )
          })}
        </div>
        <div className="hp-orbit-center">
          <Image
            key={current.key}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(min-width: 1024px) 340px, 60vw"
            className="hp-orbit-center-img"
            style={{ objectPosition: current.focus }}
            priority
          />
        </div>
      </div>
      <p className="hp-orbit-caption" aria-live="polite">
        {current.label}
      </p>
    </div>
  )
}
