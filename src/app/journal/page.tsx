'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {  Card, Button, Video, CategoryCard, PageHero, Container, Stack, Spinner, TrackingMilestoneCard } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Calendar, FileText, Play, Volume2, ChevronLeft, ChevronRight, X, Eye, Grid, List, Filter, ImageOff } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

function JournalImage({ src, alt, className, onClick, loading }: {
  src: string
  alt: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  loading?: 'lazy' | 'eager'
}) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`bg-neutral-800 flex items-center justify-center ${className || ''}`} onClick={onClick}>
        <ImageOff className="w-6 h-6 text-neutral-600" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      loading={loading}
      onError={() => setError(true)}
    />
  )
}

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])

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

  // Scroll to entry anchor when page loads with hash
  useEffect(() => {
    if (loading || entries.length === 0) return

    const hash = window.location.hash
    if (hash && hash.startsWith('#entry-')) {
      const entryId = hash.replace('#entry-', '')
      const element = document.getElementById(`entry-${entryId}`)
      
      if (element) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [loading, entries])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const entryCount = entries.length

  // Filter entries by selected categories
  const filteredEntries = entries.filter(entry => {
    const categoryMatch = selectedCategories.includes('all') || 
      (selectedCategories.length > 0 && entry.categories && entry.categories.some((cat: string) => selectedCategories.includes(cat)))
    return categoryMatch
  })

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Conscious Creation Journal"
          subtitle="Capture evidence of actualization in real time"
        >
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
        </PageHero>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <TrackingMilestoneCard
            label="Total Entries"
            value={entryCount}
            theme="primary"
          />
          
          <TrackingMilestoneCard
            label="Today"
            value={entries.filter(entry => {
              const today = new Date()
              const entryDate = new Date(entry.created_at)
              return entryDate.toDateString() === today.toDateString()
            }).length}
            theme="secondary"
          />
          
          <TrackingMilestoneCard
            label="Media Files"
            value={entries.reduce((total, entry) => total + (entry.image_urls?.length || 0), 0)}
            theme="accent"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => router.push('/journal/new')}
              className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200"
              aria-label="Add Entry"
            >
              <Plus className="w-6 h-6 text-[#39FF14]" />
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
          <div className="flex-1 flex justify-end">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div id="filters" className="space-y-6 animate-in slide-in-from-top duration-300">
            {/* Category Filter */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Categories</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (selectedCategories.includes('all')) {
                      // Deselect all - set to empty array
                      setSelectedCategories([])
                    } else {
                      // Select all
                      setSelectedCategories(['all'])
                    }
                  }}
                >
                  {selectedCategories.includes('all') ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                  const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                  return (
                    <CategoryCard 
                      key={category.key} 
                      category={category} 
                      selected={isSelected} 
                      onClick={() => {
                        if (selectedCategories.includes(category.key)) {
                          // Remove category from selection
                          setSelectedCategories(prev => prev.filter(cat => cat !== category.key))
                        } else {
                          // Add category to selection (remove 'all' if it exists)
                          setSelectedCategories(prev => {
                            const filtered = prev.filter(cat => cat !== 'all')
                            return [...filtered, category.key]
                          })
                        }
                      }}
                      variant="outlined"
                      selectionStyle="border"
                      iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                      selectedIconColor="#39FF14"
                      className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                    />
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Entries List */}
        {filteredEntries && filteredEntries.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View - Masonry Layout */
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
              {filteredEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  id={`entry-${entry.id}`} 
                  className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1 scroll-mt-8 cursor-pointer break-inside-avoid mb-4"
                  onClick={() => router.push(`/journal/${entry.id}`)}
                >
                  <div className="space-y-2 md:space-y-3">
                    {/* Date - Right Aligned with Banner */}
                    <div className="relative -mt-1">
                      <div className="flex justify-end">
                        <div className="relative inline-block">
                          <div className="absolute inset-y-0 left-0 right-0 bg-primary-500/10 rounded"></div>
                          <div className="relative text-sm md:text-base text-primary-500/80 font-medium text-right uppercase tracking-wider px-2 py-1">
                            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Media Preview - Single Image/Video Thumbnail */}
                    {(() => {
                      if (!entry.image_urls || entry.image_urls.length === 0) return null
                      
                      // Check for videos first
                      const videoUrls = entry.image_urls.filter(url => {
                        const ext = url.split('.').pop()?.toLowerCase()
                        return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                      })
                      
                      if (videoUrls.length > 0) {
                        const videoUrl = videoUrls[0]
                        const thumbnailUrl = entry.thumbnail_urls && entry.thumbnail_urls.length > 0
                          ? entry.thumbnail_urls[0]
                          : getThumbnailUrl(videoUrl)
                        
                        return (
                          <div className="relative w-full rounded-lg overflow-hidden border border-neutral-700">
                            <div className="w-full rounded-lg overflow-hidden">
                              <OptimizedVideo
                                url={videoUrl}
                                thumbnailUrl={thumbnailUrl}
                                context="list"
                                lazy={true}
                                className="w-full [&>div]:rounded-lg [&>div]:border-0 [&>div]:!border-0 [&_video]:object-contain [&_video]:w-full [&_video]:h-auto [&_video]:rounded-lg"
                              />
                            </div>
                          </div>
                        )
                      }
                      
                      // Check for images
                      const imageUrls = entry.image_urls.filter(url => {
                        const ext = url.split('.').pop()?.toLowerCase()
                        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                      })
                      
                      if (imageUrls.length > 0) {
                        const imageCount = imageUrls.length
                        
                        // Show collage for multiple images
                        if (imageCount > 1) {
                          const imagesToShow = imageUrls.slice(0, 4) // Show up to 4 images
                          return (
                            <div 
                              className="relative w-full rounded-lg overflow-hidden border border-neutral-700 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation()
                                openLightbox(entry.image_urls, 0)
                              }}
                            >
                              <div className={`grid ${imageCount === 2 ? 'grid-cols-2' : imageCount === 3 ? 'grid-cols-2' : 'grid-cols-2'} gap-0.5`}>
                                {imagesToShow.map((imageUrl, idx) => (
                                  <div key={idx} className="relative bg-neutral-800">
                                    <JournalImage
                                      src={imageUrl}
                                      alt={`Entry preview ${idx + 1}`}
                                      className="w-full h-full object-cover aspect-square"
                                      loading="lazy"
                                    />
                                    {idx === 3 && imageCount > 4 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">+{imageCount - 4}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        
                        // Single image
                        return (
                          <div className="relative w-full rounded-lg overflow-hidden border border-neutral-700 cursor-pointer group">
                            <JournalImage
                              src={imageUrls[0]}
                              alt={`Entry preview`}
                              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-200 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                openLightbox(entry.image_urls, 0)
                              }}
                              loading="lazy"
                            />
                          </div>
                        )
                      }
                      
                      return null
                    })()}

                    {/* Title */}
                    <h3 className="text-base md:text-lg font-semibold text-white break-words line-clamp-2">
                      {entry.title || 'Untitled Entry'}
                    </h3>

                    {/* Content Preview */}
                    {entry.content && (
                      <p className="text-sm text-neutral-400 line-clamp-3">
                        {entry.content}
                      </p>
                    )}

                    {/* Categories - Show All */}
                    {entry.categories && entry.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.categories.map((categoryKey: string) => {
                          const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                          return (
                            <span
                              key={categoryKey}
                              className="text-xs bg-primary-500/20 text-primary-500 px-2 py-0.5 rounded-full"
                            >
                              {categoryInfo ? categoryInfo.label : categoryKey}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Action Button - Compact */}
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        <Link href={`/journal/${entry.id}`}>
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                          View Entry
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* List View - Mobile-First Design */
            <div className="space-y-3 md:space-y-4">
              {filteredEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  id={`entry-${entry.id}`} 
                  className="hover:border-primary-500 transition-all duration-200 scroll-mt-8 cursor-pointer"
                  onClick={() => router.push(`/journal/${entry.id}`)}
                >
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    {/* Image - 300px wide, maintain aspect ratio, max 1:1 */}
                    <div className="relative flex-shrink-0 w-full md:w-[300px] md:max-h-[300px] flex items-center justify-center rounded-lg overflow-hidden bg-neutral-800">
                      {(() => {
                        if (!entry.image_urls || entry.image_urls.length === 0) {
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 md:w-6 md:h-6 text-neutral-600" />
                            </div>
                          )
                        }
                        
                        // Check for videos first
                        const videoUrls = entry.image_urls.filter(url => {
                          const ext = url.split('.').pop()?.toLowerCase()
                          return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
                        })
                        
                        if (videoUrls.length > 0) {
                          const videoUrl = videoUrls[0]
                          const thumbnailUrl = entry.thumbnail_urls && entry.thumbnail_urls.length > 0
                            ? entry.thumbnail_urls[0]
                            : getThumbnailUrl(videoUrl)
                          
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <OptimizedVideo
                                url={videoUrl}
                                thumbnailUrl={thumbnailUrl}
                                context="list"
                                lazy={true}
                                className="w-full max-w-full max-h-full [&>div]:w-auto [&>div]:h-auto [&>div]:max-w-full [&>div]:max-h-full [&_video]:object-contain [&_video]:w-auto [&_video]:h-auto [&_video]:max-w-full [&_video]:max-h-full [&_video]:!aspect-auto"
                              />
                            </div>
                          )
                        }
                        
                        // Check for images
                        const imageUrls = entry.image_urls.filter(url => {
                          const ext = url.split('.').pop()?.toLowerCase()
                          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
                        })
                        
                        if (imageUrls.length > 0) {
                          const imageCount = imageUrls.length
                          
                          // Show collage for multiple images
                          if (imageCount > 1) {
                            const imagesToShow = imageUrls.slice(0, 4) // Show up to 4 images
                            return (
                              <div 
                                className="w-full h-full rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openLightbox(entry.image_urls, 0)
                                }}
                              >
                                <div className={`grid ${imageCount === 2 ? 'grid-cols-2' : imageCount === 3 ? 'grid-cols-2' : 'grid-cols-2'} gap-0.5 h-full`}>
                                  {imagesToShow.map((imageUrl, idx) => (
                                    <div key={idx} className="relative bg-neutral-800">
                                      <JournalImage
                                        src={imageUrl}
                                        alt={`Entry preview ${idx + 1}`}
                                        className="w-full h-full object-cover aspect-square"
                                        loading="lazy"
                                      />
                                      {idx === 3 && imageCount > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                          <span className="text-white text-sm font-semibold">+{imageCount - 4}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          
                          // Single image
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <JournalImage
                                src={imageUrls[0]}
                                alt={entry.title || 'Entry preview'}
                                className="max-w-full max-h-full w-auto h-auto object-contain"
                                loading="lazy"
                              />
                            </div>
                          )
                        }
                        
                        return null
                      })()}
                    </div>

                    {/* Entry Details - Mobile-first layout */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-4">
                        {/* Title and Content */}
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">{entry.title || 'Untitled Entry'}</h3>
                          {entry.content && (
                            <p className="text-neutral-300">
                              {entry.content.length > 200 ? `${entry.content.substring(0, 200)}...` : entry.content}
                            </p>
                          )}
                        </div>

                        {/* Created Date and Categories */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Created Date */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-white">Created:</span>
                            <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Categories */}
                          {entry.categories && entry.categories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium text-white">Categories:</h3>
                              {entry.categories.map((categoryKey: string) => {
                                const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                                return (
                                  <span
                                    key={categoryKey}
                                    className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                                  >
                                    {categoryInfo ? categoryInfo.label : categoryKey}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Right side */}
                    <div className="flex-shrink-0 md:flex-shrink-0 w-full md:w-auto flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full md:w-auto"
                      >
                        <Link href={`/journal/${entry.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Entry
                        </Link>
                      </Button>
                    </div>
                  </div>
              </Card>
            ))}
            </div>
          )
        ) : null}

        {/* Load More Button */}
        {filteredEntries && filteredEntries.length > 0 && hasMore && (
          <div className="flex justify-center py-6 mt-6">
            <Button
              onClick={() => setPage(page + 1)}
              variant="outline"
              size="sm"
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {/* Empty States */}
        {filteredEntries && filteredEntries.length === 0 && (
          entries.length === 0 ? (
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
          ) : (
            <Card className="text-center py-16 max-w-2xl mx-auto">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No entries match your filters</h3>
              <p className="text-neutral-400 mb-6">
                Try adjusting your category filters to see more entries.
              </p>
              <Button
                onClick={() => setSelectedCategories(['all'])}
                variant="primary"
              >
                Clear Filters
              </Button>
            </Card>
          )
        )}



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
      </Stack>
    </Container>
  )
}