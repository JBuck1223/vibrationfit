'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button } from '@/lib/design-system'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'

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

const LIFE_CATEGORIES = [
  'Forward',
  'Fun',
  'Travel',
  'Home',
  'Family',
  'Romance',
  'Health',
  'Money',
  'Business',
  'Social',
  'Possessions',
  'Giving',
  'Spirituality'
]

export default function EditJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [existingFiles, setExistingFiles] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (entryError || !entryData) {
        console.error('Error fetching journal entry:', entryError)
        router.push('/journal')
        return
      }

      setEntry(entryData)
      setTitle(entryData.title || '')
      setContent(entryData.content || '')
      setCategories(entryData.categories || [])
      setExistingFiles(entryData.image_urls || [])
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  const handleCategoryToggle = (category: string) => {
    setCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSave = async () => {
    if (!entry) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Update the journal entry
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title: title || null,
          content: content || null,
          categories: categories,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)
        .eq('user_id', entry.user_id)

      if (error) {
        console.error('Error updating journal entry:', error)
        alert('Failed to update journal entry. Please try again.')
        return
      }

      // Navigate back to the entry detail page
      router.push(`/journal/${entry.id}`)
    } catch (error) {
      console.error('Error updating journal entry:', error)
      alert('Failed to update journal entry. Please try again.')
    } finally {
      setSaving(false)
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
              <Link href={`/journal/${entry.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Entry
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/journal/${entry.id}`)}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Edit Journal Entry</h1>
        </div>

        <Card className="p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none"
              placeholder="Enter a title for your entry..."
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Life Categories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LIFE_CATEGORIES.map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <RecordingTextarea
            label="Content"
            value={content}
            onChange={(value) => setContent(value)}
            rows={8}
            placeholder="Write your journal entry here... Or click the microphone/video icon to record!"
            allowVideo={true}
            storageFolder="journal"
          />

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Current Attachments ({existingFiles.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingFiles.map((url, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : url.match(/\.(mp4|mov|webm|avi)$/i) ? (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="text-sm font-medium">Video</div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="text-sm font-medium">File</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Note: Existing attachments cannot be modified. To change attachments, delete this entry and create a new one.
              </p>
            </div>
          )}
        </Card>
    </>
  )
}
