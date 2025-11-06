'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button, Input, Icon } from '@/lib/design-system'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { FileUpload } from '@/components/FileUpload'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'
import Link from 'next/link'
import { ArrowLeft, Save, X, Sparkles, Upload } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

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

// CategoryCard component from design system
const CategoryCard = ({ category, selected = false, onClick, className = '' }: any) => {
  const IconComponent = category.icon
  return (
    <Card 
      variant={selected ? 'elevated' : 'default'} 
      hover 
      className={`cursor-pointer aspect-square transition-all duration-300 ${selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-1 p-1 justify-center h-full">
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#00FFFF'} />
        <span className="text-[10px] font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
          {category.label}
        </span>
      </div>
    </Card>
  )
}

export default function EditJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    categories: [] as string[]
  })
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false
  })
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
      setFormData({
        date: entryData.date || new Date().toISOString().split('T')[0],
        title: entryData.title || '',
        content: entryData.content || '',
        categories: entryData.categories || []
      })
      setExistingFiles(entryData.image_urls || [])
      setAudioRecordings(entryData.audio_recordings || [])
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    console.log('🎯 Journal Edit: handleRecordingSaved called', { 
      url, 
      type, 
      transcript: transcript.substring(0, 50) + '...',
      updatedTextLength: updatedText.length
    })
    
    // Add the recording to the audioRecordings array
    const newRecording = {
      url,
      transcript,
      type,
      category: 'journal',
      created_at: new Date().toISOString()
    }

    setAudioRecordings(prev => [...prev, newRecording])
    
    // Update the content with the new text (which includes the transcript)
    setFormData(prev => ({
      ...prev,
      content: updatedText
    }))

    // Hide progress bar after recording is saved
    setUploadProgress(prev => ({ ...prev, isVisible: false }))
  }

  const handleDeleteRecording = (index: number) => {
    setAudioRecordings(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!entry) return
    
    setSaving(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to update a journal entry')
        return
      }

      // Get image URLs (either from upload or AI generation, or keep existing)
      let imageUrls: string[] = [...existingFiles]
      
      if (imageSource === 'ai' && aiGeneratedImageUrls.length > 0) {
        imageUrls = [...existingFiles, ...aiGeneratedImageUrls]
      } else if (imageSource === 'upload' && files.length > 0) {
        // Show upload progress
        setUploadProgress({
          progress: 0,
          status: 'Preparing files for upload...',
          fileName: files.length > 1 ? `${files.length} files` : files[0]?.name || '',
          fileSize: files.reduce((total, file) => total + file.size, 0),
          isVisible: true
        })

        console.log('📤 Starting file upload:', { 
          fileCount: files.length, 
          files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
          userId: user.id,
          folder: 'journal'
        })

        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.round(progress),
            status: progress < 100 ? 'Uploading files...' : 'Processing files...'
          }))
        })
        
        console.log('📤 Upload results:', uploadResults)
        const newImageUrls = uploadResults.map((result: { url: string; key: string; error?: string }) => result.url)
        
        // Check for upload errors
        const errors = uploadResults.filter((result: { url: string; key: string; error?: string }) => result.error)
        if (errors.length > 0) {
          console.error('❌ Upload errors:', errors)
          alert(`Some uploads failed: ${errors.map((e: { error?: string }) => e.error).join(', ')}`)
          setUploadProgress(prev => ({ ...prev, isVisible: false }))
          setSaving(false)
          return
        }

        imageUrls = [...existingFiles, ...newImageUrls]
        console.log('✅ Upload successful, image URLs:', imageUrls)
      }
      
      // Update the journal entry
      const { error } = await supabase
        .from('journal_entries')
        .update({
          date: formData.date,
          title: formData.title || null,
          content: formData.content || null,
          categories: formData.categories,
          image_urls: imageUrls,
          audio_recordings: audioRecordings,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)
        .eq('user_id', entry.user_id)

      if (error) {
        console.error('Error updating journal entry:', error)
        alert('Failed to update journal entry. Please try again.')
        setUploadProgress(prev => ({ ...prev, isVisible: false }))
        return
      }

      // Hide progress bar
      setUploadProgress(prev => ({ ...prev, isVisible: false }))

      // Navigate back to the entry detail page
      router.push(`/journal/${entry.id}`)
    } catch (error) {
      console.error('Error updating journal entry:', error)
      alert('Failed to update journal entry. Please try again.')
      setUploadProgress(prev => ({ ...prev, isVisible: false }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <div className="text-neutral-400">Loading journal entry...</div>
        </div>
      </PageLayout>
    )
  }

  if (!entry) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <div className="text-neutral-400">Entry not found</div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Mobile Header */}
        <div className="md:hidden space-y-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Edit Journal Entry</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Edit Journal Entry</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
            <Link href={`/journal/${entry.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Entry
            </Link>
          </Button>
          <div className="flex gap-2 sm:ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/journal/${entry.id}`)}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-6 lg:p-8 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
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
            placeholder="What's on your mind today?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          {/* Life Categories */}
          <div>
            <p className="text-sm text-neutral-400 mb-3 text-center">
              Select categories for your journal entry
            </p>
            <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
              {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => (
                <CategoryCard 
                  key={category.key} 
                  category={category} 
                  selected={formData.categories.includes(category.label)} 
                  onClick={() => handleCategoryToggle(category.label)}
                />
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
            onRecordingSaved={handleRecordingSaved}
            onUploadProgress={(progress, status, fileName, fileSize) => {
              setUploadProgress({
                progress,
                status,
                fileName,
                fileSize,
                isVisible: true
              })
            }}
          />

          {/* Display Saved Audio Recordings */}
          {audioRecordings.length > 0 && (
            <SavedRecordings
              key={`journal-recordings-${audioRecordings.length}`}
              recordings={audioRecordings}
              categoryFilter="journal"
              onDelete={handleDeleteRecording}
            />
          )}

          {/* Evidence / Images */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Evidence / Images
            </label>
            
            {/* Show existing files */}
            {existingFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-neutral-400 mb-2">Existing attachments ({existingFiles.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                  {existingFiles.map((url, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : url.match(/\.(mp4|mov|webm|avi)$/i) ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="text-sm font-medium">File</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExistingFiles(prev => prev.filter((_, i) => i !== index))
                        }}
                        className="absolute top-1 right-1 opacity-80 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Toggle Buttons */}
            <div className="flex flex-row flex-wrap gap-2 mb-4 w-full">
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
                className="flex-1 min-w-0 shrink"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="text-xs md:text-sm">Upload Files</span>
              </Button>
              <Button
                type="button"
                variant={imageSource === 'ai' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setImageSource('ai')
                  setFiles([])
                }}
                className="flex-1 min-w-0 shrink"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-xs md:text-sm">Generate with VIVA</span>
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
                journalText={
                  formData.title && formData.content
                    ? `${formData.title}. ${formData.content}`
                    : formData.content || formData.title || ''
                }
              />
            )}
          </div>

          {/* Upload Progress */}
          <UploadProgress
            progress={uploadProgress.progress}
            status={uploadProgress.status}
            fileName={uploadProgress.fileName}
            fileSize={uploadProgress.fileSize}
            isVisible={uploadProgress.isVisible}
          />

          {/* Submit */}
          <div className="flex flex-row flex-wrap gap-2 md:gap-4 w-full">
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={saving}
              className="flex-1 min-w-0 shrink text-xs md:text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/journal/${entry.id}`)}
              className="flex-1 min-w-0 shrink text-xs md:text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  )
}
