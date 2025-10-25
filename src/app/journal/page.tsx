'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button, ActionButtons, DeleteConfirmationDialog, Video } from '@/lib/design-system'
import Link from 'next/link'
import { Plus, Calendar, FileText, Play, Volume2, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface JournalEntry {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  entry_type: string
  categories: string[]
  image_urls: string[]
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
                  
                  {/* Tags and Categories */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary-500/20 text-primary-500 px-2 py-1 rounded-full text-xs font-medium">
                      {entry.entry_type}
                    </span>
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
                      }).map((url: string, index: number) => (
                        <div key={`video-${index}`} className="relative group">
                          <video
                            src={url}
                            className="w-full aspect-video object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => openLightbox(entry.image_urls, entry.image_urls.indexOf(url))}
                          />
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
                              <img
                                src={url}
                                alt={`Entry image ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                                onClick={() => openLightbox(entry.image_urls, entry.image_urls.indexOf(url))}
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
                            <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center rounded-lg border border-neutral-700">
                              {fileType === 'audio' ? (
                                <Volume2 className="w-8 h-8 text-primary-500" />
                              ) : (
                                <FileText className="w-8 h-8 text-neutral-400" />
                              )}
                            </div>
                          </div>
                        )
                      })}
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
                  <div className="pt-2 flex justify-end">
                    <ActionButtons
                      versionType="completed"
                      viewHref={`/journal/${entry.id}`}
                      onDelete={() => handleDeleteClick(entry)}
                      showLabels={true}
                    />
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

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName={itemToDelete?.title || 'journal entry'}
          itemType="Journal Entry"
          isLoading={deletingId === itemToDelete?.id}
          loadingText="Deleting..."
        />

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