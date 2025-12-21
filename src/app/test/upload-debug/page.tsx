'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Container, Button, Card, PageHero } from '@/lib/design-system'
import { VideoRecorder } from '@/components/VideoRecorder'
import type { User } from '@supabase/supabase-js'

export default function UploadDebugPage() {
  const [user, setUser] = useState<User | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)

  // Get user on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    setDebugLogs(prev => [...prev, logEntry].slice(-100))
  }

  const copyLogs = () => {
    const text = [
      `=== Video Recorder Debug Log ===`,
      `Date: ${new Date().toLocaleString()}`,
      `User Agent: ${navigator.userAgent}`,
      ``,
      ...debugLogs
    ].join('\n')
    navigator.clipboard.writeText(text)
    addLog('📋 Logs copied to clipboard!')
  }

  return (
    <Container size="lg" className="py-8">
      <PageHero
        title="🎬 Video Recorder Test"
        subtitle="Test recording and uploading videos"
      />

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Device Info</h2>
        <div className="text-sm text-neutral-400 font-mono bg-black rounded p-3 overflow-x-auto">
          <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
          <p>Logged in: {user ? `Yes (${user.id.substring(0, 8)}...)` : 'No'}</p>
        </div>
      </Card>

      {!user ? (
        <Card className="p-6 mb-6">
          <p className="text-red-400">⚠️ You must be logged in to test video recording</p>
        </Card>
      ) : (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Video Recorder</h2>
          <VideoRecorder
            storageFolder="journalVideoRecordings"
            maxDuration={60}
            onRecordingStart={() => {
              addLog('🎬 Recording started')
            }}
            onRecordingStop={(blob) => {
              addLog(`⏹️ Recording stopped - ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
            }}
            onProgress={(progress, status) => {
              addLog(`📊 ${status} (${Math.round(progress)}%)`)
            }}
            onVideoSaved={(url, duration) => {
              addLog(`✅ Video saved! Duration: ${duration}s`)
              addLog(`   URL: ${url.substring(0, 60)}...`)
              setSavedVideoUrl(url)
            }}
          />
        </Card>
      )}

      {savedVideoUrl && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Saved Video</h2>
          <video 
            src={savedVideoUrl} 
            controls 
            className="w-full max-w-md rounded-lg"
          />
          <p className="mt-2 text-xs text-neutral-500 break-all">{savedVideoUrl}</p>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Debug Logs</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setDebugLogs([])}
              variant="ghost"
              className="text-xs"
            >
              Clear
            </Button>
            <Button
              onClick={copyLogs}
              variant="secondary"
              className="text-xs"
            >
              Copy Logs
            </Button>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto bg-black rounded p-4 font-mono text-xs">
          {debugLogs.length === 0 ? (
            <p className="text-neutral-500">Start recording to see logs...</p>
          ) : (
            debugLogs.map((log, i) => (
              <div 
                key={i} 
                className={`whitespace-pre-wrap ${
                  log.includes('❌') || log.includes('💥') 
                    ? 'text-red-400' 
                    : log.includes('✅') 
                      ? 'text-green-400' 
                      : 'text-neutral-300'
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </Card>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Test page only. Go to <a href="/journal/new" className="text-brand-green underline">/journal/new</a> for the real app.
      </p>
    </Container>
  )
}
