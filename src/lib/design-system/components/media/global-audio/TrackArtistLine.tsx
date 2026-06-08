'use client'

import Link from 'next/link'
import { cn } from '../../shared-utils'
import type { AudioTrack, TrackPerformer } from '../types'

function PerformerLinks({
  performers,
  className,
}: {
  performers: TrackPerformer[]
  className?: string
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1 gap-y-0.5', className)}>
      {performers.map((performer, index) => (
        <span key={performer.snapshotHref} className="inline-flex items-center gap-x-1">
          {index > 0 && <span className="text-neutral-600" aria-hidden>·</span>}
          <Link
            href={performer.snapshotHref}
            onClick={(e) => e.stopPropagation()}
            className="text-neutral-400 hover:text-primary-400 transition-colors underline-offset-2 hover:underline"
          >
            {performer.name}
          </Link>
        </span>
      ))}
    </span>
  )
}

interface TrackArtistLineProps {
  performers?: TrackPerformer[]
  albumLabel?: string
  fallbackArtist?: string
  className?: string
  centered?: boolean
}

export function TrackArtistLine({
  performers,
  albumLabel,
  fallbackArtist,
  className,
  centered = false,
}: TrackArtistLineProps) {
  if (!performers?.length) {
    if (!fallbackArtist && !albumLabel) return null
    const text = [fallbackArtist, albumLabel].filter(Boolean).join(' · ')
    return (
      <p className={cn('text-xs text-neutral-500 leading-snug truncate', centered && 'text-center', className)}>
        {text}
      </p>
    )
  }

  return (
    <p className={cn('text-xs text-neutral-500 leading-snug', centered && 'text-center', className)}>
      <span className={cn('inline-flex flex-wrap items-center gap-x-1 gap-y-0.5', centered && 'justify-center')}>
        <PerformerLinks performers={performers} />
        {albumLabel ? (
          <>
            <span className="text-neutral-600" aria-hidden>·</span>
            <span>{albumLabel}</span>
          </>
        ) : null}
      </span>
    </p>
  )
}

/** Now playing: Vibration Fit, then Artist/Artists with linked names. */
export function TrackNowPlayingMeta({ track }: { track?: AudioTrack | null }) {
  if (!track) return null

  const performers = track.performers
  const hasCredits = !!(performers?.length || track.artist)
  if (!hasCredits) {
    return <p className="text-sm text-neutral-400 text-center">Vibration Fit</p>
  }

  const creditLabel = performers && performers.length > 1 ? 'Creators' : 'Creator'

  return (
    <div className="w-full space-y-0.5 text-center">
      <p className="text-sm text-neutral-400">Vibration Fit</p>
      <p className="text-xs text-neutral-500 leading-snug">
        <span>{creditLabel}: </span>
        {performers?.length ? (
          <PerformerLinks performers={performers} className="justify-center" />
        ) : (
          <span>{track.artist}</span>
        )}
      </p>
    </div>
  )
}

function mobileAlbumLabel(album: string) {
  if (album === 'High Vibe Christmas') return 'Christmas'
  return album
}

/** Track list row for music: Vibration Fit, or Vibration Fit · album. */
export function formatMusicTrackListSubtitle(albumLabel?: string) {
  const album = (albumLabel || '').trim()
  return album ? `Vibration Fit · ${album}` : 'Vibration Fit'
}

export function MusicTrackListSubtitle({
  albumLabel,
  className,
}: {
  albumLabel?: string
  className?: string
}) {
  const album = (albumLabel || '').trim()
  if (!album) {
    return <p className={cn('truncate text-xs text-neutral-500', className)}>Vibration Fit</p>
  }

  const shortAlbum = mobileAlbumLabel(album)
  const useShortOnMobile = shortAlbum !== album

  return (
    <p className={cn('truncate text-xs text-neutral-500', className)}>
      Vibration Fit
      <span className="text-neutral-600"> · </span>
      {useShortOnMobile ? (
        <>
          <span className="md:hidden">{shortAlbum}</span>
          <span className="hidden md:inline">{album}</span>
        </>
      ) : (
        <span>{album}</span>
      )}
    </p>
  )
}

export function isSongNowPlayingTrack(
  track: AudioTrack | null | undefined,
  contentCategory?: string,
  mapActivityType?: string
) {
  return (
    contentCategory === 'music'
    || mapActivityType === 'music_listen'
    || mapActivityType === 'song_listen'
    || !!(track?.performers?.length)
  )
}
