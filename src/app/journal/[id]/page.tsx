'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, Tag, X, Download, Play, Volume2, Edit, Trash2 } from 'lucide-react'
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

export default function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string; index: number } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

  const getFileType = (url: string): 'image' | 'video' | 'audio' | 'unknown' => {
    const ext = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) return 'video'
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return 'audio'
    return 'unknown'
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
      <>
        <Container size="md" className="py-8">
          <div className="text-center py-16">
            <div className="text-neutral-400">Loading journal entry...</div>
          </div>
        </Container>
      </>
    )
  }

  if (!entry) {
    return (
      <>
        <Container size="md" className="py-8">
          <div className="text-center py-16">
            <div className="text-neutral-400">Entry not found</div>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="md" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" asChild>
              <Link href="/journal">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journal
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/journal/${entry.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">{entry.title}</h1>
          <div className="flex items-center gap-4 text-neutral-400 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(entry.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {entry.entry_type}
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

            {/* Attachments */}
            {entry.image_urls && entry.image_urls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-4">Attachments ({entry.image_urls.length})</h3>
                      <div className="grid grid-cols-1 gap-6">
                  {entry.image_urls.map((url: string, index: number) => {
                    const fileType = getFileType(url)
                    
                    return (
                      <div key={index} className="group relative">
                        <div 
                          className="relative bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 hover:border-primary-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer"
                          onClick={() => openLightbox(url, index)}
                        >
                          {fileType === 'image' && (
                            <img
                              src={url}
                              alt={`Entry attachment ${index + 1}`}
                              className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          )}
                          {fileType === 'video' && (
                            <div className="relative">
                              {/* Video thumbnail - extract first frame */}
                              <video
                                src={url}
                                className="w-full h-96 object-cover"
                                muted
                                preload="metadata"
                                onLoadedMetadata={(e) => {
                                  const video = e.target as HTMLVideoElement
                                  video.currentTime = 1 // Seek to 1 second for thumbnail
                                }}
                                onSeeked={(e) => {
                                  const video = e.target as HTMLVideoElement
                                  video.pause() // Pause after seeking
                                }}
                                style={{ pointerEvents: 'none' }} // Prevent video interaction
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                  <Play className="w-8 h-8 text-black ml-1" />
                                </div>
                              </div>
                              <div className="absolute top-3 left-3">
                                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                  VIDEO
                                </span>
                              </div>
                            </div>
                          )}
                          {fileType === 'audio' && (
                            <div className="w-full h-96 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg flex flex-col items-center justify-center p-6">
                              <div className="w-16 h-16 bg-primary-500/30 rounded-full flex items-center justify-center mb-4">
                                <Volume2 className="w-8 h-8 text-primary-500" />
                              </div>
                              <div className="mt-2">
                                <span className="bg-primary-500/20 text-primary-500 px-2 py-1 rounded text-xs font-medium">
                                  AUDIO FILE
                                </span>
                              </div>
                            </div>
                          )}
                          {fileType === 'unknown' && (
                            <div className="w-full h-96 bg-neutral-700 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                                <span className="text-sm text-neutral-400">Unknown file type</span>
                              </div>
                            </div>
                          )}
                          
                          {/* File info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="text-white text-sm font-medium">
                              Attachment {index + 1}
                            </div>
                            <div className="text-white/70 text-xs">
                              {fileType.toUpperCase()} • {url.split('/').pop()?.split('-').slice(-1)[0] || 'File'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
      </Container>

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
                  src={lightboxMedia.url}
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
                    <Volume2 className="w-16 h-16 text-primary-500 mx-auto mb-4" />
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Journal Entry</h3>
            <p className="text-neutral-300 mb-6">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
