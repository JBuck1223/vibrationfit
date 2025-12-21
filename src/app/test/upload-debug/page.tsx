'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Container, Button, Card, PageHero } from '@/lib/design-system'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import type { User } from '@supabase/supabase-js'

export default function UploadDebugPage() {
  const [user, setUser] = useState<User | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload')
  const [userAgent, setUserAgent] = useState<string>('Loading...')
  
  // File upload state
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get user and device info on mount (client-side only)
  useEffect(() => {
    // Set user agent on client
    setUserAgent(navigator.userAgent)
    
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

  // Direct multipart upload test (bypasses uploadMultipleUserFiles)
  const testMultipartUpload = async (file: File) => {
    addLog(`🧪 Testing multipart upload directly...`)
    
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase()
    const key = `user-uploads/${user!.id}/journal/uploads/${timestamp}-${randomStr}-${sanitizedName}`
    
    addLog(`   Key: ${key}`)
    
    // Step 1: Create multipart upload
    addLog(`📤 Step 1: Creating multipart upload...`)
    try {
      const createResponse = await fetch('/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          key,
          fileType: file.type,
          fileName: file.name,
        }),
      })
      
      addLog(`   Response status: ${createResponse.status}`)
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        addLog(`❌ Create multipart failed: ${errorText}`)
        return null
      }
      
      const { uploadId } = await createResponse.json()
      addLog(`✅ Multipart created: ${uploadId}`)
      
      // Step 2: Test getting presigned URL for part 1
      addLog(`📤 Step 2: Getting presigned URL for part 1...`)
      const partUrlResponse = await fetch('/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getPartUrl',
          key,
          uploadId,
          partNumber: 1,
        }),
      })
      
      addLog(`   Response status: ${partUrlResponse.status}`)
      
      if (!partUrlResponse.ok) {
        const errorText = await partUrlResponse.text()
        addLog(`❌ Get part URL failed: ${errorText}`)
        return null
      }
      
      const { presignedUrl } = await partUrlResponse.json()
      addLog(`✅ Got presigned URL: ${presignedUrl.substring(0, 80)}...`)
      
      // Step 3: Try uploading first 10MB chunk using XHR for better error info
      addLog(`📤 Step 3: Uploading first 10MB chunk...`)
      const chunk = file.slice(0, 10 * 1024 * 1024) // First 10MB
      addLog(`   Chunk size: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`)
      addLog(`   Presigned URL host: ${new URL(presignedUrl).host}`)
      
      try {
        // Use XHR for better error details
        const uploadResult = await new Promise<{ success: boolean; status?: number; error?: string }>((resolve) => {
          const xhr = new XMLHttpRequest()
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              if (pct % 25 === 0) addLog(`   📊 Chunk progress: ${pct}%`)
            }
          }
          
          xhr.onload = () => {
            addLog(`   XHR onload: status=${xhr.status} statusText=${xhr.statusText}`)
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader('ETag')
              addLog(`✅ Chunk uploaded! ETag: ${etag}`)
              resolve({ success: true, status: xhr.status })
            } else {
              addLog(`❌ XHR failed: ${xhr.status} ${xhr.statusText}`)
              addLog(`   Response: ${xhr.responseText?.substring(0, 200)}`)
              resolve({ success: false, status: xhr.status, error: xhr.statusText })
            }
          }
          
          xhr.onerror = () => {
            addLog(`❌ XHR onerror triggered (usually CORS)`)
            addLog(`   readyState: ${xhr.readyState}`)
            addLog(`   status: ${xhr.status}`)
            addLog(`   statusText: ${xhr.statusText || '(empty)'}`)
            resolve({ success: false, error: 'Network/CORS error' })
          }
          
          xhr.ontimeout = () => {
            addLog(`❌ XHR timeout`)
            resolve({ success: false, error: 'Timeout' })
          }
          
          xhr.onabort = () => {
            addLog(`❌ XHR aborted`)
            resolve({ success: false, error: 'Aborted' })
          }
          
          xhr.timeout = 60000 // 60 seconds
          xhr.open('PUT', presignedUrl)
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
          addLog(`   Sending XHR PUT request...`)
          xhr.send(chunk)
        })
        
        if (uploadResult.success) {
          return { uploadId, key, success: true }
        } else {
          return null
        }
      } catch (chunkError) {
        addLog(`💥 Chunk upload exception: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`)
        return null
      }
      
    } catch (error) {
      addLog(`💥 Multipart test exception: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
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
    
    const file = files[0]
    const fileSizeMB = file.size / 1024 / 1024
    
    // Determine which upload path will be used
    if (fileSizeMB > 100) {
      addLog(`📦 File > 100MB → Will use MULTIPART upload`)
    } else if (fileSizeMB > 0.5) {
      addLog(`📦 File > 500KB → Will use PRESIGNED URL upload`)
    } else {
      addLog(`📦 File < 500KB → Will use API ROUTE upload`)
    }

    try {
      const startTime = Date.now()
      
      // For large files, first test the multipart flow step by step
      if (fileSizeMB > 100) {
        addLog(``)
        addLog(`🧪 TESTING MULTIPART FLOW (step by step)`)
        addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        const testResult = await testMultipartUpload(file)
        if (!testResult) {
          addLog(`❌ Multipart test failed - skipping full upload`)
          setIsUploading(false)
          return
        }
        addLog(`✅ Multipart test passed!`)
        addLog(``)
        addLog(`📤 Now running full upload...`)
      }
      
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
          <p>User Agent: {userAgent}</p>
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
              <h2 className="text-lg font-semibold text-white mb-2">Record Video</h2>
              <p className="text-sm text-neutral-400 mb-4">
                Records directly in the browser with live preview. Tap 📷 to switch cameras, tap ⛶ for fullscreen.
              </p>
              
              <MediaRecorderComponent
                mode="video"
                maxDuration={300}
                storageFolder="journalVideoRecordings"
                recordingPurpose="withFile"
                showSaveOption={false}
                category="test-video"
                initialFacingMode="user"
                allowCameraSwitch={true}
                fullscreenVideo={true}
                onRecordingComplete={(blob, transcript, shouldSave, s3Url) => {
                  addLog(`✅ Video recording complete!`)
                  addLog(`   Blob size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
                  if (s3Url) {
                    addLog(`   S3 URL: ${s3Url.substring(0, 60)}...`)
                    setSavedVideoUrl(s3Url)
                  }
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
