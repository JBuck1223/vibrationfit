'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { Sparkles, Upload, Save, Map as MapIcon, ImageIcon, Plus, X } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { JOURNAL_TAGS, JOURNAL_TAG_CONFIG, type JournalTag } from '@/lib/journal/journal-tags'
import { cn } from '@/lib/utils'
import { useInShell } from '@/lib/app-shell/shell-context'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { DateSheetField } from '@/components/app-shell/forms/DateSheetField'
import { VivaImagePanel } from '@/components/app-shell/forms/VivaImagePanel'

const RESTORE_SESSION_KEY = 'vf_restore_transcript'
/** Unsaved title/text/tags for a new entry, kept on this device until it's saved. */
const DRAFT_KEY = 'vf_journal_draft'

const ENTRY_CATEGORIES = VISION_CATEGORIES.filter(
  category => category.key !== 'forward' && category.key !== 'conclusion',
)

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
  /** Preset the tag (e.g. a guided flow opening a wobble or a win). */
  initialTag?: JournalTag | null
  /** Opening text for the entry. */
  initialContent?: string
}

function buildInitialForm(mapLink?: MapJournalLink, initialTag?: JournalTag | null, initialContent?: string) {
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
    content: initialContent ?? '',
    journal_tag: (initialTag ?? null) as JournalTag | null,
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
  initialTag,
  initialContent,
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
  const [formData, setFormData] = useState(() => buildInitialForm(mapLink, initialTag, initialContent))
  const inShell = useInShell()
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  // Drafts only for a plain new entry (not a MAP reflection or a guided prefill).
  const useDraft = !mapLink && !initialContent && !initialTag

  useEffect(() => {
    if (!useDraft) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Partial<typeof formData>
      setFormData(prev => ({
        ...prev,
        title: prev.title || draft.title || '',
        content: prev.content || draft.content || '',
        journal_tag: prev.journal_tag ?? draft.journal_tag ?? null,
        categories: prev.categories.length ? prev.categories : draft.categories ?? [],
      }))
      setDraftSaved(true)
    } catch {
      /* storage unavailable or a bad value */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!useDraft) return
    const empty = !formData.title.trim() && !formData.content.trim() && !formData.journal_tag && formData.categories.length === 0
    const t = window.setTimeout(() => {
      try {
        if (empty) {
          localStorage.removeItem(DRAFT_KEY)
          setDraftSaved(false)
        } else {
          const { title, content, journal_tag, categories } = formData
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, journal_tag, categories }))
          setDraftSaved(true)
        }
      } catch {
        /* storage unavailable */
      }
    }, 600)
    return () => window.clearTimeout(t)
  }, [formData, useDraft])

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
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* storage unavailable */
      }
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

  const mapReflectionCard = mapLink ? (
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
  ) : null

  const recordingTextarea = (
    <RecordingTextarea
      label=""
      value={formData.content}
      onChange={value => setFormData({ ...formData, content: value })}
      rows={inShell ? 9 : 8}
      placeholder={inShell ? "What's on your mind today? Or tap the mic and talk." : 'Write your journal entry here... Or tap the mic to record.'}
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
  )

  const savedRecordings =
    audioRecordings.length > 0 ? (
      <SavedRecordings
        key={`journal-recordings-${audioRecordings.length}`}
        recordings={audioRecordings}
        categoryFilter="journal"
        onDelete={handleDeleteRecording}
      />
    ) : null

  const imagePanels = (
    <>
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
          onImageGenerated={url => setAiGeneratedImageUrls(url ? [url] : [])}
          journalText={
            formData.title && formData.content
              ? `${formData.title}. ${formData.content}`
              : formData.content || formData.title || ''
          }
        />
      ) : null}
    </>
  )

  const statusArea = (
    <>
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
    </>
  )

  if (inShell) {
    // App shell: a writing-first composer. Same fields and saving as below,
    // with the writing on top and everything else kept small.
    const chip = 'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors'
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {mapReflectionCard}

        <div className={cn(GLASS_CARD, 'p-4 md:p-5', cardClassName)}>
          <div className="mb-2 flex items-center gap-3">
            <div data-tour="journal-create-date">
              <DateSheetField value={formData.date} onChange={date => setFormData({ ...formData, date })} />
            </div>
            {useDraft && draftSaved ? <span className="text-xs text-white/40">Draft saved</span> : null}
            <div className="ml-auto hidden items-center gap-2 md:flex">
              <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#39FF14] px-5 py-2 text-sm font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <input
            type="text"
            data-tour="journal-create-title"
            placeholder="Title (optional)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-white/35 focus:outline-none"
          />

          {showRecoverableBanner ? (
            <div className="mt-3">
              <RecoverableTranscriptsBanner onRestore={applyRestoredTranscript} />
            </div>
          ) : null}

          <div
            data-tour="journal-create-entry"
            className="mt-2 [&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!px-0 [&_textarea]:!text-[15px] [&_textarea]:!leading-relaxed [&_textarea]:!text-white [&_textarea]:placeholder:!text-white/40 [&_textarea]:focus:!ring-0 [&_textarea]:!shadow-none"
          >
            {recordingTextarea}
          </div>
          {fieldErrors.content ? <p className="mt-1 text-xs text-red-400">{fieldErrors.content}</p> : null}
          {savedRecordings ? <div className="mt-3">{savedRecordings}</div> : null}

          <div className="mt-3 flex flex-wrap gap-2" data-tour="journal-create-type">
            {JOURNAL_TAGS.map(tag => {
              const config = JOURNAL_TAG_CONFIG[tag]
              const TagIcon = config.icon
              const isSelected = formData.journal_tag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFormData({ ...formData, journal_tag: isSelected ? null : tag })}
                  className={chip}
                  style={{
                    borderColor: isSelected ? config.color : 'rgba(255,255,255,0.18)',
                    backgroundColor: isSelected ? config.bgColor : 'transparent',
                    color: isSelected ? config.color : 'rgba(255,255,255,0.8)',
                  }}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  {config.label}
                </button>
              )
            })}
            {formData.categories.map(key => {
              const category = ENTRY_CATEGORIES.find(c => c.key === key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryToggle(key)}
                  aria-label={`Remove ${category?.label ?? key}`}
                  className={cn(chip, 'border-[#39FF14]/50 bg-[rgba(57,255,20,0.1)] text-[#39FF14]')}
                >
                  {category?.label ?? key}
                  <X className="h-3 w-3" />
                </button>
              )
            })}
            <button
              type="button"
              data-tour="journal-create-categories"
              onClick={() => setCategorySheetOpen(true)}
              className={cn(chip, 'border-dashed border-white/30 text-white/75 hover:text-white')}
            >
              <Plus className="h-3.5 w-3.5" /> Categories
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-white/[0.08] pt-3 text-sm" data-tour="journal-create-evidence">
            <button
              type="button"
              onClick={() => {
                setImageSource(imageSource === 'upload' ? null : 'upload')
                setAiGeneratedImageUrls([])
              }}
              className={cn('flex items-center gap-1.5 transition-colors', imageSource === 'upload' ? 'text-[#39FF14]' : 'text-white/70 hover:text-white')}
            >
              <ImageIcon className="h-4 w-4" /> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setImageSource(imageSource === 'ai' ? null : 'ai')
                setFiles([])
              }}
              className={cn('flex items-center gap-1.5 transition-colors', imageSource === 'ai' ? 'text-[#BF00FF]' : 'text-white/70 hover:text-white')}
            >
              <Sparkles className="h-4 w-4 text-[#d68bff]" /> VIVA image
            </button>
          </div>
          {imageSource === 'upload' ? <div className="mt-3">{imagePanels}</div> : null}
          {imageSource === 'ai' ? (
            <div className="mt-3">
              <VivaImagePanel
                journalText={[formData.title, formData.content].filter(Boolean).join('. ')}
                onUse={url => setAiGeneratedImageUrls(url ? [url] : [])}
                onClose={() => {
                  setImageSource(null)
                  setAiGeneratedImageUrls([])
                }}
              />
            </div>
          ) : null}
        </div>

        {statusArea}

        {/* Phones: Save stays in reach above the bottom bar while writing. */}
        <div className="sticky bottom-[calc(var(--shell-nav-height,76px)+env(safe-area-inset-bottom,0px)+16px)] z-20 md:hidden">
          <button
            type="submit"
            disabled={loading}
            data-tour="journal-create-save"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save entry'}
          </button>
        </div>

        {categorySheetOpen && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 md:items-center" onClick={() => setCategorySheetOpen(false)}>
            <div
              role="dialog"
              aria-label="Life categories"
              onClick={e => e.stopPropagation()}
              className="vf-glass w-full max-w-lg rounded-t-[26px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] backdrop-blur-2xl md:rounded-[26px]"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25 md:hidden" />
              <p className="mb-3 text-base font-semibold text-white">Life categories</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {ENTRY_CATEGORIES.map(category => {
                  const selected = formData.categories.includes(category.key)
                  const Icon = category.icon
                  return (
                    <button
                      key={category.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleCategoryToggle(category.key)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-xs transition-colors',
                        selected ? 'border-[#39FF14] bg-[rgba(57,255,20,0.12)] text-[#39FF14]' : 'border-white/15 text-white/80 hover:text-white',
                      )}
                    >
                      {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                      {category.label}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setCategorySheetOpen(false)}
                className="mt-4 h-11 w-full rounded-full bg-white/10 text-sm font-medium text-white hover:bg-white/15"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        ) : null}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {mapReflectionCard}

        <Card
          variant="outlined"
          className={cn(
            '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]',
            cardClassName,
          )}
        >
          <Stack gap="lg">
            <div className="flex justify-end">
              <div
                data-tour="journal-create-date"
                className="[&_input]:!w-auto [&_input]:!min-w-[170px] [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!rounded-none [&_input]:!px-0 [&_input]:!py-0 [&_input]:!pr-10 [&_input]:!text-right [&_input]:!text-[11px] [&_input]:!font-medium [&_input]:!uppercase [&_input]:!tracking-[0.2em] [&_input]:!text-neutral-500 [&_input]:placeholder:!text-neutral-500 [&_input]:focus:!ring-0 [&_svg]:!text-neutral-400"
              >
                <DatePicker
                  value={formData.date}
                  onChange={(dateString: string) => setFormData({ ...formData, date: dateString })}
                  className="w-auto"
                  required
                />
              </div>
            </div>

            <section className="space-y-3 text-center" data-tour="journal-create-title">
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

            <section className="space-y-2" data-tour="journal-create-type">
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

            <div className={categoryGridBleedClass} data-tour="journal-create-categories">
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

            <section className="space-y-3" data-tour="journal-create-entry">
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

            <section className="space-y-3" data-tour="journal-create-evidence">
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
                    onImageGenerated={url => setAiGeneratedImageUrls(url ? [url] : [])}
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
                data-tour="journal-create-save"
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
