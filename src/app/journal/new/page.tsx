'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLayout, Card, Input, Button, Icon } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

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

export default function NewJournalEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveMode = searchParams.get('intensive') === 'true'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false
  })
  const [files, setFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
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

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    console.log('🎯 Journal: handleRecordingSaved called', { 
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
        // Show upload progress
        setUploadProgress({
          progress: 0,
          status: 'Preparing files for upload...',
          fileName: files.length > 1 ? `${files.length} files` : files[0]?.name || '',
          fileSize: files.reduce((total, file) => total + file.size, 0),
          isVisible: true
        })

        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.round(progress),
            status: progress < 100 ? 'Uploading files...' : 'Processing files...'
          }))
        })
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
          categories: formData.categories,
          image_urls: imageUrls,
          audio_recordings: audioRecordings
        })

      if (error) throw error

      // Update user stats
      await supabase.rpc('increment_journal_stats', { p_user_id: user.id })

      // Hide progress bar
      setUploadProgress(prev => ({ ...prev, isVisible: false }))

      // If in intensive mode, mark first journal entry as complete
      if (isIntensiveMode) {
        const { markIntensiveStep } = await import('@/lib/intensive/checklist')
        await markIntensiveStep('first_journal_entry')
        router.push('/intensive/dashboard')
      } else {
        router.push('/journal')
      }
    } catch (error) {
      console.error('Error creating journal entry:', error)
      alert('Failed to create journal entry')
      // Hide progress bar on error
      setUploadProgress(prev => ({ ...prev, isVisible: false }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
                  {VISION_CATEGORIES.map((category) => (
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
    </>
  )
}