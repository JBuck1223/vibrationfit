'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Input, Button } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload } from 'lucide-react'

const LIFE_CATEGORIES = [
  'Fun / Recreation',
  'Variety / Travel / Adventure',
  'Home / Environment',
  'Family / Parenting',
  'Love / Romance / Partner',
  'Health / Body / Vitality',
  'Money / Wealth / Investments',
  'Business / Career / Work',
  'Social / Friends',
  'Giving / Contribution / Legacy',
  'Things / Belongings / Stuff',
  'Expansion / Spirituality',
  'Other'
]

const ENTRY_TYPES = [
  { value: 'evidence', label: 'Connecting the Dots (evidence)' },
  { value: 'contrast', label: 'Contrast (I know what I don\'t want)' },
  { value: 'clarity', label: 'Clarity (I know what I want)' },
  { value: 'other', label: 'Other' }
]

export default function NewJournalEntryPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    entryType: '',
    categories: [] as string[]
  })
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to create a journal entry')
        return
      }

      // Get image URLs (either from upload or AI generation)
      let imageUrls: string[] = []
      if (imageSource === 'ai' && aiGeneratedImageUrls.length > 0) {
        imageUrls = aiGeneratedImageUrls
      } else if (imageSource === 'upload' && files.length > 0) {
        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id)
        imageUrls = uploadResults.map((result: { url: string; key: string; error?: string }) => result.url)
        
        // Check for upload errors
        const errors = uploadResults.filter((result: { url: string; key: string; error?: string }) => result.error)
        if (errors.length > 0) {
          alert(`Some uploads failed: ${errors.map((e: { error?: string }) => e.error).join(', ')}`)
          return
        }
      }

      // Create journal entry
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date: formData.date,
          title: formData.title,
          content: formData.content,
          entry_type: formData.entryType,
          categories: formData.categories,
          image_urls: imageUrls
        })

      if (error) throw error

      // Update user stats
      await supabase.rpc('increment_journal_stats', { p_user_id: user.id })

      router.push('/journal')
    } catch (error) {
      console.error('Error creating journal entry:', error)
      alert('Failed to create journal entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="md" className="py-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              New Journal Entry
            </h1>
            <p className="text-neutral-400">
              Capture your thoughts, evidence, and insights
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />

              {/* Title */}
              <Input
                label="Entry Title"
                type="text"
                placeholder="If this were an email, what would the subject line be?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              {/* Life Categories */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Life Category (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LIFE_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Entry Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Entry Type
                </label>
                <div className="space-y-2">
                  {ENTRY_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="entryType"
                        value={type.value}
                        checked={formData.entryType === type.value}
                        onChange={(e) => setFormData({ ...formData, entryType: e.target.value })}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Journal Content */}
              <RecordingTextarea
                label="Journal Entry"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                rows={10}
                placeholder="Write your journal entry here... Or click the microphone/video icon to record!"
                allowVideo={true}
                storageFolder="journal"
              />

              {/* Evidence / Images */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Evidence / Images (Optional)
                </label>
                
                {/* Toggle Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (imageSource === 'upload') {
                        // Already in upload mode, trigger file picker
                        fileInputRef.current?.click()
                      } else {
                        // Switch to upload mode
                        setImageSource('upload')
                        setAiGeneratedImageUrls([])
                      }
                    }}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button
                    type="button"
                    variant={imageSource === 'ai' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageSource('ai')
                      setFiles([])
                    }}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  multiple
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || [])
                    if (selectedFiles.length > 0) {
                      setFiles(selectedFiles)
                      setImageSource('upload')
                    }
                  }}
                  className="hidden"
                />

                {/* Show drag-drop zone or selected files */}
                {imageSource === 'upload' && files.length === 0 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-primary-500', 'bg-primary-500/5')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-primary-500', 'bg-primary-500/5')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-primary-500', 'bg-primary-500/5')
                      const droppedFiles = Array.from(e.dataTransfer.files).filter(
                        f => f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/')
                      )
                      if (droppedFiles.length > 0) {
                        setFiles(droppedFiles.slice(0, 5)) // Max 5 files
                      }
                    }}
                    className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-neutral-900/50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-300 font-medium mb-1">
                      Click to upload or drag files here
                    </p>
                    <p className="text-xs text-neutral-500">
                      Images, videos, or audio (max 5 files, 500MB each)
                    </p>
                  </div>
                )}

                {imageSource === 'upload' && files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                        <div className="flex items-center gap-3">
                          {file.type.startsWith('image/') && (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          {file.type.startsWith('video/') && (
                            <video
                              src={URL.createObjectURL(file)}
                              className="w-20 h-20 object-cover rounded-lg"
                              muted
                            />
                          )}
                          {!file.type.startsWith('image/') && !file.type.startsWith('video/') && (
                            <div className="w-20 h-20 bg-neutral-800 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">📄</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-neutral-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[0]}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = files.filter((_, i) => i !== index)
                              setFiles(newFiles)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {imageSource === 'ai' && (
                  <AIImageGenerator
                    type="journal"
                    onImageGenerated={(url) => setAiGeneratedImageUrls([url])}
                    initialPrompt={
                      formData.title && formData.content
                        ? `${formData.title}. ${formData.content}`
                        : formData.content || formData.title || ''
                    }
                  />
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </PageLayout>
  )
}