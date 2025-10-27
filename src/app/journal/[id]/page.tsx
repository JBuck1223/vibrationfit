'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button, Badge, ActionButtons, DeleteConfirmationDialog } from '@/lib/design-system'
import { OptimizedImage } from '@/components/OptimizedImage'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, Tag, X, Download, Play, Volume2, Edit, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface JournalEntry {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  categories: string[]
  image_urls: string[]
  thumbnail_urls?: string[]
  audio_recordings: any[]
  created_at: string
  updated_at: string
}

export default function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string; index: number } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [processedVideoUrls, setProcessedVideoUrls] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: entryData, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error || !entryData) {
        router.push('/journal')
        return
      }

      setEntry(entryData)
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  // Check for processed video URLs after entry is loaded
  useEffect(() => {
    if (!entry) return

    async function checkProcessedVideos() {
      if (!entry) return
      const processedUrls: Record<string, string> = {}
      
      if (entry.image_urls) {
        for (const url of entry.image_urls) {
          if (getFileType(url) === 'video') {
            const processedUrl = await getProcessedVideoUrl(url)
            if (processedUrl !== url) {
              processedUrls[url] = processedUrl
            }
          }
        }
      }
      
      setProcessedVideoUrls(processedUrls)
    }

    checkProcessedVideos()
  }, [entry])

  const getFileType = (url: string): 'image' | 'video' | 'audio' | 'unknown' => {
    const ext = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) return 'video'
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return 'audio'
    return 'unknown'
  }

  // Check for processed video URLs (tries 1080p first, then 720p, then original)
  const getProcessedVideoUrl = async (originalUrl: string) => {
    try {
      // Extract the S3 key from the original URL
      const urlParts = originalUrl.split('/')
      const s3Key = urlParts.slice(urlParts.indexOf('user-uploads')).join('/')
      
      // Extract the folder structure to determine where processed files should be
      const s3KeyParts = s3Key.split('/')
      
      // Get just the base filename without path
      const baseFilename = s3KeyParts[s3KeyParts.length - 1]
      const filenameWithoutExt = baseFilename.replace(/\.[^/.]+$/, '')
      
      // Build processed URLs: same path, add /processed/ folder with quality suffix
      const processedPath = s3KeyParts.slice(0, -1).join('/')
      
      // Try 1080p (default quality), then 720p as fallback
      const processedFilename = `${filenameWithoutExt}-1080p.mp4`
      const processedKey = `${processedPath}/processed/${processedFilename}`
      const processedUrl = `https://media.vibrationfit.com/${processedKey}`
      
      console.log(`🔗 Checking 1080p processed URL:`, processedUrl)
      
      try {
        const response = await fetch(processedUrl, { method: 'HEAD' })
        
        if (response.ok) {
          console.log(`✅ Using 1080p processed video:`, processedUrl)
          return processedUrl
        }
      } catch (fetchError) {
        console.log(`❌ Fetch error for 1080p, trying 720p:`, fetchError)
      }
      
      // Fallback to 720p
      const fallbackFilename = `${filenameWithoutExt}-720p.mp4`
      const fallbackKey = `${processedPath}/processed/${fallbackFilename}`
      const fallbackUrl = `https://media.vibrationfit.com/${fallbackKey}`
      
      console.log(`🔗 Checking 720p fallback URL:`, fallbackUrl)
      
      try {
        const response = await fetch(fallbackUrl, { method: 'HEAD' })
        
        if (response.ok) {
          console.log(`✅ Using 720p fallback video:`, fallbackUrl)
          return fallbackUrl
        }
      } catch (fetchError) {
        console.log(`❌ Fetch error for 720p:`, fetchError)
      }
      
      console.log('No processed video found, using original')
    } catch (error) {
      console.log('Error checking processed video:', error)
    }
    
    return originalUrl
  }

  const openLightbox = (url: string, index: number) => {
    const fileType = getFileType(url)
    setLightboxMedia({ url, type: fileType, index })
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxMedia(null)
  }

  const handleDelete = async () => {
    if (!entry) return
    
    setDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete the journal entry
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', entry.user_id)

      if (error) {
        console.error('Error deleting journal entry:', error)
        alert('Failed to delete journal entry. Please try again.')
        return
      }

      // Navigate back to journal list
      router.push('/journal')
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      alert('Failed to delete journal entry. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-neutral-400">Loading journal entry...</div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="text-center py-16">
        <div className="text-neutral-400">Entry not found</div>
      </div>
    )
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" asChild>
              <Link href="/journal">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journal
              </Link>
            </Button>
            <div className="flex justify-end">
              <ActionButtons
                versionType="completed"
                viewHref={`/journal/${entry.id}/edit`}
                onDelete={() => setShowDeleteConfirm(true)}
                showLabels={true}
              />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">{entry.title}</h1>
          <div className="flex items-center gap-4 text-neutral-400 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(entry.date).toLocaleDateString()}
            </div>
          </div>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Categories */}
            {entry.categories && entry.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.categories.map((category: string, index: number) => (
                    <span
                      key={index}
                      className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <h3 className="text-sm font-medium text-neutral-200 mb-2">Content</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-200 whitespace-pre-wrap">{entry.content}</p>
              </div>
            </div>

            {/* Media - Videos Full Width, Images 2x2 Grid */}
            {entry.image_urls && entry.image_urls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-4">Attachments ({entry.image_urls.length})</h3>
                <div className="space-y-4">
                  {/* Videos - Full Width */}
                  {entry.image_urls.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                  }).map((url: string, index: number) => (
                    <div key={`video-${index}`} className="relative group">
                      <video
                        src={processedVideoUrls[url] || url}
                        className="w-full aspect-video object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                        controls
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video load error:', e, 'URL:', processedVideoUrls[url] || url, 'Original:', url)
                        }}
                        onLoadStart={() => {
                          console.log('Video loading started:', processedVideoUrls[url] || url)
                        }}
                        onLoadedMetadata={() => {
                          console.log('Video metadata loaded:', processedVideoUrls[url] || url)
                        }}
                        onClick={() => openLightbox(url, entry.image_urls.indexOf(url))}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ))}
                  
                  {/* Images - 2x2 Grid */}
                  {entry.image_urls.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                  }).length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {entry.image_urls.filter(url => {
                        const ext = url.split('.').pop()?.toLowerCase()
                        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                      }).slice(0, 4).map((url: string, index: number) => (
                        <div key={`image-${index}`} className="relative group aspect-square">
                          <OptimizedImage
                            src={url}
                            alt={`Entry image ${index + 1}`}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => openLightbox(url, entry.image_urls.indexOf(url))}
                            quality={90}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 50vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Other Media Types */}
                  {entry.image_urls.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                  }).map((url: string, index: number) => {
                    const getFileType = (url: string): 'audio' | 'unknown' => {
                      const ext = url.split('.').pop()?.toLowerCase()
                      if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return 'audio'
                      return 'unknown'
                    }
                    
                    const fileType = getFileType(url)
                    
                    return (
                      <div key={`other-${index}`} className="relative group aspect-square">
                        <div className="w-full h-full bg-neutral-700 flex items-center justify-center rounded-lg border border-neutral-600">
                          {fileType === 'audio' ? (
                            <Volume2 className="w-8 h-8" style={{ color: 'white' }} />
                          ) : (
                            <FileText className="w-8 h-8 text-white" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Audio/Video Recordings */}
            {entry.audio_recordings && entry.audio_recordings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-neutral-200 flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Recordings ({entry.audio_recordings.length})
                </h3>
                <div className="space-y-3">
                  {entry.audio_recordings.map((recording: any, index: number) => (
                    <div key={`recording-${index}`} className="flex items-center gap-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                      <div className="flex-shrink-0">
                        {recording.type === 'video' ? (
                          <Play className="w-6 h-6 text-primary-500" />
                        ) : (
                          <Volume2 className="w-6 h-6 text-secondary-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-200 mb-1">
                          {recording.transcript ? recording.transcript : 'Recording'}
                        </p>
                        <p className="text-sm text-neutral-400">
                          {recording.type === 'video' ? 'Video' : 'Audio'} • {recording.duration ? `${Math.round(recording.duration)}s` : 'Unknown duration'}
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(recording.url, '_blank')}
                        className="flex-shrink-0 p-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                      >
                        <Play className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="text-xs text-neutral-500">
                <p>Created: {new Date(entry.created_at).toLocaleString()}</p>
                {entry.updated_at !== entry.created_at && (
                  <p>Updated: {new Date(entry.updated_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

      {/* Lightbox */}
      {lightboxOpen && lightboxMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Media content */}
            <div className="relative max-w-full max-h-full">
              {lightboxMedia.type === 'image' && (
                <img
                  src={lightboxMedia.url}
                  alt={`Media ${lightboxMedia.index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement
                    console.log(`Image dimensions: ${img.naturalWidth} × ${img.naturalHeight}`)
                  }}
                />
              )}
              {lightboxMedia.type === 'video' && (
                <video
                  src={processedVideoUrls[lightboxMedia.url] || lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement
                    console.log(`Video dimensions: ${video.videoWidth} × ${video.videoHeight}`)
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {lightboxMedia.type === 'audio' && (
                <div className="bg-neutral-800 rounded-xl p-8 max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <Volume2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'white' }} />
                    <h3 className="text-xl font-semibold text-white mb-2">Audio File</h3>
                    <p className="text-neutral-400">Attachment {lightboxMedia.index + 1}</p>
                  </div>
                  <audio src={lightboxMedia.url} controls className="w-full">
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}
            </div>

            {/* Download button */}
            <a
              href={lightboxMedia.url}
              download
              className="absolute bottom-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <Download className="w-6 h-6" />
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName={entry?.title || 'journal entry'}
        itemType="Journal Entry"
        isLoading={deleting}
        loadingText="Deleting..."
      />
    </>
  )
}
