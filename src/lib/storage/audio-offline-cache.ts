/**
 * IndexedDB cache for offline audio playback.
 * Stores full audio file blobs so tracks play without network.
 */

const DB_NAME = 'vibrationfit-audio-cache'
const DB_VERSION = 1
const STORE_NAME = 'audio-files'

export interface CachedTrackMetadata {
  trackId: string
  title: string
  duration: number
  originalUrl: string
  cachedAt: number
  sizeBytes: number
}

interface CachedTrackRecord extends CachedTrackMetadata {
  blob: Blob
}

let dbInstance: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error('Failed to open audio cache database'))

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'trackId' })
      }
    }
  })
}

export async function cacheAudioTrack(
  trackId: string,
  blob: Blob,
  metadata: { title: string; duration: number; originalUrl: string }
): Promise<void> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record: CachedTrackRecord = {
      trackId,
      blob,
      title: metadata.title,
      duration: metadata.duration,
      originalUrl: metadata.originalUrl,
      cachedAt: Date.now(),
      sizeBytes: blob.size,
    }

    await new Promise<void>((resolve, reject) => {
      const req = store.put(record)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(new Error('Failed to cache audio track'))
    })
  } catch (error) {
    console.error('Failed to cache audio track:', error)
    throw error
  }
}

export async function getCachedAudio(trackId: string): Promise<Blob | null> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const req = store.get(trackId)
      req.onsuccess = () => {
        const record = req.result as CachedTrackRecord | undefined
        resolve(record?.blob ?? null)
      }
      req.onerror = () => reject(new Error('Failed to read cached audio'))
    })
  } catch (error) {
    console.error('Failed to get cached audio:', error)
    return null
  }
}

export async function isTrackCached(trackId: string): Promise<boolean> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve) => {
      const req = store.count(IDBKeyRange.only(trackId))
      req.onsuccess = () => resolve(req.result > 0)
      req.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

export async function getCachedTrackIds(): Promise<string[]> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const req = store.getAllKeys()
      req.onsuccess = () => resolve(req.result as string[])
      req.onerror = () => reject(new Error('Failed to list cached track IDs'))
    })
  } catch (error) {
    console.error('Failed to get cached track IDs:', error)
    return []
  }
}

export async function removeCachedTrack(trackId: string): Promise<void> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const req = store.delete(trackId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(new Error('Failed to remove cached track'))
    })
  } catch (error) {
    console.error('Failed to remove cached track:', error)
  }
}

export async function clearAllCachedAudio(): Promise<void> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(new Error('Failed to clear audio cache'))
    })
  } catch (error) {
    console.error('Failed to clear audio cache:', error)
  }
}

export async function getCacheStorageUsage(): Promise<{ count: number; estimatedBytes: number }> {
  try {
    const db = await initDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => {
        const records = req.result as CachedTrackRecord[]
        const estimatedBytes = records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0)
        resolve({ count: records.length, estimatedBytes })
      }
      req.onerror = () => reject(new Error('Failed to get cache usage'))
    })
  } catch (error) {
    console.error('Failed to get cache storage usage:', error)
    return { count: 0, estimatedBytes: 0 }
  }
}
