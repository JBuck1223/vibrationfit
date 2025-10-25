import { useState, useEffect } from 'react'
import { Card, Button, ProgressBar, Badge } from '@/lib/design-system'
import { Upload, CheckCircle, Clock, AlertCircle, Minimize2 } from 'lucide-react'

interface UploadProgressProps {
  file: File
  onComplete: (url: string, key: string) => void
  onError: (error: string) => void
}

interface UploadStatus {
  status: 'uploading' | 'uploaded' | 'compressing' | 'completed' | 'error'
  progress: number
  message: string
  url?: string
  key?: string
  compression?: 'pending' | 'in-progress' | 'completed' | 'failed'
}

export function UploadProgress({ file, onComplete, onError }: UploadProgressProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'uploading',
    progress: 0,
    message: 'Preparing upload...'
  })

  const [compressionStatus, setCompressionStatus] = useState<{
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
    progress: number
    message: string
  }>({
    status: 'pending',
    progress: 0,
    message: ''
  })

  useEffect(() => {
    uploadFile()
  }, [])

  const uploadFile = async () => {
    try {
      setUploadStatus({
        status: 'uploading',
        progress: 10,
        message: 'Uploading file...'
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'journal') // or get from props
      formData.append('userId', 'current-user-id') // get from auth

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()

      if (result.status === 'uploaded' && result.compression === 'pending') {
        // File uploaded, compression in progress
        setUploadStatus({
          status: 'uploaded',
          progress: 100,
          message: 'Upload complete!',
          url: result.url,
          key: result.key
        })

        setCompressionStatus({
          status: 'in-progress',
          progress: 0,
          message: 'Compressing video for optimal playback...'
        })

        // Start polling for compression status
        pollCompressionStatus(result.key)
      } else {
        // File uploaded and processed
        setUploadStatus({
          status: 'completed',
          progress: 100,
          message: 'Upload complete!',
          url: result.url,
          key: result.key
        })

        onComplete(result.url, result.key)
      }

    } catch (error) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed'
      })
      onError(uploadStatus.message)
    }
  }

  const pollCompressionStatus = async (key: string) => {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        
        // Simulate compression progress (in real implementation, you'd check S3 metadata)
        const progress = Math.min(attempts * 2, 90) // Simulate progress
        
        setCompressionStatus({
          status: 'in-progress',
          progress,
          message: `Compressing video... ${progress}%`
        })

        if (attempts >= maxAttempts) {
          setCompressionStatus({
            status: 'failed',
            progress: 0,
            message: 'Compression timeout - using original file'
          })
          return
        }

        // In real implementation, check S3 metadata for compression status
        // For now, simulate completion after 30 seconds
        if (attempts >= 30) {
          setCompressionStatus({
            status: 'completed',
            progress: 100,
            message: 'Compression complete!'
          })

          setUploadStatus({
            status: 'completed',
            progress: 100,
            message: 'Upload and compression complete!',
            url: uploadStatus.url,
            key: uploadStatus.key
          })

          onComplete(uploadStatus.url!, uploadStatus.key!)
          return
        }

        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        setCompressionStatus({
          status: 'failed',
          progress: 0,
          message: 'Compression failed - using original file'
        })
      }
    }

    setTimeout(poll, 2000) // Start polling after 2 seconds
  }

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return <Upload className="w-5 h-5 animate-pulse" />
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getCompressionIcon = () => {
    switch (compressionStatus.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-neutral-400" />
      case 'in-progress':
        return <Minimize2 className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getCompressionBadge = () => {
    switch (compressionStatus.status) {
      case 'pending':
        return <Badge variant="info">Pending</Badge>
      case 'in-progress':
        return <Badge variant="info">Compressing</Badge>
      case 'completed':
        return <Badge variant="success">Optimized</Badge>
      case 'failed':
        return <Badge variant="warning">Original</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* File Info */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium text-white">{file.name}</div>
            <div className="text-sm text-neutral-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          {getCompressionBadge()}
        </div>

        {/* Upload Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">Upload Progress</span>
            <span className="text-neutral-400">{uploadStatus.progress}%</span>
          </div>
          <ProgressBar 
            value={uploadStatus.progress} 
            variant="primary" 
            className="h-2"
          />
          <div className="text-sm text-neutral-400">{uploadStatus.message}</div>
        </div>

        {/* Compression Progress (only for videos) */}
        {file.type.startsWith('video/') && compressionStatus.status !== 'pending' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getCompressionIcon()}
              <span className="text-sm text-neutral-300">Video Optimization</span>
            </div>
            <ProgressBar 
              value={compressionStatus.progress} 
              variant="secondary" 
              className="h-2"
            />
            <div className="text-sm text-neutral-400">{compressionStatus.message}</div>
          </div>
        )}

        {/* Status Messages */}
        {uploadStatus.status === 'error' && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-red-400 text-sm">{uploadStatus.message}</div>
          </div>
        )}

        {compressionStatus.status === 'failed' && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-yellow-400 text-sm">
              Video compression failed. Using original file - it may take longer to load.
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
