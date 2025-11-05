// Custom hook for fetching and managing storage data
'use client'

import { useState, useEffect } from 'react'

interface StorageData {
  totalFiles: number
  totalSize: number
  storageByType: Record<string, {
    count: number
    totalSize: number
    files: any[]
  }>
  recentFiles: Array<{
    name: string
    path: string
    size: number
    created_at: string
  }>
}

interface UseStorageDataReturn {
  data: StorageData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStorageData(): UseStorageDataReturn {
  const [data, setData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStorageData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout to prevent hanging (5 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/storage/usage', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        // Don't throw error, just set error state and return empty data
        console.warn('Storage API not available:', response.status, response.statusText)
        setData({
          totalFiles: 0,
          totalSize: 0,
          storageByType: {},
          recentFiles: []
        })
        setError('Storage service unavailable')
        return
      }

      const storageData = await response.json()
      setData(storageData)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Storage fetch timed out after 5 seconds')
      } else {
        console.warn('Error fetching storage data:', err)
      }
      // Set empty data instead of throwing error - don't block UI
      setData({
        totalFiles: 0,
        totalSize: 0,
        storageByType: {},
        recentFiles: []
      })
      setError('Storage service unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Don't block initial render - fetch storage data asynchronously
    fetchStorageData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchStorageData
  }
}
