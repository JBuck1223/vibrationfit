'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Input,
  Button,
  DatePicker,
  Stack,
  FullBleed,
  CategoryGrid,
} from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, Save, X } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { JOURNAL_TAGS, JOURNAL_TAG_CONFIG, type JournalTag } from '@/lib/journal/journal-tags'
import { cn } from '@/lib/utils'

type JournalAudioRecording = {
  url: string
  transcript: string
  type: 'audio' | 'video'
  category: string
  created_at: string
}

export interface JournalEditEntry {
  id: string
  user_id: string
  date: string
  title: string | null
  content: string | null
  categories: string[] | null
  image_urls: string[] | null
  thumbnail_urls?: string[] | null
  audio_recordings: JournalAudioRecording[] | null
  journal_tag?: JournalTag | null
  created_at: string
  updated_at: string
}

type UploadState = {
  progress: number
  status: string
  fileName: string
  fileSize: number
  isVisible: boolean
}

const initialUpload: UploadState = {
  progress: 0,
  status: '',
  fileName: '',
  fileSize: 0,
  isVisible: false,
}

function parseJournalTag(raw: unknown): JournalTag | null {
  if (raw === 'vision' || raw === 'win' || raw === 'wobble') return raw
  return null
}

export interface JournalEditFormProps {
  entry: JournalEditEntry
  onCancel: () => void
  onSuccess: () => void
  cardClassName?: string
  /** When true (e.g. edit modal), life category pills wrap on desktop at natural width (same pill styling as default) */
  categoryGridWrapOnDesktop?: boolean
}

export function JournalEditForm({
  entry,
  onCancel,
  onSuccess,
  cardClassName,
  categoryGridWrapOnDesktop = false,
}: JournalEditFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    title: '',
    content: '',
    journal_tag: null as JournalTag | null,
    categories: [] as string[],
  })
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [audioRecordings, setAudioRecordings] = useState<JournalAudioRecording[]>([])
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<UploadState>(initialUpload)

  useEffect(() => {
    setFormData({
      date: entry.date || new Date().toLocaleDateString('en-CA'),
      title: entry.title || '',
      content: entry.content || '',
      journal_tag: parseJournalTag(entry.journal_tag),
      categories: entry.categories || [],
    })
    setExistingFiles(entry.image_urls || [])
    setAudioRecordings(Array.isArray(entry.audio_recordings) ? entry.audio_recordings : [])
    setFiles([])
    setAiGeneratedImageUrls([])
    setImageSource(null)
    setFileToDelete(null)
    setDeleteDialogOpen(false)
    setSubmitError(null)
    setFieldErrors({})
    setUploadProgress(initialUpload)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync form only when editing a different entry
  }, [entry.id])

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleDeleteRecording = (index: number) => {
    setAudioRecordings((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingFile = () => {
    if (fileToDelete !== null) {
      setExistingFiles((prev) => prev.filter((_, i) => i !== fileToDelete))
      setFileToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setFieldErrors({})

    const hasAnything =
      formData.title.trim() ||
      formData.content.trim() ||
      formData.categories.length > 0 ||
      audioRecordings.length > 0 ||
      (existingFiles && existingFiles.length > 0) ||
      files.length > 0 ||
      aiGeneratedImageUrls.length > 0
    if (!hasAnything) {
      setFieldErrors({ content: 'Add something before saving -- even just a title.' })
      return
    }

    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setSubmitError('Please log in to update a journal entry.')
        return
      }

      let imageUrls: string[] = [...existingFiles]

      if (imageSource === 'ai' && aiGeneratedImageUrls.length > 0) {
        imageUrls = [...existingFiles, ...aiGeneratedImageUrls]
      } else if (imageSource === 'upload' && files.length > 0) {
        setUploadProgress({
          progress: 0,
          status: 'Preparing files for upload...',
          fileName: files.length > 1 ? `${files.length} files` : files[0]?.name || '',
          fileSize: files.reduce((total, file) => total + file.size, 0),
          isVisible: true,
        })

        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id, (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            progress: Math.round(progress),
            status: progress < 100 ? 'Uploading files...' : 'Processing files...',
          }))
        })

        const errors = uploadResults.filter(
          (result: { url: string; key: string; error?: string }) => result.error
        )
        if (errors.length > 0) {
          const errorMessages = errors.map((e: { error?: string }) =>
            getUploadErrorMessage(new Error(e.error || 'Unknown error'))
          )
          setSubmitError([...new Set(errorMessages)].join(' '))
          return
        }

        const newImageUrls = uploadResults
          .filter(
            (result: { url: string; key: string; error?: string }) => !result.error && result.url
          )
          .map((result: { url: string; key: string; error?: string }) => result.url)

        imageUrls = [...existingFiles, ...newImageUrls]
      }

      const { error } = await supabase
        .from('journal_entries')
        .update({
          date: formData.date,
          title: formData.title || null,
          content: formData.content || null,
          journal_tag: formData.journal_tag,
          categories: formData.categories,
          image_urls: imageUrls,
          audio_recordings: audioRecordings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id)
        .eq('user_id', entry.user_id)

      if (error) {
        setSubmitError('Failed to update journal entry. Please try again.')
        setUploadProgress((prev) => ({ ...prev, isVisible: false }))
        return
      }

      setUploadProgress((prev) => ({ ...prev, isVisible: false }))
      onSuccess()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to update journal entry. Please try again.'
      )
      setUploadProgress((prev) => ({ ...prev, isVisible: false }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card
        variant="outlined"
        className={cn(
          '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]',
          cardClassName
        )}
      >
        <form onSubmit={handleSave}>
          <Stack gap="lg">
            <div className="flex justify-end">
              <div>
                <div
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="!bg-[#1A1A1A] !border-[#282828] !text-base !font-medium !text-center"
              />
            </section>

            <section className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                Entry type <span className="normal-case tracking-normal text-neutral-600">-- optional</span>
              </p>
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

            <section className="md:space-y-2">
              <p className="hidden md:block text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                Tag life categories
              </p>
              <FullBleed>
                <CategoryGrid
                  categories={VISION_CATEGORIES.filter(
                    (category) => category.key !== 'forward' && category.key !== 'conclusion'
                  )}
                  selectedCategories={formData.categories}
                  onCategoryClick={handleCategoryToggle}
                  pillLabel="Tag life categories"
                  wrapOnDesktop={categoryGridWrapOnDesktop}
                />
              </FullBleed>
            </section>

            <section className="space-y-3">
              <p
                className={`text-[11px] uppercase tracking-[0.2em] text-center ${
                  fieldErrors.content ? 'text-red-400' : 'text-neutral-500'
                }`}
              >
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
                  instanceId={`journalEdit-${entry.id}`}
                  onAudioSaved={(audioUrl, transcript) => {
                    setAudioRecordings((prev) => [
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

              {audioRecordings.length > 0 && (
                <SavedRecordings
                  key={`journal-recordings-${audioRecordings.length}`}
                  recordings={audioRecordings}
                  categoryFilter="journal"
                  onDelete={handleDeleteRecording}
                />
              )}
            </section>

            <section className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                Evidence / images
              </p>
              <div className="rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4 flex flex-col items-stretch gap-3">
                {existingFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-2 text-center sm:text-left">
                      Existing attachments ({existingFiles.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-items-center">
                      {existingFiles.map((url, index) => (
                        <div key={`existing-${index}`} className="relative w-full max-w-[200px]">
                          <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-[#282828]">
                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt={`Attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : url.match(/\.(mp4|mov|webm|avi)$/i) ? (
                              <video src={url} className="w-full h-full object-cover" controls />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                                <div className="text-center text-white text-sm font-medium">File</div>
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

            <div className="flex flex-row gap-2 sm:gap-3 justify-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onCancel}
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
          </Stack>
        </form>
      </Card>

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete File?</h3>
            <p className="text-neutral-300 mb-6">
              Are you sure you want to remove this file from the journal entry? This action cannot be
              undone.
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
              <Button variant="danger" onClick={handleDeleteExistingFile}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
