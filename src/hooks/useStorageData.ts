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
      
      const response = await fetch('/api/storage/usage')
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage data')
      }

      const storageData = await response.json()
      setData(storageData)
    } catch (err) {
      console.error('Error fetching storage data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorageData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchStorageData
  }
}
