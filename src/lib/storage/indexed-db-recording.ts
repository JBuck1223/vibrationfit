/**
 * IndexedDB utilities for auto-saving recording chunks
 * Prevents data loss on browser crashes/closes
 */

const DB_NAME = 'vibrationfit-recordings'
const DB_VERSION = 1
const STORE_NAME = 'recordings'

interface SavedRecording {
  id: string
  category: string
  chunks: Blob[]
  duration: number
  mode: 'audio' | 'video'
  timestamp: number
  blob?: Blob // Stored blob if recording is complete
  transcript?: string // Transcript if available
}

let dbInstance: IDBDatabase | null = null

/**
 * Initialize IndexedDB database
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('category', 'category', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Save recording chunks to IndexedDB
 */
export async function saveRecordingChunks(
  recordingId: string,
  category: string,
  chunks: Blob[],
  duration: number,
  mode: 'audio' | 'video',
  blob?: Blob,
  transcript?: string
): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const recording: SavedRecording = {
      id: recordingId,
      category,
      chunks,
      duration,
      mode,
      timestamp: Date.now(),
      blob,
      transcript
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(recording)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save recording chunks'))
    })

    console.log('✅ Saved recording chunks to IndexedDB:', { recordingId, chunkCount: chunks.length, duration })
  } catch (error) {
    console.error('❌ Failed to save recording chunks:', error)
    // Don't throw - auto-save is a backup feature, shouldn't break recording
  }
}

/**
 * Load saved recording from IndexedDB
 */
export async function loadSavedRecording(recordingId: string): Promise<SavedRecording | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(recordingId)
      request.onsuccess = () => {
        const recording = request.result || null
        if (recording) {
          console.log('✅ Loaded saved recording from IndexedDB:', { recordingId, duration: recording.duration })
        }
        resolve(recording)
      }
      request.onerror = () => reject(new Error('Failed to load recording'))
    })
  } catch (error) {
    console.error('❌ Failed to load saved recording:', error)
    return null
  }
}

/**
 * Get all saved recordings for a category
 */
export async function getRecordingsForCategory(category: string): Promise<SavedRecording[]> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('category')

    return new Promise((resolve, reject) => {
      const request = index.getAll(category)
      request.onsuccess = () => {
        const recordings = request.result || []
        // Sort by timestamp, newest first
        recordings.sort((a, b) => b.timestamp - a.timestamp)
        resolve(recordings)
      }
      request.onerror = () => reject(new Error('Failed to get recordings'))
    })
  } catch (error) {
    console.error('❌ Failed to get recordings for category:', error)
    return []
  }
}

/**
 * Delete saved recording from IndexedDB
 */
export async function deleteSavedRecording(recordingId: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(recordingId)
      request.onsuccess = () => {
        console.log('✅ Deleted saved recording from IndexedDB:', recordingId)
        resolve()
      }
      request.onerror = () => reject(new Error('Failed to delete recording'))
    })
  } catch (error) {
    console.error('❌ Failed to delete saved recording:', error)
    // Don't throw - deletion failure is not critical
  }
}

/**
 * Clear old recordings (older than 24 hours)
 */
export async function clearOldRecordings(olderThanHours: number = 24): Promise<number> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')

    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    let deletedCount = 0

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          if (deletedCount > 0) {
            console.log(`✅ Cleared ${deletedCount} old recordings from IndexedDB`)
          }
          resolve(deletedCount)
        }
      }
      
      request.onerror = () => reject(new Error('Failed to clear old recordings'))
    })
  } catch (error) {
    console.error('❌ Failed to clear old recordings:', error)
    return 0
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{ quota: number; usage: number; available: number } | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      }
    }
    return null
  } catch (error) {
    console.error('❌ Failed to get storage estimate:', error)
    return null
  }
}

/**
 * Check if storage quota is getting low
 */
export async function isStorageLow(thresholdPercent: number = 80): Promise<boolean> {
  const estimate = await getStorageEstimate()
  if (!estimate || estimate.quota === 0) {
    return false // Can't determine, assume OK
  }

  const usagePercent = (estimate.usage / estimate.quota) * 100
  return usagePercent >= thresholdPercent
}

/**
 * Generate a unique recording ID
 */
export function generateRecordingId(category: string): string {
  return `recording-${category}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

