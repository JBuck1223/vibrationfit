'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {  Card, Button, DeleteConfirmationDialog } from '@/lib/design-system'
import { OptimizedImage } from '@/components/OptimizedImage'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowLeft, Calendar, FileText, X, Download, Play, Volume2, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [entryId, setEntryId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      setEntryId(resolvedParams.id)
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
      // If URL already contains /processed/, it's already a processed file - just return it
      if (originalUrl.includes('/processed/')) {
        console.log('✅ URL is already a processed file, returning as-is')
        return originalUrl
      }
      
      // Extract the S3 key from the original URL
      const urlParts = originalUrl.split('/')
      const s3Key = urlParts.slice(urlParts.indexOf('user-uploads')).join('/')
      
      // Extract the folder structure to determine where processed files should be
      const s3KeyParts = s3Key.split('/')
      
      // Get just the base filename without path
      const baseFilename = s3KeyParts[s3KeyParts.length - 1]
      const filenameWithoutExt = baseFilename.replace(/\.[^/.]+$/, '')
      
      // Check if filename already has a quality suffix
      const hasQualitySuffix = /-(1080p|720p|original)$/.test(filenameWithoutExt)
      
      // Build processed URLs: same path, add /processed/ folder with quality suffix
      const processedPath = s3KeyParts.slice(0, -1).join('/')
      
      // If filename already has quality suffix, use it as-is; otherwise add -1080p
      const processedFilename = hasQualitySuffix 
        ? `${baseFilename}` 
        : `${filenameWithoutExt}-1080p.mp4`
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
      
      // Fallback to 720p (only if filename doesn't already have quality suffix)
      const fallbackFilename = hasQualitySuffix 
        ? `${baseFilename.replace(/-1080p$/, '-720p')}` 
        : `${filenameWithoutExt}-720p.mp4`
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

  // Get all image URLs for navigation
  const getImageUrls = () => {
    if (!entry) return []
    return entry.image_urls.filter(url => {
      const ext = url.split('.').pop()?.toLowerCase()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
    })
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!lightboxMedia || !entry) return
    
    const imageUrls = getImageUrls()
    if (imageUrls.length <= 1) return
    
    const currentIndex = imageUrls.indexOf(lightboxMedia.url)
    let newIndex: number
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % imageUrls.length
    } else {
      newIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length
    }
    
    const newUrl = imageUrls[newIndex]
    setLightboxMedia({ url: newUrl, type: 'image', index: newIndex })
  }

  // Swipe handlers for mobile
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // If no movement, it was just a tap - don't navigate
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      navigateLightbox('next')
    }
    if (isRightSwipe) {
      navigateLightbox('prev')
    }
  }

  // Prevent body scroll and interactions when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      // Prevent pointer events on body content (but allow lightbox)
      document.body.style.pointerEvents = 'none'
      
      return () => {
        document.body.style.overflow = ''
        document.body.style.pointerEvents = ''
      }
    }
  }, [lightboxOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen || !lightboxMedia || !entry) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Get all image URLs
        const imageUrls = entry.image_urls.filter(url => {
          const ext = url.split('.').pop()?.toLowerCase()
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
        })
        
        if (imageUrls.length <= 1) return
        
        const currentIndex = imageUrls.indexOf(lightboxMedia.url)
        if (currentIndex === -1) return
        
        const newIndex = e.key === 'ArrowRight' 
          ? (currentIndex + 1) % imageUrls.length
          : (currentIndex - 1 + imageUrls.length) % imageUrls.length
        
        const newUrl = imageUrls[newIndex]
        setLightboxMedia({ url: newUrl, type: 'image', index: newIndex })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxMedia, entry])

  const handleDelete = async () => {
    if (!entry) return
    
    setDeleting(true)
    try {
      const supabase = createClient()
      
      // First, delete media files from S3 (including thumbnails and all processed versions)
      const allMediaUrls = [
        ...(entry.image_urls || []),
        ...(entry.thumbnail_urls || [])
      ]
      
      if (allMediaUrls.length > 0) {
        try {
          console.log('🗑️  Deleting media files:', allMediaUrls)
          const deleteResponse = await fetch('/api/journal/delete-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: allMediaUrls })
          })
          
          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text()
            console.error('❌ Delete API error:', deleteResponse.status, errorText)
          } else {
            const result = await deleteResponse.json()
            console.log(`✅ Deleted ${result.deleted || 0}/${result.total || 0} media files from S3`)
          }
        } catch (mediaError) {
          console.error('❌ Failed to delete media files:', mediaError)
          // Continue with database deletion even if media deletion fails
        }
      }
      
      // Delete the journal entry from database
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
      <>
        <div className="text-center py-16">
          <div className="text-neutral-400">Loading journal entry...</div>
        </div>
      </>
    )
  }

  if (!entry) {
    return (
      <>
        <div className="text-center py-16">
          <div className="text-neutral-400">Entry not found</div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Back Button */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (entryId) {
                router.push(`/journal#entry-${entryId}`)
              } else {
                router.push('/journal')
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <Card className="p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Media - Videos Full Width, Images 2x2 Grid */}
          {entry.image_urls && entry.image_urls.length > 0 && (
            <div className="space-y-4">
                  {/* Videos - Full Width */}
                  {entry.image_urls.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                  }).map((url: string, index: number) => {
                    // Get thumbnail URL if available
                    const thumbnailUrl = entry.thumbnail_urls && entry.thumbnail_urls.length > index
                      ? entry.thumbnail_urls[index]
                      : entry.thumbnail_urls && entry.thumbnail_urls.length > 0
                      ? entry.thumbnail_urls[0]
                      : undefined
                    
                    return (
                      <div key={`video-${index}`} className="relative group">
                        <OptimizedVideo
                          url={processedVideoUrls[url] || url}
                          thumbnailUrl={thumbnailUrl}
                          context="single"
                          className="w-full"
                        />
                      </div>
                    )
                  })}
                  
                  {/* Images - Responsive Grid */}
                  {entry.image_urls.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                  }).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                      {entry.image_urls.filter(url => {
                        const ext = url.split('.').pop()?.toLowerCase()
                        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                      }).slice(0, 4).map((url: string, index: number) => (
                        <div key={`image-${index}`} className="relative group">
                          <OptimizedImage
                            src={url}
                            alt={`Entry image ${index + 1}`}
                            width={800}
                            height={600}
                            className="w-full h-auto object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
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
          )}

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">{entry.title}</h2>
              {entry.content && (
                <p className="text-neutral-300 whitespace-pre-wrap">{entry.content}</p>
              )}
            </div>

            {/* Created Date and Categories */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-white">Created:</span>
                <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(entry.created_at).toLocaleDateString()}</span>
              </div>

              {/* Updated Date */}
              {entry.updated_at !== entry.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white">Updated:</span>
                  <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(entry.updated_at).toLocaleDateString()}</span>
                </div>
              )}

              {/* Categories */}
              {entry.categories && entry.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">Categories:</h3>
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 sm:flex-none sm:w-32"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/journal/${entry.id}/edit`)}
              className="flex-1 sm:flex-none sm:w-32"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </Card>

      {/* Lightbox */}
      {lightboxOpen && lightboxMedia && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            // Only close on desktop when clicking outside (not on mobile)
            if (window.innerWidth >= 768) {
              // Always prevent clicks from going through to background
              e.preventDefault()
              e.stopPropagation()
              // Close if clicking on the backdrop (not on the image itself)
              const target = e.target as HTMLElement
              if (target === e.currentTarget || 
                  (!target.closest('.lightbox-media-content') &&
                   !target.closest('button') &&
                   !target.closest('a'))) {
                closeLightbox()
                return false
              }
            }
            return false
          }}
          onMouseDown={(e) => {
            // Also prevent mousedown from going through (desktop only)
            if (window.innerWidth >= 768) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <div 
            className="lightbox-backdrop-container relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeLightbox()
              }}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons - Only show for images with multiple images, hidden on mobile */}
            {lightboxMedia.type === 'image' && getImageUrls().length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateLightbox('prev')
                  }}
                  className="hidden md:block absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateLightbox('next')
                  }}
                  className="hidden md:block absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media content */}
            <div 
              className="lightbox-media-content relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => {
                e.stopPropagation()
                onTouchStart(e)
              }}
              onTouchMove={(e) => {
                e.stopPropagation()
                onTouchMove(e)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                onTouchEnd()
              }}
            >
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
              onClick={(e) => e.stopPropagation()}
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
