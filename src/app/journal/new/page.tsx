'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Input, Button, CategoryCard, DatePicker, PageHero, Container, Stack } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { JournalSuccessScreen } from '@/components/JournalSuccessScreen'
import { JournalVideoRecorder } from '@/components/JournalVideoRecorder'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, Save, Video as VideoIcon } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { colors } from '@/lib/design-system/tokens'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveMode = searchParams.get('intensive') === 'true'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
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
  const [videoRecordings, setVideoRecordings] = useState<any[]>([])
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format in local timezone
    title: '',
    content: '',
    categories: [] as string[]
  })

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleCreateAnother = () => {
    // Reset form to create another entry
    setShowSuccess(false)
    setFormData({
      date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format in local timezone
      title: '',
      content: '',
      categories: []
    })
    setFiles([])
    setAiGeneratedImageUrls([])
    setImageSource(null)
    setAudioRecordings([])
    setVideoRecordings([])
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewJournal = () => {
    router.push('/journal')
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

  const handleVideoSaved = (url: string, blob: Blob) => {
    console.log('🎥 Video saved:', url)
    
    const newRecording = {
      url,
      type: 'video',
      category: 'journal',
      created_at: new Date().toISOString(),
      size: blob.size
    }
    
    setVideoRecordings(prev => [...prev, newRecording])
    setShowVideoRecorder(false)
  }

  const handleDeleteVideo = (index: number) => {
    setVideoRecordings(prev => prev.filter((_, i) => i !== index))
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
          
          // Use user-friendly error messages
          const errorMessages = errors.map((e: { error?: string }) => 
            getUploadErrorMessage(new Error(e.error || 'Unknown error'))
          )
          
          // Show unique error messages (avoid duplicates)
          const uniqueMessages = [...new Set(errorMessages)]
          alert(uniqueMessages.join('\n\n'))
          return
        }

        // Only use successful uploads
        imageUrls = uploadResults
          .filter((result: { url: string; key: string; error?: string }) => !result.error && result.url)
          .map((result: { url: string; key: string; error?: string }) => result.url)

        console.log('✅ Upload successful, image URLs:', imageUrls)
      }

      // Combine audio and video recordings
      const allRecordings = [...audioRecordings, ...videoRecordings]

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
          audio_recordings: allRecordings
        })

      if (error) throw error

      // Update user stats
      await supabase.rpc('increment_journal_stats', { p_user_id: user.id })

      // Hide progress bar
      setUploadProgress(prev => ({ ...prev, isVisible: false }))

      // If in intensive mode, mark first journal entry as complete then redirect
      if (isIntensiveMode) {
        const { markIntensiveStep } = await import('@/lib/intensive/checklist')
        await markIntensiveStep('first_journal_entry')
        router.push('/intensive/dashboard')
      } else {
        // Show success screen for normal mode
        setShowSuccess(true)
      }
    } catch (error) {
      console.error('Error creating journal entry:', error)
      // Use user-friendly error message
      const friendlyMessage = getUploadErrorMessage(error)
      alert(`Failed to save journal entry: ${friendlyMessage}`)
      // Hide progress bar on error
      setUploadProgress(prev => ({ ...prev, isVisible: false }))
    } finally {
      setLoading(false)
    }
  }

  // Show success screen after submission
  if (showSuccess) {
    return (
      <JournalSuccessScreen
        onCreateAnother={handleCreateAnother}
        onViewJournal={handleViewJournal}
        entryTitle={formData.title}
      />
    )
  }

  return (
    <>
      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <JournalVideoRecorder
          onVideoSaved={handleVideoSaved}
          onClose={() => setShowVideoRecorder(false)}
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
      )}

      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="New Journal Entry"
            subtitle="Capture your thoughts, evidence, and insights"
          />

        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(dateString: string) => setFormData({ ...formData, date: dateString })}
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

              {/* Video Recording */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3 text-center">
                  Record Video (Optional)
                </label>
                
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => setShowVideoRecorder(true)}
                  className="w-full"
                >
                  <VideoIcon className="w-5 h-5 mr-2" />
                  Record Video
                </Button>

                {/* Display Video Recordings */}
                {videoRecordings.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {videoRecordings.map((recording, index) => (
                      <div key={index} className="relative bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                            <VideoIcon className="w-6 h-6 text-secondary-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Video Recording</p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {new Date(recording.created_at).toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              Size: {(recording.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(index)}
                            className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Upload className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                        
                        {/* Video Preview */}
                        <div className="mt-3">
                          <video
                            src={recording.url}
                            controls
                            className="w-full rounded-lg bg-black"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
                  onClick={() => router.back()}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={loading}
                  disabled={loading}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </Stack>
      </Container>
    </>
  )
}