'use client'

import React from 'react'
import Image from 'next/image'
import { getVisionCategoryIcon, isValidVisionCategory } from '@/lib/design-system/vision-categories'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

const DEFAULT_ARTWORK = 'https://media.vibrationfit.com/site-assets/brand/vf-icon-512.png'

interface TrackArtworkProps {
  track: AudioTrack
  iconKey?: string
  size: number
  className?: string
}

export function TrackArtwork({ track, iconKey, size, className = '' }: TrackArtworkProps) {
  const sectionKey = (track as unknown as Record<string, unknown>).sectionKey as string | undefined
  const key = sectionKey || iconKey

  if (key && !track.thumbnail && isValidVisionCategory(key)) {
    const Icon = getVisionCategoryIcon(key)
    const iconSize = Math.round(size * 0.45)
    return (
      <div className={`relative flex items-center justify-center bg-black ${className}`} style={{ width: size, height: size }}>
        <Icon className="text-[#39FF14]" style={{ width: iconSize, height: iconSize }} />
      </div>
    )
  }

  return (
    <div className={`relative bg-neutral-800 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={track.thumbnail || DEFAULT_ARTWORK}
        alt={track.title}
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </div>
  )
}
