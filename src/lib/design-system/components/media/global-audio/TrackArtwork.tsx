'use client'

import React, { createContext, useContext } from 'react'
import Image from 'next/image'
import { Music2, RefreshCw } from 'lucide-react'
import { getStoryEntityArtworkIcon, isStoryEntityTypeKey } from '@/lib/stories/story-entity-artwork-icon'
import { getVisionCategoryIcon, isValidVisionCategory } from '../../../vision-categories'
import type { AudioTrack } from '../types'

const DEFAULT_ARTWORK = 'https://media.vibrationfit.com/site-assets/brand/vf-icon-512.png'

/**
 * Picks a themed image for a track with no artwork of its own, given the
 * set's icon key. The app shell provides one from the member's theme so the
 * player shows the same imagery as the audio cards; outside it there is none
 * and the icon art below is used.
 */
export type TrackArtworkFallback = (iconKey: string | undefined, track: AudioTrack) => string | null

const TrackArtworkFallbackContext = createContext<TrackArtworkFallback | null>(null)

export const TrackArtworkFallbackProvider = TrackArtworkFallbackContext.Provider

interface TrackArtworkProps {
  track: AudioTrack
  iconKey?: string
  size: number
  className?: string
}

export function TrackArtwork({ track, iconKey, size, className = '' }: TrackArtworkProps) {
  const sectionKey = (track as unknown as Record<string, unknown>).sectionKey as string | undefined
  const key = sectionKey || iconKey
  const fallback = useContext(TrackArtworkFallbackContext)
  const themed = track.thumbnail ? null : fallback?.(iconKey, track) ?? null

  if (themed) {
    return (
      <div className={`relative bg-neutral-800 ${className}`} style={{ width: size, height: size }}>
        <Image src={themed} alt={track.title} fill className="object-cover" sizes={`${size}px`} />
      </div>
    )
  }

  if (key === 'music' && !track.thumbnail) {
    const iconSize = Math.round(size * 0.45)
    return (
      <div className={`relative flex items-center justify-center bg-black ${className}`} style={{ width: size, height: size }}>
        <Music2 className="text-[#39FF14]" style={{ width: iconSize, height: iconSize }} />
      </div>
    )
  }

  if (key && !track.thumbnail && isStoryEntityTypeKey(key)) {
    const Icon = getStoryEntityArtworkIcon(key)
    const iconSize = Math.round(size * 0.45)
    return (
      <div className={`relative flex items-center justify-center bg-black ${className}`} style={{ width: size, height: size }}>
        <Icon className="text-primary-500" style={{ width: iconSize, height: iconSize }} />
      </div>
    )
  }

  if (key && !track.thumbnail && (isValidVisionCategory(key) || key === 'full')) {
    const Icon = key === 'full' ? RefreshCw : getVisionCategoryIcon(key)
    const iconSize = Math.round(size * 0.45)
    return (
      <div className={`relative flex items-center justify-center bg-black ${className}`} style={{ width: size, height: size }}>
        <Icon className="text-primary-500" style={{ width: iconSize, height: iconSize }} />
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
