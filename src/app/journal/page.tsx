'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {  Card, Button, Video } from '@/lib/design-system'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Calendar, FileText, Play, Volume2, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react'
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

export default function JournalPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<JournalEntry | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchData() {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const limit = 20
      const offset = (page - 1) * limit

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching entries:', error)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      if (page === 1) {
        setEntries(entries || [])
        setLoading(false)
      } else {
        setEntries(prev => [...prev, ...(entries || [])])
        setLoadingMore(false)
      }

      setHasMore((entries || []).length === limit)
    }

    fetchData()
  }, [router, page])

  // Simplified: Trust what's in the database
  // If image_urls contains a processed file, use it directly
  // If thumbnail_urls exists, use it
  // No S3 checking, no processing overlay

  const handleDeleteClick = (entry: JournalEntry) => {
    setItemToDelete(entry)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete || !user) return

    setDeletingId(itemToDelete.id)
    try {
      // First, delete media files from S3 (including thumbnails)
      const allMediaUrls = [
        ...(itemToDelete.image_urls || []),
        ...(itemToDelete.thumbnail_urls || [])
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

      // Delete from database
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

  // Get thumbnail URL for videos only (images are handled by Next.js Image optimization)
  const getThumbnailUrl = (url: string) => {
    // Videos have thumbnails
    if (isVideo(url)) {
      return url.replace(/\.(mp4|mov|webm|avi)$/i, '-thumb.jpg')
    }
    
    // For images, return original (Next.js Image will optimize on-demand)
    return url
  }

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
          {/* Gradient Border Wrapper */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
            {/* Inner Card with Gradient Background */}
            <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              
              <div className="relative z-10">
                
                {/* "THE LIFE I CHOOSE" Label */}
                <div className="text-center mb-4">
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                    THE LIFE I CHOOSE
                  </div>
                </div>
                
                {/* Title Section */}
                <div className="text-center mb-3">
                  <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                    Conscious Creation Journal
                  </h1>
                </div>
                
                {/* Subtitle */}
                <div className="text-center mb-6">
                  <p className="text-xs md:text-lg text-neutral-300">
                    Capture evidence of actualization in real time
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                  >
                    <Link href="/journal/new">
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>New Entry</span>
                    </Link>
                  </Button>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{entryCount}</p>
                <p className="text-xs text-neutral-400">Total Entries</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {entries.filter(entry => {
                    const today = new Date()
                    const entryDate = new Date(entry.created_at)
                    return entryDate.toDateString() === today.toDateString()
                  }).length}
                </p>
                <p className="text-xs text-neutral-400">Today</p>
              </div>
            </div>
          </Card>
          
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {entries.reduce((total, entry) => total + (entry.image_urls?.length || 0), 0)}
                </p>
                <p className="text-xs text-neutral-400">Media Files</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Entries List */}
        {entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1">
                <div className="space-y-4">
                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                    {entry.title || 'Untitled Entry'}
                  </h3>

                  {/* Content Preview */}
                  {entry.content && (
                    <p className="text-neutral-200 text-sm line-clamp-3 break-words">
                      {entry.content.substring(0, 200)}
                      {entry.content.length > 200 && '...'}
                    </p>
                  )}

                  {/* Created Date and Categories */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-white">Created:</span>
                      <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Categories */}
                    {entry.categories && entry.categories.length > 0 && (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white">Categories:</h3>
                        <div className="flex flex-wrap gap-2">
                          {entry.categories.map((category: string) => (
                            <span
                              key={category}
                              className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
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
                        
                        // Use thumbnail from thumbnail_urls if available, otherwise generate one
                        const thumbnailUrl = entry.thumbnail_urls && entry.thumbnail_urls.length > index
                          ? entry.thumbnail_urls[index]
                          : entry.thumbnail_urls && entry.thumbnail_urls.length > 0
                          ? entry.thumbnail_urls[0]
                          : getThumbnailUrl(url)
                        
                        return (
                          <div key={`video-${index}`} className="relative group">
                            <OptimizedVideo
                              url={url}
                              thumbnailUrl={thumbnailUrl}
                              context="list"
                              lazy={true}
                              className="w-full"
                            />
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
                              <div key={`image-${index}`} className="relative group">
                                <Image
                                  src={url}
                                  alt={`Entry image ${index + 1}`}
                                  width={400}
                                  height={300}
                                  className="w-full h-auto object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                                  onClick={() => openLightbox(entry.image_urls, entry.image_urls.indexOf(url))}
                                  quality={85}
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                  loading="lazy"
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

                  {/* Action Buttons - Under All Content, Right Aligned */}
                  <div className="pt-2 flex flex-row gap-2 sm:gap-3 sm:justify-end">
                    <Button
                      asChild
                      variant="primary"
                      size="sm"
                      className="flex-1 sm:flex-none sm:w-32"
                    >
                      <Link href={`/journal/${entry.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-8">
                <Button
                  onClick={() => setPage(page + 1)}
                  variant="outline"
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-16 max-w-2xl mx-auto">
            <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No journal entries yet</h3>
            <p className="text-neutral-400 mb-6">
              Start capturing evidence of your conscious creation journey. 
              Log your wins, insights, and moments of alignment.
            </p>
            <Button asChild>
              <Link href="/journal/new">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Entry
              </Link>
            </Button>
          </Card>
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