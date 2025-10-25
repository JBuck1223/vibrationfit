'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/lib/design-system/components'

interface MediaConvertStatusProps {
  jobId: string
  onComplete?: (outputs: string[]) => void
  onError?: (error: string) => void
}

interface JobStatus {
  jobId: string
  status: string
  progress: number
  outputs: Array<{ url: string; status: string }>
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

export function MediaConvertStatus({ jobId, onComplete, onError }: MediaConvertStatusProps) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!jobId || !isPolling) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/upload/mediaconvert-status?jobId=${jobId}`)
        const data = await response.json()

        if (response.ok) {
          setStatus(data)
          
          if (data.status === 'COMPLETE') {
            setIsPolling(false)
            const outputUrls = data.outputs.map((output: any) => output.url).filter(Boolean)
            onComplete?.(outputUrls)
          } else if (data.status === 'ERROR' || data.status === 'CANCELED') {
            setIsPolling(false)
            onError?.(data.errorMessage || 'Processing failed')
          }
        } else {
          console.error('Status check failed:', data.error)
        }
      } catch (error) {
        console.error('Error checking MediaConvert status:', error)
      }
    }

    // Check immediately
    checkStatus()

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [jobId, isPolling, onComplete, onError])

  if (!status) {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
        <Spinner variant="primary" size="sm" />
        <span className="text-primary-500 font-medium">Checking processing status...</span>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PROGRESSING':
        return 'text-yellow-500'
      case 'COMPLETE':
        return 'text-green-500'
      case 'ERROR':
      case 'CANCELED':
        return 'text-red-500'
      default:
        return 'text-neutral-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PROGRESSING':
        return '⏳'
      case 'COMPLETE':
        return '✅'
      case 'ERROR':
      case 'CANCELED':
        return '❌'
      default:
        return '⏸️'
    }
  }

  return (
    <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Video Processing Status</h3>
        <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
          {getStatusIcon(status.status)} {status.status}
        </span>
      </div>

      {status.status === 'PROGRESSING' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-neutral-400 mb-1">
            <span>Processing...</span>
            <span>{status.progress}%</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {status.status === 'COMPLETE' && status.outputs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-green-500 font-medium">✅ Processing Complete!</p>
          <div className="space-y-1">
            {status.outputs.map((output, index) => (
              <div key={index} className="text-sm text-neutral-300">
                <span className="text-green-500">✓</span> Output {index + 1}: {output.status}
              </div>
            ))}
          </div>
        </div>
      )}

      {status.status === 'ERROR' && (
        <div className="text-red-500 text-sm">
          <p className="font-medium">❌ Processing Failed</p>
          {status.errorMessage && (
            <p className="mt-1 text-red-400">{status.errorMessage}</p>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-neutral-700">
        <div className="text-xs text-neutral-500">
          <p>Job ID: {status.jobId}</p>
          <p>Started: {new Date(status.createdAt).toLocaleString()}</p>
          {status.completedAt && (
            <p>Completed: {new Date(status.completedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
