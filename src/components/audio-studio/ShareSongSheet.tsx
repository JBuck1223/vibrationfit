'use client'

/**
 * Share sheet for song tracks: manage the public share link and public
 * discover-page listing for a track (POST /api/songs/[id]/tracks/[trackId]/share).
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Share2, Loader2, AlertCircle, Copy, Check, Globe, Link2Off } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { shareSongLink, songShareMessage } from '@/lib/songs/share-message'

interface ShareState {
  is_shared: boolean
  is_public: boolean
  share_url: string | null
}

interface ShareSongSheetProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  trackId: string
  trackTitle?: string
}

export function ShareSongSheet({
  isOpen,
  onClose,
  songId,
  trackId,
  trackTitle,
}: ShareSongSheetProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [share, setShare] = useState<ShareState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setCopied(false)

    fetch(`/api/songs/${songId}/tracks/${trackId}/share`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load sharing state')
        return res.json()
      })
      .then(data => {
        if (!cancelled) setShare(data)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sharing state')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [isOpen, songId, trackId])

  const updateShare = useCallback(async (updates: { is_shared?: boolean; is_public?: boolean }) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/songs/${songId}/tracks/${trackId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update sharing')
      }
      const data = await res.json()
      setShare(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sharing')
    } finally {
      setSaving(false)
    }
  }, [songId, trackId])

  const handleCopy = useCallback(async () => {
    if (!share?.share_url) return
    try {
      await navigator.clipboard.writeText(share.share_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [share?.share_url])

  // Native share sheet (or copy message + link) — this sheet is only shown
  // to the track's owner, so the message is always "I made".
  const handleShare = useCallback(async () => {
    if (!share?.share_url) return
    try {
      const outcome = await shareSongLink({
        url: share.share_url,
        title: trackTitle,
        isCreator: true,
      })
      if (outcome === 'copied') {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }, [share?.share_url, trackTitle])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-neutral-700 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-5 space-y-4">
          <div className="text-center">
            <Share2 className="w-8 h-8 text-[#39FF14] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Share Song</h3>
            <p className="text-sm text-neutral-400">
              {trackTitle
                ? `Share "${trackTitle}" with anyone — no Vibration Fit account needed to listen.`
                : 'Share this song with anyone — no Vibration Fit account needed to listen.'}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {share?.is_shared && share.share_url ? (
                <>
                  {/* Share message preview + link */}
                  <div className="rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2.5 space-y-1.5">
                    <p className="text-sm text-white font-medium">
                      {songShareMessage(true)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-xs text-neutral-400 font-mono">
                        {share.share_url}
                      </span>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[#39FF14] text-black hover:bg-[#2fe010] transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-[#39FF14]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Public listing toggle */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => updateShare({ is_public: !share.is_public })}
                    className="flex w-full items-center gap-3 rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-left transition-colors hover:border-neutral-600 disabled:opacity-60"
                  >
                    <Globe className={`w-5 h-5 flex-shrink-0 ${share.is_public ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-white">Show on public music page</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">
                        List this song on vibrationfit.com/music for anyone to discover
                      </span>
                    </span>
                    <span
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        share.is_public ? 'bg-[#39FF14]' : 'bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          share.is_public ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => updateShare({ is_shared: false })}
                      disabled={saving}
                      className="flex-1 !text-[#FF0040]"
                    >
                      <Link2Off className="w-4 h-4 mr-2" />
                      Stop Sharing
                    </Button>
                    <Button variant="primary" onClick={onClose} className="flex-1">
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => updateShare({ is_shared: true })}
                    loading={saving}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Create Share Link
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
