'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Container, Button, Card, PageHero } from '@/lib/design-system'
import { VideoRecorder } from '@/components/VideoRecorder'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import type { User } from '@supabase/supabase-js'

export default function UploadDebugPage() {
  const [user, setUser] = useState<User | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  // File upload state
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get user on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        addLog(`👤 Logged in as ${user.id.substring(0, 8)}...`)
      }
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
      `=== Upload Debug Log ===`,
      `Date: ${new Date().toLocaleString()}`,
      `User Agent: ${navigator.userAgent}`,
      `Tab: ${activeTab}`,
      ``,
      ...debugLogs
    ].join('\n')
    navigator.clipboard.writeText(text)
    addLog('📋 Logs copied to clipboard!')
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    
    addLog(`📁 FILES SELECTED: ${selectedFiles.length}`)
    selectedFiles.forEach((f, i) => {
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      addLog(`File ${i + 1}:`)
      addLog(`  Name: ${f.name}`)
      addLog(`  Size: ${(f.size / 1024 / 1024).toFixed(2)} MB (${f.size.toLocaleString()} bytes)`)
      addLog(`  MIME Type: "${f.type}" ${f.type ? '' : '⚠️ EMPTY!'}`)
      addLog(`  Extension: .${f.name.split('.').pop()}`)
      addLog(`  Last Modified: ${new Date(f.lastModified).toLocaleString()}`)
    })
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!user) {
      addLog('❌ ERROR: Not logged in')
      return
    }
    if (files.length === 0) {
      addLog('❌ ERROR: No files selected')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    addLog(``)
    addLog(`🚀 STARTING UPLOAD`)
    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addLog(`User ID: ${user.id}`)
    addLog(`Folder: journal`)
    addLog(`File count: ${files.length}`)

    try {
      const startTime = Date.now()
      
      const results = await uploadMultipleUserFiles(
        'journal',
        files,
        user.id,
        (progress) => {
          setUploadProgress(Math.round(progress))
          if (Math.round(progress) % 10 === 0) {
            addLog(`📊 Progress: ${Math.round(progress)}%`)
          }
        }
      )

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      addLog(``)
      addLog(`📦 UPLOAD COMPLETE (${duration}s)`)
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      results.forEach((result, i) => {
        if (result.error) {
          addLog(`❌ File ${i + 1} FAILED:`)
          addLog(`   Error: ${result.error}`)
          addLog(`   Friendly: ${getUploadErrorMessage(new Error(result.error))}`)
        } else {
          addLog(`✅ File ${i + 1} SUCCESS:`)
          addLog(`   Key: ${result.key}`)
          addLog(`   URL: ${result.url?.substring(0, 80)}...`)
          if (result.url && files[i]?.type.startsWith('video/')) {
            setSavedVideoUrl(result.url)
          }
        }
      })

      const successCount = results.filter(r => !r.error).length
      const failCount = results.filter(r => r.error).length
      addLog(``)
      addLog(`📈 SUMMARY: ${successCount} succeeded, ${failCount} failed`)
      
      // Clear files after upload
      setFiles([])

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      addLog(``)
      addLog(`💥 EXCEPTION THROWN`)
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      addLog(`Message: ${errorMsg}`)
      addLog(`Stack: ${error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : 'N/A'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Container size="lg" className="py-8">
      <PageHero
        title="🐛 Upload Debug Tool"
        subtitle="Test file uploads and video recording"
      />

      {/* Device Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Device Info</h2>
        <div className="text-sm text-neutral-400 font-mono bg-black rounded p-3 overflow-x-auto">
          <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
          <p>Logged in: {user ? `Yes (${user.id.substring(0, 8)}...)` : 'No ⚠️'}</p>
        </div>
      </Card>

      {/* Tab Selection */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveTab('upload')}
          variant={activeTab === 'upload' ? 'primary' : 'outline'}
          className="flex-1"
        >
          📁 Upload File
        </Button>
        <Button
          onClick={() => setActiveTab('record')}
          variant={activeTab === 'record' ? 'primary' : 'outline'}
          className="flex-1"
        >
          🎬 Record Video
        </Button>
      </div>

      {!user ? (
        <Card className="p-6 mb-6">
          <p className="text-red-400">⚠️ You must be logged in to test uploads</p>
        </Card>
      ) : (
        <>
          {/* FILE UPLOAD TAB */}
          {activeTab === 'upload' && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">1. Select File from iPhone</h2>
              <p className="text-sm text-neutral-400 mb-4">
                This tests uploading existing videos from your photo library.
              </p>
              
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-neutral-400
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-green file:text-white
                  hover:file:bg-brand-green/80
                  file:cursor-pointer cursor-pointer
                  mb-4"
              />
              
              {files.length > 0 && (
                <div className="p-3 bg-neutral-800 rounded mb-4">
                  <p className="text-sm text-neutral-300">
                    {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || files.length === 0}
                  variant="primary"
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : 'Start Upload'}
                </Button>
                
                {isUploading && (
                  <div className="flex-1">
                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-green transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* VIDEO RECORD TAB */}
          {activeTab === 'record' && (
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Record Video</h2>
                
                {/* Camera Selection */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFacingMode('user')}
                    variant={facingMode === 'user' ? 'primary' : 'outline'}
                    size="sm"
                  >
                    🤳 Front
                  </Button>
                  <Button
                    onClick={() => setFacingMode('environment')}
                    variant={facingMode === 'environment' ? 'primary' : 'outline'}
                    size="sm"
                  >
                    📷 Back
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-neutral-400 mb-4">
                This records directly in the browser (bypasses iOS "Preparing..." phase).
              </p>
              
              <VideoRecorder
                key={facingMode} // Force remount when camera changes
                storageFolder="journalVideoRecordings"
                maxDuration={120}
                facingMode={facingMode}
                onRecordingStart={() => {
                  addLog(`🎬 Recording started (${facingMode} camera)`)
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
        </>
      )}

      {/* Saved Video Preview */}
      {savedVideoUrl && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Saved Video</h2>
          <video 
            src={savedVideoUrl} 
            controls 
            playsInline
            className="w-full max-w-md rounded-lg"
          />
          <p className="mt-2 text-xs text-neutral-500 break-all">{savedVideoUrl}</p>
        </Card>
      )}

      {/* Debug Logs */}
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
        
        <div className="max-h-96 overflow-y-auto bg-black rounded p-4 font-mono text-xs">
          {debugLogs.length === 0 ? (
            <p className="text-neutral-500">Select a file or start recording to see logs...</p>
          ) : (
            debugLogs.map((log, i) => (
              <div 
                key={i} 
                className={`whitespace-pre-wrap ${
                  log.includes('❌') || log.includes('💥') 
                    ? 'text-red-400' 
                    : log.includes('✅') 
                      ? 'text-green-400' 
                      : log.includes('━') 
                        ? 'text-neutral-600'
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
