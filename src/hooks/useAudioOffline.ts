'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  cacheAudioTrack,
  getCachedAudio,
  getCachedTrackIds,
  removeCachedTrack,
} from '@/lib/storage/audio-offline-cache'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

interface UseAudioOfflineReturn {
  cachedTrackIds: Set<string>
  downloadingTrackIds: Map<string, number>
  downloadTrack: (track: AudioTrack) => Promise<void>
  downloadAllTracks: (tracks: AudioTrack[]) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  getPlaybackUrl: (track: AudioTrack) => Promise<string>
  isInitialized: boolean
}

export function useAudioOffline(tracks: AudioTrack[]): UseAudioOfflineReturn {
  const [cachedTrackIds, setCachedTrackIds] = useState<Set<string>>(new Set())
  const [downloadingTrackIds, setDownloadingTrackIds] = useState<Map<string, number>>(new Map())
  const [isInitialized, setIsInitialized] = useState(false)
  const blobUrlsRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    getCachedTrackIds().then(ids => {
      if (cancelled) return
      const trackIdSet = new Set(tracks.map(t => t.id))
      setCachedTrackIds(new Set(ids.filter(id => trackIdSet.has(id))))
      setIsInitialized(true)
    })
    return () => { cancelled = true }
  }, [tracks])

  useEffect(() => {
    const urls = blobUrlsRef.current
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const downloadTrack = useCallback(async (track: AudioTrack) => {
    if (cachedTrackIds.has(track.id)) return
    if (downloadingTrackIds.has(track.id)) return

    setDownloadingTrackIds(prev => {
      const next = new Map(prev)
      next.set(track.id, 0)
      return next
    })

    try {
      const response = await fetch(`/api/audio/download?trackId=${encodeURIComponent(track.id)}`)
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)

      const contentLength = response.headers.get('Content-Length')
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

      if (!response.body) {
        const blob = await response.blob()
        await cacheAudioTrack(track.id, blob, {
          title: track.title,
          duration: track.duration,
          originalUrl: track.url,
        })
      } else {
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let receivedBytes = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          chunks.push(value)
          receivedBytes += value.length

          if (totalBytes > 0) {
            const progress = Math.round((receivedBytes / totalBytes) * 100)
            setDownloadingTrackIds(prev => {
              const next = new Map(prev)
              next.set(track.id, progress)
              return next
            })
          }
        }

        const blob = new Blob(chunks, { type: 'audio/mpeg' })
        await cacheAudioTrack(track.id, blob, {
          title: track.title,
          duration: track.duration,
          originalUrl: track.url,
        })
      }

      setCachedTrackIds(prev => {
        const next = new Set(prev)
        next.add(track.id)
        return next
      })
    } catch (error) {
      console.error('Failed to download track for offline:', error)
    } finally {
      setDownloadingTrackIds(prev => {
        const next = new Map(prev)
        next.delete(track.id)
        return next
      })
    }
  }, [cachedTrackIds, downloadingTrackIds])

  const downloadAllTracks = useCallback(async (tracksToDownload: AudioTrack[]) => {
    const uncached = tracksToDownload.filter(t => !cachedTrackIds.has(t.id) && !downloadingTrackIds.has(t.id))
    for (const track of uncached) {
      await downloadTrack(track)
    }
  }, [cachedTrackIds, downloadingTrackIds, downloadTrack])

  const removeTrack = useCallback(async (trackId: string) => {
    await removeCachedTrack(trackId)

    const existingUrl = blobUrlsRef.current.get(trackId)
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl)
      blobUrlsRef.current.delete(trackId)
    }

    setCachedTrackIds(prev => {
      const next = new Set(prev)
      next.delete(trackId)
      return next
    })
  }, [])

  const getPlaybackUrl = useCallback(async (track: AudioTrack): Promise<string> => {
    if (!cachedTrackIds.has(track.id)) return track.url

    const existing = blobUrlsRef.current.get(track.id)
    if (existing) return existing

    const blob = await getCachedAudio(track.id)
    if (!blob) return track.url

    const blobUrl = URL.createObjectURL(blob)
    blobUrlsRef.current.set(track.id, blobUrl)
    return blobUrl
  }, [cachedTrackIds])

  return {
    cachedTrackIds,
    downloadingTrackIds,
    downloadTrack,
    downloadAllTracks,
    removeTrack,
    getPlaybackUrl,
    isInitialized,
  }
}
