'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Input,
  Button,
  DatePicker,
  Stack,
  CategoryGrid,
} from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import {
  RecoverableTranscriptsBanner,
  type RecoverableTranscriptItem,
} from '@/components/journal/RecoverableTranscriptsBanner'
import { dismissRecoverableForSavedRecordings } from '@/lib/journal/recoverable-transcripts-client'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, Save, Map as MapIcon } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { JOURNAL_TAGS, JOURNAL_TAG_CONFIG, type JournalTag } from '@/lib/journal/journal-tags'
import { cn } from '@/lib/utils'

const RESTORE_SESSION_KEY = 'vf_restore_transcript'

type JournalAudioRecording = {
  url: string
  transcript: string
  type: 'audio' | 'video'
  category: string
  created_at: string
}

export type MapJournalLink = {
  occurrenceId: string
  commitmentTitle: string
  occurredOn: string
  category?: string | null
}

export interface NewJournalEntryFormProps {
  onCancel: () => void
  onSuccess: (entryId: string, meta?: { title: string }) => void | Promise<void>
  mapLink?: MapJournalLink
  showRecoverableBanner?: boolean
  cardClassName?: string
  categoryGridBleedClass?: string
}

function buildInitialForm(mapLink?: MapJournalLink) {
  if (mapLink) {
    return {
      date: mapLink.occurredOn,
      title: `MAP: ${mapLink.commitmentTitle}`,
      content: '',
      journal_tag: null as JournalTag | null,
      categories: mapLink.category ? [mapLink.category] : ([] as string[]),
    }
  }
  return {
    date: '',
    title: '',
    content: '',
    journal_tag: null as JournalTag | null,
    categories: [] as string[],
  }
}

export function NewJournalEntryForm({
  onCancel,
  onSuccess,
  mapLink,
  showRecoverableBanner = true,
  cardClassName,
  categoryGridBleedClass,
}: NewJournalEntryFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false,
  })
  const [files, setFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [audioRecordings, setAudioRecordings] = useState<JournalAudioRecording[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState(() => buildInitialForm(mapLink))

  const applyRestoredTranscript = (item: RecoverableTranscriptItem) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.trim()
        ? `${prev.content.trim()}\n\n${item.transcript}`
        : item.transcript,
    }))
    setAudioRecordings(prev => {
      const exists = prev.some(r => r.url === item.audioUrl)
      if (exists) return prev
      return [
        ...prev,
        {
          url: item.audioUrl,
          transcript: item.transcript,
          type: 'audio' as const,
          category: 'journal',
          created_at: item.transcribedAt,
        },
      ]
    })
  }

  useEffect(() => {
    if (mapLink) return
    setFormData(prev => ({
      ...prev,
      date: prev.date || new Date().toLocaleDateString('en-CA'),
    }))
  }, [mapLink])

  useEffect(() => {
    if (!showRecoverableBanner) return
    try {
      const raw = sessionStorage.getItem(RESTORE_SESSION_KEY)
      if (!raw) return
      sessionStorage.removeItem(RESTORE_SESSION_KEY)
      const item = JSON.parse(raw) as RecoverableTranscriptItem
      if (item?.transcript) applyRestoredTranscript(item)
    } catch {
      /* ignore invalid session payload */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecoverableBanner])

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleDeleteRecording = (index: number) => {
    setAudioRecordings(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setFieldErrors({})

    const hasAnything =
      formData.title.trim() ||
      formData.content.trim() ||
      formData.categories.length > 0 ||
      audioRecordings.length > 0 ||
      files.length > 0 ||
      aiGeneratedImageUrls.length > 0

    if (!hasAnything) {
      setFieldErrors({ content: 'Add something before saving -- even just a title.' })
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setSubmitError('Please log in to create a journal entry.')
        return
      }

      let imageUrls: string[] = []
      if (imageSource === 'ai' && aiGeneratedImageUrls.length > 0) {
        imageUrls = aiGeneratedImageUrls
      } else if (imageSource === 'upload' && files.length > 0) {
        setUploadProgress({
          progress: 0,
          status: 'Preparing files for upload...',
          fileName: files.length > 1 ? `${files.length} files` : files[0]?.name || '',
          fileSize: files.reduce((total, file) => total + file.size, 0),
          isVisible: true,
        })

        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id, progress => {
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.round(progress),
            status: progress < 100 ? 'Uploading files...' : 'Processing files...',
          }))
        })

        const errors = uploadResults.filter(
          (result: { url: string; key: string; error?: string }) => result.error,
        )
        if (errors.length > 0) {
          const errorMessages = errors.map((err: { error?: string }) =>
            getUploadErrorMessage(new Error(err.error || 'Unknown error')),
          )
          setSubmitError([...new Set(errorMessages)].join(' '))
          return
        }

        imageUrls = uploadResults
          .filter((result: { url: string; key: string; error?: string }) => !result.error && result.url)
          .map((result: { url: string; key: string; error?: string }) => result.url)
      }

      const { data: createdEntry, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date: formData.date,
          title: formData.title,
          content: formData.content,
          journal_tag: formData.journal_tag,
          categories: formData.categories,
          image_urls: imageUrls,
          audio_recordings: audioRecordings,
        })
        .select('id')
        .single()

      if (error || !createdEntry?.id) throw error ?? new Error('Failed to create entry')

      if (mapLink) {
        const linkRes = await fetch(`/api/map/occurrences/${mapLink.occurrenceId}/journal`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journal_entry_id: createdEntry.id }),
        })
        if (!linkRes.ok) {
          const linkData = await linkRes.json().catch(() => ({}))
          throw new Error(
            (linkData as { error?: string }).error ||
              'Journal saved but could not link to your MAP log. Try again.',
          )
        }
      }

      dismissRecoverableForSavedRecordings(audioRecordings)

      try {
        await supabase.rpc('increment_journal_stats', { p_user_id: user.id })
      } catch (statsErr) {
        console.warn('Failed to update journal stats:', statsErr)
      }

      if (!mapLink) {
        try {
          const { autoVerifyClient } = await import('@/lib/map/auto-verify-client')
          autoVerifyClient({ activityType: 'journal_entry' })
        } catch {
          /* non-critical */
        }
      }

      setUploadProgress(prev => ({ ...prev, isVisible: false }))
      await onSuccess(createdEntry.id, { title: formData.title })
    } catch (error: unknown) {
      console.error('Error creating journal entry:', error)
      let friendlyMessage: string
      if (error && typeof error === 'object' && 'code' in error) {
        const pgErr = error as { message?: string; code?: string; details?: string }
        friendlyMessage = pgErr.message || 'Database error. Please try again.'
      } else {
        friendlyMessage = getUploadErrorMessage(error)
      }
      setSubmitError(friendlyMessage)
      setUploadProgress(prev => ({ ...prev, isVisible: false }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {mapLink ? (
          <Card
            variant="outlined"
            className="border-primary-500/25 bg-primary-500/[0.04] !py-4 !px-5"
          >
            <div className="flex items-start gap-3">
              <MapIcon className="w-5 h-5 shrink-0 text-primary-500 mt-0.5" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">MAP reflection</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Optional journal for{' '}
                  <span className="text-neutral-300">{mapLink.commitmentTitle}</span> on{' '}
                  {mapLink.occurredOn}. Saving links this entry to that MAP log.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card
          variant="outlined"
          className={cn(
            '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]',
            cardClassName,
          )}
        >
          <Stack gap="lg">
            <div className="flex justify-end">
              <div className="[&_input]:!w-auto [&_input]:!min-w-[170px] [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!rounded-none [&_input]:!px-0 [&_input]:!py-0 [&_input]:!pr-10 [&_input]:!text-right [&_input]:!text-[11px] [&_input]:!font-medium [&_input]:!uppercase [&_input]:!tracking-[0.2em] [&_input]:!text-neutral-500 [&_input]:placeholder:!text-neutral-500 [&_input]:focus:!ring-0 [&_svg]:!text-neutral-400">
                <DatePicker
                  value={formData.date}
                  onChange={(dateString: string) => setFormData({ ...formData, date: dateString })}
                  className="w-auto"
                  required
                />
              </div>
            </div>

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
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="!bg-[#1A1A1A] !border-[#282828] !text-base !font-medium !text-center"
              />
            </section>

            <section className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                Entry type{' '}
                <span className="normal-case tracking-normal text-neutral-600">-- optional</span>
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {JOURNAL_TAGS.map(tag => {
                  const config = JOURNAL_TAG_CONFIG[tag]
                  const TagIcon = config.icon
                  const isSelected = formData.journal_tag === tag
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, journal_tag: isSelected ? null : tag })
                      }
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

            {showRecoverableBanner ? (
              <RecoverableTranscriptsBanner onRestore={applyRestoredTranscript} />
            ) : null}

            <div className={categoryGridBleedClass}>
              <CategoryGrid
                title="Tag life categories"
                categories={VISION_CATEGORIES.filter(
                  category => category.key !== 'forward' && category.key !== 'conclusion',
                )}
                selectedCategories={formData.categories}
                onCategoryClick={handleCategoryToggle}
                pillLabel="Tag life categories"
                lifeVisionCategoryStrip
                desktopColumnCount={6}
              />
            </div>

            <section className="space-y-3">
              <p
                className={`text-[11px] uppercase tracking-[0.2em] text-center ${fieldErrors.content ? 'text-red-400' : 'text-neutral-500'}`}
              >
                Journal entry {fieldErrors.content ? `-- ${fieldErrors.content}` : ''}
              </p>
              <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                <RecordingTextarea
                  label=""
                  value={formData.content}
                  onChange={value => setFormData({ ...formData, content: value })}
                  rows={8}
                  placeholder="Write your journal entry here... Or tap the mic to record."
                  storageFolder="journal"
                  recordingPurpose="quick"
                  category="journal"
                  onAudioSaved={(audioUrl, transcript) => {
                    setAudioRecordings(prev => [
                      ...prev,
                      {
                        url: audioUrl,
                        transcript,
                        type: 'audio' as const,
                        category: 'journal',
                        created_at: new Date().toISOString(),
                      },
                    ])
                  }}
                />
              </div>

              {audioRecordings.length > 0 ? (
                <SavedRecordings
                  key={`journal-recordings-${audioRecordings.length}`}
                  recordings={audioRecordings}
                  categoryFilter="journal"
                  onDelete={handleDeleteRecording}
                />
              ) : null}
            </section>

            <section className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                Evidence / images
              </p>
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

                {imageSource === 'upload' ? (
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
                ) : null}

                {imageSource === 'ai' ? (
                  <AIImageGenerator
                    type="journal"
                    onImageGenerated={url => setAiGeneratedImageUrls([url])}
                    journalText={
                      formData.title && formData.content
                        ? `${formData.title}. ${formData.content}`
                        : formData.content || formData.title || ''
                    }
                  />
                ) : null}
              </div>
            </section>

            <UploadProgress
              progress={uploadProgress.progress}
              status={uploadProgress.status}
              fileName={uploadProgress.fileName}
              fileSize={uploadProgress.fileSize}
              isVisible={uploadProgress.isVisible}
            />

            {submitError ? (
              <div className="rounded-xl border border-[#D03739]/40 bg-[#D03739]/10 px-4 py-3 text-sm text-[#FFB4B4]">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-row gap-2 sm:gap-3 justify-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onCancel}
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
  )
}
