'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, CategoryCard, DatePicker } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'
import { Sparkles, Upload, X, Save } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { colors } from '@/lib/design-system/tokens'

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
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false
  })

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

  const handleDeleteExistingFile = () => {
    if (fileToDelete !== null) {
      setExistingFiles(prev => prev.filter((_, i) => i !== fileToDelete))
      setFileToDelete(null)
      setDeleteDialogOpen(false)
    }
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
        
        // Check for upload errors
        const errors = uploadResults.filter((result: { url: string; key: string; error?: string }) => result.error)
        if (errors.length > 0) {
          console.error('❌ Upload errors:', errors)
          
          // Check if it's a CORS/405 error
          const hasCorsError = errors.some((e: { error?: string }) => 
            e.error?.includes('405') || e.error?.includes('CORS')
          )
          
          if (hasCorsError) {
            alert(
              `Upload failed: S3 CORS configuration issue detected.\n\n` +
              `This usually happens with larger files. The system attempted automatic fallback but it also failed.\n\n` +
              `Please try:\n` +
              `1. Use smaller images (under 10MB)\n` +
              `2. Contact support if the issue persists\n\n` +
              `Technical details: ${errors.map((e: { error?: string }) => e.error).join(', ')}`
            )
          } else {
            alert(`Upload failed: ${errors.map((e: { error?: string }) => e.error).join(', ')}`)
          }
          return
        }

        // Only use successful uploads
        const newImageUrls = uploadResults
          .filter((result: { url: string; key: string; error?: string }) => !result.error && result.url)
          .map((result: { url: string; key: string; error?: string }) => result.url)

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
      <>
        <div className="text-center py-16">
          <div className="text-neutral-400">Loading journal entry...</div>
        </div>
      </>
    )
  }

  if (!entry) {
    return (
      <>
        <div className="text-center py-16">
          <div className="text-neutral-400">Entry not found</div>
        </div>
      </>
    )
  }

  return (
    <>
        <div className="pb-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Edit Journal Entry
            </h1>
          </div>

          <Card>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Date */}
          <div>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(dateString) => setFormData({ ...formData, date: dateString })}
              required
            />
          </div>

          {/* Title */}
          <div>
            <Input
              label="Entry Title"
              type="text"
              placeholder="What's on your mind today?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Life Categories */}
          <div>
            <p className="block text-sm font-medium text-neutral-200 mb-3 text-center">
              Select categories for your journal entry
            </p>
            <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
              {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                const isSelected = formData.categories.includes(category.key)
                return (
                  <CategoryCard 
                    key={category.key} 
                    category={category} 
                    selected={isSelected} 
                    onClick={() => handleCategoryToggle(category.key)}
                    variant="outlined"
                    selectionStyle="border"
                    iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                    selectedIconColor="#39FF14"
                    className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                  />
                )
              })}
            </div>
          </div>

          {/* Evidence / Images */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3 text-center">
              Evidence / Images (Optional)
            </label>
            
            {/* Show existing files */}
            {existingFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-neutral-400 mb-2 text-center">Existing attachments ({existingFiles.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-4 justify-items-center">
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
                      <button
                        type="button"
                        onClick={() => {
                          setFileToDelete(index)
                          setDeleteDialogOpen(true)
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#D03739] hover:bg-[#EF4444] flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Toggle Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Button
                type="button"
                variant={imageSource === 'upload' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setImageSource('upload')
                  setAiGeneratedImageUrls([])
                }}
                className="w-full sm:flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <button
                type="button"
                onClick={() => {
                  setImageSource('ai')
                  setFiles([])
                }}
                style={
                  imageSource === 'ai'
                    ? {
                        backgroundColor: colors.semantic.premium,
                        borderColor: colors.semantic.premium,
                      }
                    : {
                        borderColor: colors.semantic.premium,
                        color: colors.semantic.premium,
                      }
                }
                className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                  imageSource === 'ai'
                    ? 'text-white hover:opacity-90'
                    : 'bg-transparent hover:bg-[#BF00FF]/10'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with VIVA
              </button>
            </div>

            {/* Enhanced FileUpload Component */}
            {imageSource === 'upload' && (
              <FileUpload
                dragDrop
                accept="image/*,video/*,audio/*"
                multiple
                maxFiles={5}
                maxSize={500}
                value={files}
                onChange={setFiles}
                onUpload={setFiles}
                dragDropText="Click to upload or drag and drop"
                dragDropSubtext="Images, videos, or audio (max 5 files, 500MB each)"
                previewSize="lg"
              />
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

          {/* Upload Progress */}
          <UploadProgress
            progress={uploadProgress.progress}
            status={uploadProgress.status}
            fileName={uploadProgress.fileName}
            fileSize={uploadProgress.fileSize}
            isVisible={uploadProgress.isVisible}
          />

          {/* Submit */}
          <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => router.push(`/journal/${entry.id}`)}
              disabled={saving}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={saving}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
          </Card>
        </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete File?</h3>
            <p className="text-neutral-300 mb-6">
              Are you sure you want to remove this file from the journal entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setFileToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteExistingFile}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

    </>
  )
}
