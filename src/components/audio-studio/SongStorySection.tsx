'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, Button } from '@/lib/design-system/components'
import { BookOpen, Video, Mic, Trash2, RefreshCw, Loader2, CheckCircle } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { deleteRecording } from '@/lib/services/recordingService'
import type { Song } from '@/lib/songs/types'

interface SongStorySectionProps {
  song: Song
  onSaved: () => void
}

/**
 * The Story Behind This Song
 *
 * Lets a member record a video or audio telling the story behind their
 * completed song. The recording uploads to S3 (songs/story-recordings) and
 * the URL is saved on the songs row via PATCH /api/songs/[id].
 */
export function SongStorySection({ song, onSaved }: SongStorySectionProps) {
  const [recordMode, setRecordMode] = useState<'video' | 'audio' | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasStory = Boolean(song.story_media_url)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Support /audio/songwriter/[songId]#story deep links (the section renders
  // after data loads, so the browser's native anchor scroll misses it)
  useEffect(() => {
    if (window.location.hash === '#story' && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const saveStory = async (s3Url: string, mediaType: 'video' | 'audio') => {
    setSaving(true)
    setError(null)
    try {
      const previousUrl = song.story_media_url

      const res = await fetch(`/api/songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_media_url: s3Url, story_media_type: mediaType }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save your story')
      }

      // Clean up the old file when replacing a story
      if (previousUrl && previousUrl !== s3Url) {
        deleteRecording(previousUrl).catch(() => {})
      }

      setRecordMode(null)
      setJustSaved(true)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your story')
    } finally {
      setSaving(false)
    }
  }

  const removeStory = async () => {
    if (!song.story_media_url) return
    setRemoving(true)
    setError(null)
    try {
      const previousUrl = song.story_media_url
      const res = await fetch(`/api/songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_media_url: null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to remove your story')
      }
      deleteRecording(previousUrl).catch(() => {})
      setJustSaved(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove your story')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div ref={sectionRef} id="story" className="scroll-mt-20">
    <Card variant="glass" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#00FFFF]" />
        <h3 className="text-sm font-medium text-neutral-300">The Story Behind This Song</h3>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Existing story playback */}
      {hasStory && !recordMode && (
        <div className="space-y-4">
          {justSaved && (
            <div className="flex items-center gap-2 text-sm text-[#39FF14]">
              <CheckCircle className="h-4 w-4" />
              Your story has been saved with this song.
            </div>
          )}

          {song.story_media_type === 'video' ? (
            <div className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: 16 / 9 }}>
              <video
                src={song.story_media_url!}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <audio src={song.story_media_url!} controls preload="metadata" className="w-full" />
          )}

          {song.story_recorded_at && (
            <p className="text-xs text-neutral-500">
              Recorded {new Date(song.story_recorded_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => {
                setJustSaved(false)
                setRecordMode(song.story_media_type === 'audio' ? 'audio' : 'video')
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Record New Story
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-[#FF0040] hover:bg-[rgba(255,0,64,0.1)]"
              onClick={removeStory}
              disabled={removing}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* No story yet - invite to record */}
      {!hasStory && !recordMode && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            Your song is done — now tell the story behind it. What inspired it? What shifted
            while you created it? Record it on video or audio and keep it with your song.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => setRecordMode('video')}
            >
              <Video className="h-4 w-4" />
              Record Video Story
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setRecordMode('audio')}
            >
              <Mic className="h-4 w-4" />
              Record Audio Story
            </Button>
          </div>
        </div>
      )}

      {/* Recorder */}
      {recordMode && (
        <div className="space-y-3">
          {saving ? (
            <div className="flex items-center gap-3 py-6 text-neutral-300">
              <Loader2 className="h-5 w-5 animate-spin text-[#39FF14]" />
              <span className="text-sm">Saving your story...</span>
            </div>
          ) : (
            <>
              <MediaRecorderComponent
                key={`song-story-${recordMode}`}
                mode={recordMode}
                recordingPurpose="support"
                storageFolder="songStoryRecordings"
                submitLabel="Save Story"
                category="song-story"
                instanceId={`${song.id}-${recordMode}`}
                recordingId={`song-${song.id}-story-${recordMode}`}
                enableEditor={false}
                onRecordingComplete={(_blob, _transcript, _shouldSaveFile, s3Url) => {
                  if (s3Url) {
                    saveStory(s3Url, recordMode)
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRecordMode(recordMode === 'video' ? 'audio' : 'video')}
                  className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  {recordMode === 'video' ? <Mic className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  {recordMode === 'video' ? 'Record audio instead' : 'Record video instead'}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordMode(null)}
                  className="text-sm text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
    </div>
  )
}
