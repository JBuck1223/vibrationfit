'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button } from '@/lib/design-system'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Calendar, FileText, Play, Volume2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface JournalEntry {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  categories: string[]
  image_urls: string[]
  audio_recordings: any[]
  created_at: string
  updated_at: string
}

export default function JournalPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<JournalEntry | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({})
  const [processedVideoUrls, setProcessedVideoUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setEntries(entries || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  // Check for processed video URLs after entries are loaded
  useEffect(() => {
    if (entries.length === 0) return

    async function checkProcessedVideos() {
      const processedUrls: Record<string, string> = {}
      
      console.log('🔍 Checking for processed videos in', entries.length, 'entries')
      
      for (const entry of entries) {
        if (entry.image_urls) {
          console.log('📹 Entry', entry.id, 'has', entry.image_urls.length, 'media URLs')
          for (const url of entry.image_urls) {
            if (isVideo(url)) {
              console.log('🎬 Found video URL:', url)
              const processedUrl = await getProcessedVideoUrl(url)
              console.log('🔗 Processed URL result:', processedUrl)
              if (processedUrl !== url) {
                processedUrls[url] = processedUrl
                console.log('✅ Using processed video:', processedUrl)
              } else {
                console.log('⚠️ No processed version found, using original')
              }
            }
          }
        }
      }
      
      console.log('📊 Final processed URLs:', processedUrls)
      setProcessedVideoUrls(processedUrls)
    }

    checkProcessedVideos()
    
    // Re-check every 30 seconds for newly processed videos
    const interval = setInterval(checkProcessedVideos, 30000)
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries])

  const handleDeleteClick = (entry: JournalEntry) => {
    setItemToDelete(entry)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete || !user) return

    setDeletingId(itemToDelete.id)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', itemToDelete.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting journal entry:', error)
        alert('Failed to delete journal entry. Please try again.')
        return
      }

      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== itemToDelete.id))
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      alert('Failed to delete journal entry. Please try again.')
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
  }

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextMedia = () => {
    if (lightboxImages.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
    }
  }

  const prevMedia = () => {
    if (lightboxImages.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
    }
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')
  }

  // Check for processed video URLs
  const getProcessedVideoUrl = useCallback(async (originalUrl: string) => {
    try {
      console.log('🔍 Checking for processed video for:', originalUrl)
      
      // Extract the S3 key from the original URL
      const urlParts = originalUrl.split('/')
      const userUploadsIndex = urlParts.indexOf('user-uploads')
      
      if (userUploadsIndex === -1) {
        console.log('⚠️ No user-uploads found in URL, using original')
        return originalUrl
      }
      
      const s3Key = urlParts.slice(userUploadsIndex).join('/')
      console.log('📁 Extracted S3 key:', s3Key)
      
      // MediaConvert outputs with "-compressed" suffix in the processed/ folder
      // Example: user-uploads/userId/journal/uploads/file.mov -> user-uploads/userId/journal/uploads/processed/file-compressed.mp4
      
      // Extract the folder structure to determine where processed files should be
      const s3KeyParts = s3Key.split('/')
      const userId = s3KeyParts[1] // user-uploads/[userId]/...
      const folder = s3KeyParts[2] // user-uploads/[userId]/[folder]/...
      const filename = s3KeyParts.slice(3).join('/') // The rest after userId/folder
      
      // Get just the base filename without path
      const baseFilename = s3KeyParts[s3KeyParts.length - 1]
      const filenameWithoutExt = baseFilename.replace(/\.[^/.]+$/, '')
      
      // Build processed URL: same path, add /processed/ folder and -720p suffix
      // Example: user-uploads/userId/journal/uploads/file.mov 
      //      -> user-uploads/userId/journal/uploads/processed/file-720p.mp4
      const processedPath = s3KeyParts.slice(0, -1).join('/')
      const processedFilename = `${filenameWithoutExt}-720p.mp4`
      const processedKey = `${processedPath}/processed/${processedFilename}`
      
      const processedPatterns = [
        processedKey,  // Primary pattern
        s3Key.replace(/\.[^/.]+$/, '').replace(/\/([^/]+)$/, '/processed/$1-720p.mp4')  // Fallback
      ]
      
      console.log('🔍 Trying processed patterns:', processedPatterns)
      
      for (const processedKey of processedPatterns) {
        const processedUrl = `https://media.vibrationfit.com/${processedKey}`
        console.log('🔗 Checking processed URL:', processedUrl)
        
        try {
          const response = await fetch(processedUrl, { method: 'HEAD' })
          console.log('📡 Response status:', response.status, response.ok)
          
          if (response.ok) {
            console.log('✅ Using processed video:', processedUrl)
            return processedUrl
          }
        } catch (fetchError) {
          console.log('❌ Fetch error for:', processedUrl, fetchError)
        }
      }
      
      console.log('❌ No processed video found in any pattern, using original')
    } catch (error) {
      console.log('❌ Error checking processed video:', error, 'Using original:', originalUrl)
    }
    
    return originalUrl
  }, [entries])

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevMedia()
          break
        case 'ArrowRight':
          nextMedia()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-neutral-400">Loading journal entries...</div>
      </div>
    )
  }

  const entryCount = entries.length

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">📔 Conscious Creation Journal</h1>
              <p className="text-neutral-400">Capture evidence of actualization in real time</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/journal/new">
                <Plus className="w-5 h-5 mr-2" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">New Entry</span>
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{entryCount}</div>
                  <div className="text-sm text-neutral-400">Total Entries</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {entries.filter(entry => {
                      const today = new Date()
                      const entryDate = new Date(entry.created_at)
                      return entryDate.toDateString() === today.toDateString()
                    }).length}
                  </div>
                  <div className="text-sm text-neutral-400">Today</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {entries.reduce((total, entry) => total + (entry.image_urls?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-neutral-400">Media Files</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Entries List */}
        {entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1">
                <div className="space-y-4">
                  {/* Header - Title and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    <div className="flex items-center text-neutral-400 text-sm">
                      <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="whitespace-nowrap">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.categories && entry.categories.length > 0 && (
                      <span className="text-xs text-neutral-400 break-words">
                        {entry.categories.slice(0, 2).join(', ')}
                        {entry.categories.length > 2 && ` +${entry.categories.length - 2} more`}
                      </span>
                    )}
                  </div>

                  {/* Media Preview - Videos Full Width, Images 2x2 Grid */}
                  {entry.image_urls && entry.image_urls.length > 0 && (
                    <div className="space-y-4">
                      {/* Videos - Full Width */}
                      {entry.image_urls.filter(url => {
                        const ext = url.split('.').pop()?.toLowerCase()
                        return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                      }).map((url: string, index: number) => {
                        const videoKey = `${entry.id}-${index}`
                        const hasError = videoErrors[videoKey] || false
                        const isLoading = videoLoading[videoKey] !== false
                        
                        return (
                          <div key={`video-${index}`} className="relative group">
                            {!hasError ? (
                              <video
                                src={processedVideoUrls[url] || url}
                                className="w-full aspect-video object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors"
                                controls
                                preload="metadata"
                                onError={(e) => {
                                  const videoUrl = processedVideoUrls[url] || url
                                  console.error('Video load error for:', videoUrl)
                                  console.error('Error type:', (e.nativeEvent as any)?.type || 'unknown')
                                  console.error('Using original URL:', url)
                                  console.error('Processed URL:', processedVideoUrls[url])
                                  setVideoErrors(prev => ({ ...prev, [videoKey]: true }))
                                  setVideoLoading(prev => ({ ...prev, [videoKey]: false }))
                                }}
                                onLoadStart={() => {
                                  const videoUrl = processedVideoUrls[url] || url
                                  console.log('Video loading started:', videoUrl, 'Original:', url)
                                  setVideoLoading(prev => ({ ...prev, [videoKey]: false }))
                                }}
                                onLoadedMetadata={() => {
                                  const videoUrl = processedVideoUrls[url] || url
                                  console.log('Video metadata loaded:', videoUrl)
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="w-full aspect-video bg-neutral-800 rounded-lg border border-neutral-700 flex items-center justify-center">
                                <div className="text-center text-neutral-400 p-6">
                                  <div className="text-lg mb-2">📹 Video Format Not Supported</div>
                                  <div className="text-sm mb-4">
                                    This video format (.mov) may not be supported by your browser.
                                  </div>
                                  <a
                                    href={processedVideoUrls[url] || url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                    Download Video
                                  </a>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        )
                      })}
                      
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
                              <Image
                                src={url}
                                alt={`Entry image ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                                onClick={() => openLightbox(entry.image_urls, entry.image_urls.indexOf(url))}
                                quality={85}
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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

                  {/* Audio/Video Recordings */}
                  {entry.audio_recordings && entry.audio_recordings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Recordings ({entry.audio_recordings.length})
                      </h4>
                      <div className="space-y-2">
                        {entry.audio_recordings.map((recording: any, index: number) => (
                          <div key={`recording-${index}`} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                            <div className="flex-shrink-0">
                              {recording.type === 'video' ? (
                                <Play className="w-5 h-5 text-primary-500" />
                              ) : (
                                <Volume2 className="w-5 h-5 text-secondary-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-200 truncate">
                                {recording.transcript ? recording.transcript.substring(0, 100) + '...' : 'Recording'}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {recording.type === 'video' ? 'Video' : 'Audio'} • {recording.duration ? `${Math.round(recording.duration)}s` : 'Unknown duration'}
                              </p>
                            </div>
                            <button
                              onClick={() => window.open(recording.url, '_blank')}
                              className="flex-shrink-0 p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                            >
                              <Play className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  {entry.content && (
                    <p className="text-neutral-200 text-sm line-clamp-3 break-words">
                      {entry.content.substring(0, 200)}
                      {entry.content.length > 200 && '...'}
                    </p>
                  )}

                  {/* Action Buttons - Under All Content, Right Aligned */}
                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      asChild
                      variant="primary"
                      size="sm"
                    >
                      <Link href={`/journal/${entry.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                    >
                      <Link href={`/journal/${entry.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📔</div>
              <h3 className="text-2xl font-bold text-white mb-4">No journal entries yet</h3>
              <p className="text-neutral-400 mb-8">
                Start capturing evidence of your conscious creation journey. 
                Log your wins, insights, and moments of alignment.
              </p>
              <Button asChild size="lg">
                <Link href="/journal/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Entry
                </Link>
              </Button>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>


        {/* Lightbox */}
        {lightboxOpen && lightboxImages.length > 0 && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Media Content */}
              <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                {isVideo(lightboxImages[lightboxIndex]) ? (
                  <video
                    src={lightboxImages[lightboxIndex]}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <img
                    src={lightboxImages[lightboxIndex]}
                    alt={`Media ${lightboxIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Media Counter */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {lightboxIndex + 1} of {lightboxImages.length}
                </div>
              )}

              {/* Thumbnail Strip */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                  {lightboxImages.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setLightboxIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === lightboxIndex ? 'border-primary-500' : 'border-neutral-600'
                      }`}
                    >
                      {isVideo(media) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={media}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </>
  )
}