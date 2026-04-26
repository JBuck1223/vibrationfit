'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Input, Button, DatePicker, Container, Stack, FullBleed, IntensiveStepCompleteModal } from '@/lib/design-system'
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
import { JOURNAL_TAGS, JOURNAL_TAG_CONFIG, type JournalTag } from '@/lib/journal/journal-tags'

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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    date: '', // Will be set after mount to avoid hydration mismatch
    title: '',
    content: '',
    journal_tag: null as JournalTag | null,
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
      date: new Date().toLocaleDateString('en-CA'),
      title: '',
      content: '',
      journal_tag: null,
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
    setSubmitError(null)
    setFieldErrors({})

    const hasAnything = formData.title.trim() || formData.content.trim() || formData.categories.length > 0 || audioRecordings.length > 0 || files.length > 0 || aiGeneratedImageUrls.length > 0
    if (!hasAnything) {
      setFieldErrors({ content: 'Add something before saving -- even just a title.' })
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubmitError('Please log in to create a journal entry.')
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
          
          const uniqueMessages = [...new Set(errorMessages)]
          setSubmitError(uniqueMessages.join(' '))
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
          journal_tag: formData.journal_tag,
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
      const friendlyMessage = getUploadErrorMessage(error)
      setSubmitError(friendlyMessage)
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Unified Card — Full Entry Content */}
          <Card variant="outlined" className="!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]">
            <Stack gap="lg">
              <div className="flex justify-end">
                {/* Date control - top right */}
                <div>
                  <div className="[&_input]:!w-auto [&_input]:!min-w-[170px] [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!rounded-none [&_input]:!px-0 [&_input]:!py-0 [&_input]:!pr-10 [&_input]:!text-right [&_input]:!text-[11px] [&_input]:!font-medium [&_input]:!uppercase [&_input]:!tracking-[0.2em] [&_input]:!text-neutral-500 [&_input]:placeholder:!text-neutral-500 [&_input]:focus:!ring-0 [&_svg]:!text-neutral-400">
                    <DatePicker
                      value={formData.date}
                      onChange={(dateString: string) => setFormData({ ...formData, date: dateString })}
                      className="w-auto"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <section className="space-y-3 text-center">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#2A2A2A]" />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Entry title</p>
                  <div className="h-px flex-1 bg-[#2A2A2A]" />
                </div>
                <Input
                  type="text"
                  placeholder="Please enter journal entry title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="!bg-[#1A1A1A] !border-[#282828] !text-base !font-medium !text-center"
                />
              </section>

              {/* Entry Type — single-select tag pills */}
              <section className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Entry type <span className="normal-case tracking-normal text-neutral-600">-- optional</span></p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {JOURNAL_TAGS.map((tag) => {
                    const config = JOURNAL_TAG_CONFIG[tag]
                    const TagIcon = config.icon
                    const isSelected = formData.journal_tag === tag
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData({ ...formData, journal_tag: isSelected ? null : tag })}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200"
                        style={{
                          borderColor: config.color,
                          backgroundColor: isSelected ? config.color : 'transparent',
                          color: isSelected ? '#000' : config.color,
                        }}
                      >
                        <TagIcon className="w-4 h-4" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Life Categories */}
              <FullBleed>
                <section className="space-y-2">
                  <p className="hidden md:block text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Tag life categories</p>
                  <div className="flex items-center justify-between gap-3 mb-1.5 md:hidden px-4">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500">Tag life categories</p>
                    <span className="text-[10px] text-neutral-600">Scroll to see all &rarr;</span>
                  </div>
                  <div className="flex items-center md:justify-center gap-2 overflow-x-auto pb-1 px-4 md:px-0 scrollbar-hide">
                  {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                    const CatIcon = category.icon
                    const isSelected = formData.categories.includes(category.key)
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => handleCategoryToggle(category.key)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        {category.label}
                      </button>
                    )
                  })}
                  </div>
                </section>
              </FullBleed>

              {/* Journal Content */}
              <section className="space-y-3">
                <p className={`text-[11px] uppercase tracking-[0.2em] text-center ${fieldErrors.content ? 'text-red-400' : 'text-neutral-500'}`}>
                  Journal entry {fieldErrors.content ? `-- ${fieldErrors.content}` : ''}
                </p>
                <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                  <RecordingTextarea
                    label=""
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    rows={8}
                    placeholder="Write your journal entry here... Or tap the mic to record."
                    storageFolder="journal"
                    recordingPurpose="quick"
                    category="journal"
                    onAudioSaved={(audioUrl, transcript) => {
                      setAudioRecordings(prev => [...prev, {
                        url: audioUrl,
                        transcript,
                        type: 'audio' as const,
                        category: 'journal',
                        created_at: new Date().toISOString(),
                      }])
                    }}
                  />
                </div>

                {audioRecordings.length > 0 && (
                  <SavedRecordings
                    key={`journal-recordings-${audioRecordings.length}`}
                    recordings={audioRecordings}
                    categoryFilter="journal"
                    onDelete={handleDeleteRecording}
                  />
                )}
              </section>

              {/* Evidence / Images */}
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Evidence / images</p>
                <div className="rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4 flex flex-col items-stretch gap-3">
                  <div className="flex flex-row gap-2 items-center justify-center">
                    <Button
                      type="button"
                      variant={imageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('upload')
                        setAiGeneratedImageUrls([])
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Upload className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                      size="sm"
                      onClick={() => {
                        setImageSource('ai')
                        setFiles([])
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      VIVA Generate
                    </Button>
                  </div>

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

              {/* Upload Progress */}
              <UploadProgress
                progress={uploadProgress.progress}
                status={uploadProgress.status}
                fileName={uploadProgress.fileName}
                fileSize={uploadProgress.fileSize}
                isVisible={uploadProgress.isVisible}
              />

              {submitError && (
                <div className="rounded-xl border border-[#D03739]/40 bg-[#D03739]/10 px-4 py-3 text-sm text-[#FFB4B4]">
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-row gap-2 sm:gap-3 justify-end">
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
          </Card>
        </Stack>
      </form>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="journal"
      />
    </Container>
  )
}