'use client'

/**
 * Public music discover page: /music
 *
 * Accessible without authentication. Lists all music playable on
 * /audio/music (official catalog + member library) plus publicly listed
 * member tracks. Each card plays inline and links to the track's share
 * page (/music/[token]).
 */

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Music, Sparkles } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { PublicTrackGrid, type PublicGridTrack } from '@/components/music/PublicTrackGrid'

const PAGE_SIZE = 24

export default function PublicMusicPage() {
  const [tracks, setTracks] = useState<PublicGridTrack[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTracks = useCallback(async (offset: number) => {
    const res = await fetch(`/api/music/public?limit=${PAGE_SIZE}&offset=${offset}`)
    if (!res.ok) throw new Error('Failed to load music')
    return res.json() as Promise<{ tracks: PublicGridTrack[]; total: number }>
  }, [])

  useEffect(() => {
    let cancelled = false
    loadTracks(0)
      .then(data => {
        if (cancelled) return
        setTracks(data.tracks)
        setTotal(data.total)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load music. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [loadTracks])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await loadTracks(tracks.length)
      setTracks(prev => [...prev, ...data.tracks])
      setTotal(data.total)
    } catch {
      setError('Failed to load more music.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Vibration Fit Music
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Songs created with VIVA on Vibration Fit — each one born from a
          vision for life.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center text-neutral-400 py-20">{error}</p>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400">No songs here yet. Check back soon.</p>
        </div>
      ) : (
        <>
          <PublicTrackGrid tracks={tracks} />

          {tracks.length < total && (
            <div className="flex justify-center mt-10">
              <Button variant="outline" onClick={handleLoadMore} loading={loadingMore}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Sign-up CTA ── */}
      <div className="w-full max-w-xl mx-auto mt-14">
        <div className="rounded-2xl border-2 border-[#333] bg-neutral-900 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#BF00FF]/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#BF00FF]" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Create your own songs with VIVA
          </h2>
          <p className="text-sm md:text-base text-neutral-400 mb-6 max-w-md mx-auto">
            Design a vision for your life and VIVA turns it into music, audios, and more.
          </p>
          <Button size="lg" asChild>
            <Link href="/">Learn More About Vibration Fit</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
