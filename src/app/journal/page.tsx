'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button } from '@/lib/design-system'
import Link from 'next/link'
import { Plus, Calendar, FileText, Play, Volume2, Edit, Trash2 } from 'lucide-react'
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

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return
    }

    if (!user) {
      alert('User not authenticated')
      return
    }

    setDeletingId(entryId)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting journal entry:', error)
        alert('Failed to delete journal entry. Please try again.')
        return
      }

      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId))
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      alert('Failed to delete journal entry. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

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
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:border-primary-500/50 transition-all duration-200">
                <div className="flex gap-6">
                  {/* Left Side - Media Preview */}
                  <div className="flex-shrink-0 w-1/2">
                    {entry.image_urls && entry.image_urls.length > 0 ? (
                      <div className="space-y-3">
                        {/* Main Media Display */}
                        <div className="relative">
                          {(() => {
                            const getFileType = (url: string): 'image' | 'video' | 'audio' | 'unknown' => {
                              const ext = url.split('.').pop()?.toLowerCase()
                              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
                              if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) return 'video'
                              if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return 'audio'
                              return 'unknown'
                            }
                            
                            const fileType = getFileType(entry.image_urls[0])
                            
                            return (
                              <div 
                                className="relative group cursor-pointer"
                                onClick={() => router.push(`/journal/${entry.id}`)}
                              >
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 hover:border-primary-500/50 transition-all duration-200 hover:scale-[1.02]">
                                  {fileType === 'image' && (
                                    <img
                                      src={entry.image_urls[0]}
                                      alt={`Entry image 1`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  {fileType === 'video' && (
                                    <>
                                      {/* Video thumbnail - extract first frame */}
                                      <video
                                        src={entry.image_urls[0]}
                                        className="w-full h-full object-cover"
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
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                          <Play className="w-6 h-6 text-black ml-1" />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  {fileType === 'audio' && (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                                      <Volume2 className="w-16 h-16 text-primary-500" />
                                    </div>
                                  )}
                                  {fileType === 'unknown' && (
                                    <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                                      <FileText className="w-16 h-16 text-neutral-400" />
                                    </div>
                                  )}
                                  
                                  {/* File type badge */}
                                  <div className="absolute top-3 right-3">
                                    <span className="text-xs bg-black/70 text-white px-2 py-1 rounded text-[10px] font-medium">
                                      {fileType === 'image' ? 'IMG' : 
                                       fileType === 'video' ? 'VID' : 
                                       fileType === 'audio' ? 'AUD' : 'FILE'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Hover overlay with file info */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <div className="text-sm font-medium">
                                      Click to view entry
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                        
                        {/* Additional Media Thumbnails */}
                        {entry.image_urls.length > 1 && (
                          <div className="flex gap-2">
                            {entry.image_urls.slice(1, 4).map((url: string, index: number) => {
                              const getFileType = (url: string): 'image' | 'video' | 'audio' | 'unknown' => {
                                const ext = url.split('.').pop()?.toLowerCase()
                                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
                                if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) return 'video'
                                if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return 'audio'
                                return 'unknown'
                              }
                              
                              const fileType = getFileType(url)
                              
                              return (
                                <div key={index} className="relative group">
                                  <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 hover:border-primary-500/50 transition-all duration-200">
                                    {fileType === 'image' && (
                                      <img
                                        src={url}
                                        alt={`Entry image ${index + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                    {fileType === 'video' && (
                                      <video
                                        src={url}
                                        className="w-full h-full object-cover"
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
                                    )}
                                    {fileType === 'audio' && (
                                      <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                                        <Volume2 className="w-6 h-6 text-primary-500" />
                                      </div>
                                    )}
                                    {fileType === 'unknown' && (
                                      <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-neutral-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                            {entry.image_urls.length > 4 && (
                              <div className="w-16 aspect-video bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-lg border border-neutral-600 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-sm font-bold text-primary-500">
                                    +{entry.image_urls.length - 4}
                                  </div>
                                  <div className="text-xs text-neutral-400">
                                    more
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-center">
                        <div className="text-center text-neutral-500">
                          <FileText className="w-12 h-12 mx-auto mb-2" />
                          <div className="text-sm">No media</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Content */}
                  <div className="flex-1 w-1/2">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-white mr-3">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <div className="flex items-center text-neutral-400 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-neutral-400 text-sm mb-4">
                      <span className="bg-primary-500/20 text-primary-500 px-2 py-1 rounded text-xs mr-2">
                        {entry.entry_type}
                      </span>
                      {entry.categories && entry.categories.length > 0 && (
                        <span className="text-xs">
                          {entry.categories.slice(0, 2).join(', ')}
                          {entry.categories.length > 2 && ` +${entry.categories.length - 2} more`}
                        </span>
                      )}
                    </div>

                    {entry.content && (
                      <p className="text-neutral-200 text-sm line-clamp-4 mb-4">
                        {entry.content.substring(0, 300)}...
                      </p>
                    )}

                    <div className="flex justify-center gap-2 mt-6">
                      <Button asChild size="sm" className="px-4">
                        <Link href={`/journal/${entry.id}`}>
                          <FileText className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="px-4">
                        <Link href={`/journal/${entry.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="px-4"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
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
    </>
  )
}