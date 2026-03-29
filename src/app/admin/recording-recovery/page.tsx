'use client'

import { useState, useEffect, useRef } from 'react'
import { Container, Card, Button, Stack, PageHero, Spinner, Text } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Download, Play, Pause, Trash2, HardDrive, Clock, Mic, Video, AlertTriangle } from 'lucide-react'

interface SavedRecording {
  id: string
  category: string
  chunks: Blob[]
  duration: number
  mode: 'audio' | 'video'
  timestamp: number
  blob?: Blob
  transcript?: string
}

const DB_NAME = 'vibrationfit-recordings'
const DB_VERSION = 1
const STORE_NAME = 'recordings'

async function getAllRecordings(): Promise<SavedRecording[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error('Could not open IndexedDB'))

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const getAll = store.getAll()

      getAll.onsuccess = () => {
        const recordings = (getAll.result || []) as SavedRecording[]
        recordings.sort((a, b) => b.timestamp - a.timestamp)
        resolve(recordings)
      }
      getAll.onerror = () => reject(new Error('Failed to read recordings'))
    }
  })
}

async function deleteRecording(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const del = store.delete(id)
      del.onsuccess = () => resolve()
      del.onerror = () => reject(new Error('Failed to delete recording'))
    }
    request.onerror = () => reject(new Error('Could not open IndexedDB'))
  })
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(blob: Blob): string {
  const mb = blob.size / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(blob.size / 1024).toFixed(0)} KB`
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function RecordingCard({ recording, onDelete }: { recording: SavedRecording; onDelete: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const blob = recording.blob || new Blob(recording.chunks, {
    type: recording.mode === 'video' ? 'video/webm' : 'audio/webm'
  })

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const getObjectUrl = () => {
    if (!objectUrlRef.current) {
      objectUrlRef.current = URL.createObjectURL(blob)
    }
    return objectUrlRef.current
  }

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getObjectUrl())
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      }
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleDownload = () => {
    const url = getObjectUrl()
    const ext = recording.mode === 'video' ? 'webm' : 'webm'
    const date = new Date(recording.timestamp).toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${recording.category}-${date}.${ext}`
    a.click()
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    await onDelete()
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {recording.mode === 'video' ? (
              <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            ) : (
              <Mic className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
            )}
            <Text className="font-medium text-white capitalize">
              {recording.category} {recording.mode}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(recording.duration)}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(blob)}
            </span>
            <span>{formatTimeAgo(recording.timestamp)}</span>
            <span className="text-neutral-600">
              {new Date(recording.timestamp).toLocaleString()}
            </span>
          </div>

          {recording.transcript && (
            <div className="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg mb-3">
              <Text size="xs" className="text-neutral-400 mb-1">Transcript</Text>
              <Text size="sm" className="text-neutral-300 line-clamp-3">
                {recording.transcript}
              </Text>
            </div>
          )}

          {/* Playback bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-full transition-colors flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>

            <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#39FF14] rounded-full transition-all duration-200"
                style={{
                  width: recording.duration > 0
                    ? `${(currentTime / recording.duration) * 100}%`
                    : '0%'
                }}
              />
            </div>

            <Text size="xs" className="text-neutral-500 tabular-nums flex-shrink-0">
              {formatDuration(currentTime)} / {formatDuration(recording.duration)}
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            variant={confirmDelete ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {confirmDelete ? 'Confirm' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function RecordingRecoveryPage() {
  const [recordings, setRecordings] = useState<SavedRecording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecordings = async () => {
    try {
      setLoading(true)
      setError(null)
      const recs = await getAllRecordings()
      setRecordings(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access IndexedDB')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecordings()
  }, [])

  const handleDelete = async (id: string) => {
    await deleteRecording(id)
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  return (
    <AdminWrapper>
      <Container size="md" className="py-8">
        <PageHero
          title="Recording Recovery"
          subtitle="Recover audio and video recordings saved in this browser's local storage"
        />

        <Stack gap="md" className="mt-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <Card className="p-6 border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <Text className="text-red-400 font-medium">Could not access recordings</Text>
                  <Text size="sm" className="text-neutral-400 mt-1">{error}</Text>
                </div>
              </div>
            </Card>
          )}

          {!loading && !error && recordings.length === 0 && (
            <Card className="p-8 text-center">
              <Mic className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
              <Text className="text-neutral-400">No saved recordings found in this browser</Text>
              <Text size="sm" className="text-neutral-600 mt-1">
                Recordings are stored per-device. Check the browser where you originally recorded.
              </Text>
            </Card>
          )}

          {!loading && recordings.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Text size="sm" className="text-neutral-400">
                  {recordings.length} recording{recordings.length !== 1 ? 's' : ''} found
                </Text>
                <Button variant="ghost" size="sm" onClick={loadRecordings}>
                  Refresh
                </Button>
              </div>

              {recordings.map(rec => (
                <RecordingCard
                  key={rec.id}
                  recording={rec}
                  onDelete={() => handleDelete(rec.id)}
                />
              ))}
            </>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
