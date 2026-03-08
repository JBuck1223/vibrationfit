'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Input, Button, CategoryCard, DatePicker, PageHero, Container, Stack, Text, Inline, IntensiveStepCompleteModal } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { JournalSuccessScreen } from '@/components/JournalSuccessScreen'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, Save } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveUrlParam = searchParams.get('intensive') === 'true'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isUserInIntensive, setIsUserInIntensive] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
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
    date: '', // Will be set after mount to avoid hydration mismatch
    title: '',
    content: '',
    categories: [] as string[]
  })

  // Set initial date after mount to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format in local timezone
    }))
  }, [])

  // Check if user is in intensive mode
  useEffect(() => {
    const checkIntensiveMode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user has an active intensive checklist
        const { data: checklist } = await supabase
          .from('intensive_checklist')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .maybeSingle()

        setIsUserInIntensive(!!checklist || isIntensiveUrlParam)
      } catch (error) {
        console.error('Error checking intensive mode:', error)
      }
    }
    
    checkIntensiveMode()
  }, [isIntensiveUrlParam])

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
      date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format - safe here as it's triggered by user action
      title: '',
      content: '',
      categories: []
    })
    setFiles([])
    setAiGeneratedImageUrls([])
    setImageSource(null)
    setAudioRecordings([])
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

      // Audio recordings
      const allRecordings = [...audioRecordings]

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

      // If in intensive mode, mark first journal entry as complete and show modal
      if (isUserInIntensive) {
        const { markIntensiveStep } = await import('@/lib/intensive/checklist')
        await markIntensiveStep('first_journal_entry')
        setShowStepCompleteModal(true)
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
    <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="New Journal Entry"
            subtitle="Capture your thoughts, evidence, and insights"
          />

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <form onSubmit={handleSubmit}>
              <Stack gap="xl">
              {/* Date - same layout as daily-paper/new */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                <Inline className="items-center gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Entry date
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {formData.date
                        ? new Intl.DateTimeFormat(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(`${formData.date}T00:00:00`))
                        : '—'}
                    </p>
                  </div>
                  <div className="ml-auto w-full md:w-auto">
                    <DatePicker
                      value={formData.date}
                      onChange={(dateString: string) => setFormData({ ...formData, date: dateString })}
                      className="w-full md:w-auto"
                      required
                    />
                  </div>
                </Inline>
              </div>

              {/* Title */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Entry title
                </Text>
                <Input
                  type="text"
                  placeholder="What's on your mind today?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="!bg-[#404040] !border-[#333]"
                />
              </section>

              {/* Life Categories */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Life categories
                </Text>
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
              </section>

              {/* Evidence / Images */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Evidence / images (optional)
                </Text>
                <div className="rounded-2xl border border-dashed border-[#333] bg-[#131313] p-5 md:p-6 flex flex-col items-stretch justify-center gap-4">
                {/* Toggle Buttons - centered in card */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center self-center">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageSource('upload')
                      setAiGeneratedImageUrls([])
                    }}
                    className="w-full sm:flex-1 sm:max-w-[200px]"
                  >
                    <Upload className="w-5 h-5 mr-2 flex-shrink-0" />
                    Upload Files
                  </Button>
                  <Button
                    type="button"
                    variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                    size="sm"
                    onClick={() => {
                      setImageSource('ai')
                      setFiles([])
                    }}
                    className="w-full sm:flex-1 sm:max-w-[200px]"
                  >
                    <Sparkles className="w-5 h-5 mr-2 flex-shrink-0" />
                    Generate with VIVA
                  </Button>
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
              </section>

              {/* Journal Content */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Journal entry
                </Text>
              <RecordingTextarea
                label=""
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
              </section>

              {/* Upload Progress */}
              <UploadProgress
                progress={uploadProgress.progress}
                status={uploadProgress.status}
                fileName={uploadProgress.fileName}
                fileSize={uploadProgress.fileSize}
                isVisible={uploadProgress.isVisible}
              />

              {/* Submit */}
              <div className="flex flex-row gap-2 sm:gap-3 justify-end pt-2">
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
              </Stack>
            </form>
          </Card>
        </Stack>

        <IntensiveStepCompleteModal
          isOpen={showStepCompleteModal}
          onClose={() => setShowStepCompleteModal(false)}
          stepId="journal"
        />
      </Container>
  )
}