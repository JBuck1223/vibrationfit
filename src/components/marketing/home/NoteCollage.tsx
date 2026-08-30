'use client'

import Image from 'next/image'
import { useLayoutEffect, useRef, useState } from 'react'
import { LIFE_CATEGORY_PHOTOS } from './life-category-photos'

const GAP = 8.8
const MOBILE_COUNT = 6

function photosThatFit(width: number, height: number) {
  const colWidth = (width - GAP) / 2
  if (colWidth <= 0 || height <= 0) return MOBILE_COUNT

  let left = 0
  let right = 0
  let count = 0

  for (const photo of LIFE_CATEGORY_PHOTOS) {
    const photoHeight = (photo.height / photo.width) * colWidth
    const useLeft = left <= right
    const current = useLeft ? left : right
    const next = current + (current > 0 ? GAP : 0) + photoHeight
    if (next > height) break
    if (useLeft) left = next
    else right = next
    count += 1
  }

  return Math.max(count, 2)
}

export function NoteCollage() {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(MOBILE_COUNT)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const measure = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      if (!desktop) {
        setCount(MOBILE_COUNT)
        return
      }
      setCount(photosThatFit(node.clientWidth, node.clientHeight))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="hp-note-collage" aria-label="Life across twelve categories">
      {LIFE_CATEGORY_PHOTOS.slice(0, count).map((photo) => (
        <figure key={photo.key} className="hp-note-collage-tile">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1024px) 280px, 50vw"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </figure>
      ))}
    </div>
  )
}
