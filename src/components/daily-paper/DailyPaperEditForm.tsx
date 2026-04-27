'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Button,
  Stack,
  DatePicker,
} from '@/lib/design-system/components'
import { Save, FileText, Upload, Sparkles, X } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { createClient } from '@/lib/supabase/client'
import { useDailyPaperMutation } from '@/hooks/useDailyPaper'
import type { DailyPaperEntry } from '@/hooks/useDailyPaper'
import { cn } from '@/lib/utils'

const TASK_LABELS = [
  'Task 1',
  'Task 2',
  'Task 3',
]

type UploadState = {
  progress: number
  status: string
  fileName: string
  fileSize: number
  isVisible: boolean
}

const initialUploadState: UploadState = {
  progress: 0,
  status: '',
  fileName: '',
  fileSize: 0,
  isVisible: false,
}

/** Matches SavedRecordings row shape from DB JSON */
type PaperAudioRecording = {
  url: string
  transcript: string
  type: 'audio' | 'video'
  category: string
  created_at: string
  duration?: number
}

function getAudioFromEntry(entry: DailyPaperEntry): PaperAudioRecording[] {
  const raw = (entry as { audio_recordings?: PaperAudioRecording[] }).audio_recordings
  return Array.isArray(raw) ? raw : []
}

export interface DailyPaperEditFormProps {
  entry: DailyPaperEntry
  onCancel: () => void
  onSuccess: () => void
  cardClassName?: string
}

export function DailyPaperEditForm({
  entry,
  onCancel,
  onSuccess,
  cardClassName,
}: DailyPaperEditFormProps) {
  const supabase = createClient()
  const { saveDailyPaper, isSaving } = useDailyPaperMutation()

  const [entryDate, setEntryDate] = useState(() => entry.entry_date || new Date().toISOString().split('T')[0])
  const [gratitude, setGratitude] = useState(() => entry.gratitude || '')
  const [tasks, setTasks] = useState(() => [
    entry.task_one || '',
    entry.task_two || '',
    entry.task_three || '',
  ])
  const [funPlan, setFunPlan] = useState(() => entry.fun_plan || '')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [attachmentRemoved, setAttachmentRemoved] = useState(false)
  const [attachmentUpload, setAttachmentUpload] =
    useState<UploadState>(initialUploadState)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [audioRecordings, setAudioRecordings] = useState<PaperAudioRecording[]>(() => getAudioFromEntry(entry))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    setEntryDate(entry.entry_date || new Date().toISOString().split('T')[0])
    setGratitude(entry.gratitude || '')
    setTasks([
      entry.task_one || '',
      entry.task_two || '',
      entry.task_three || '',
    ])
    setFunPlan(entry.fun_plan || '')
    setAudioRecordings(getAudioFromEntry(entry))
    setAttachmentRemoved(false)
    setAttachmentFiles([])
    setImageSource(null)
    setImageFiles([])
    setAiGeneratedImageUrls([])
    setAttachmentUpload(initialUploadState)
    setSubmitError(null)
    setSubmitSuccess(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync form only when editing a different entry
  }, [entry.id])

  const attachmentPreview = useMemo(() => {
    const file = attachmentFiles[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return null
    }
    return null
  }, [attachmentFiles])

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview)
      }
    }
  }, [attachmentPreview])

  const resetUploadState = () => {
    setAttachmentUpload(initialUploadState)
  }

  const handleTaskChange = (index: number, value: string) => {
    setTasks((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const hasNewAttachment = attachmentFiles.length > 0 || imageFiles.length > 0
  const hasExistingAttachment =
    entry?.attachment_url && !attachmentRemoved && !hasNewAttachment

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setSubmitError(null)
    setSubmitSuccess(false)
    setIsSubmitting(true)

    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user

      if (!user) {
        throw new Error('Please sign in to save your Daily Paper.')
      }

      let attachmentPayload:
        | { url: string; key: string; contentType?: string; size?: number }
        | undefined
      let attachmentSection: 'evidence' | 'optional' | undefined =
        entry.metadata && typeof (entry.metadata as { attachmentSection?: string }).attachmentSection === 'string'
          ? (entry.metadata as { attachmentSection: 'evidence' | 'optional' }).attachmentSection
          : undefined

      if (hasNewAttachment) {
        const file = attachmentFiles[0]
        attachmentSection = 'optional'
        setAttachmentUpload({
          progress: 5,
          status: 'Preparing upload…',
          fileName: file.name,
          fileSize: file.size,
          isVisible: true,
        })

        const { uploadUserFile } = await import(
          '@/lib/storage/s3-storage-presigned'
        )
        const uploadResult = await uploadUserFile(
          'journal',
          file,
          user.id,
          (progress) => {
            setAttachmentUpload((prev) => ({
              ...prev,
              progress,
              status:
                progress < 100
                  ? 'Uploading…'
                  : 'Finishing upload…',
              isVisible: true,
            }))
          }
        )

        attachmentPayload = {
          url: uploadResult.url,
          key: uploadResult.key,
          contentType: file.type,
          size: file.size,
        }
      } else if (hasExistingAttachment && entry.attachment_url && entry.attachment_key) {
        // Preserve existing attachmentSection
        attachmentPayload = {
          url: entry.attachment_url,
          key: entry.attachment_key,
          contentType: entry.attachment_content_type ?? undefined,
          size:
            entry.attachment_size != null ? Number(entry.attachment_size) : undefined,
        }
      } else if (aiGeneratedImageUrls.length > 0) {
        attachmentSection = 'evidence'
        const imageUrl = aiGeneratedImageUrls[0]
        const isOurCdn =
          imageUrl.startsWith('https://media.vibrationfit.com/') ||
          imageUrl.includes('media.vibrationfit.com')
        if (isOurCdn) {
          const key = new URL(imageUrl).pathname.slice(1)
          attachmentPayload = {
            url: imageUrl,
            key,
            contentType: 'image/png',
            size: 0,
          }
        } else {
          setAttachmentUpload({
            progress: 5,
            status: 'Uploading VIVA image…',
            fileName: 'viva-generated.png',
            fileSize: 0,
            isVisible: true,
          })
          const proxyRes = await fetch(
            `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`
          )
          if (!proxyRes.ok) throw new Error('Failed to fetch generated image')
          const blob = await proxyRes.blob()
          const vivaFile = new File([blob], 'viva-generated.png', {
            type: blob.type || 'image/png',
          })
          const { uploadUserFile } = await import(
            '@/lib/storage/s3-storage-presigned'
          )
          const uploadResult = await uploadUserFile(
            'journal',
            vivaFile,
            user.id,
            (progress) => {
              setAttachmentUpload((prev) => ({
                ...prev,
                progress,
                status:
                  progress < 100 ? 'Uploading…' : 'Finishing upload…',
                isVisible: true,
              }))
            }
          )
          attachmentPayload = {
            url: uploadResult.url,
            key: uploadResult.key,
            contentType: vivaFile.type,
            size: vivaFile.size,
          }
        }
      } else if (imageFiles.length > 0) {
        attachmentSection = 'evidence'
        const file = imageFiles[0]
        setAttachmentUpload({
          progress: 5,
          status: 'Preparing upload…',
          fileName: file.name,
          fileSize: file.size,
          isVisible: true,
        })
        const { uploadUserFile } = await import(
          '@/lib/storage/s3-storage-presigned'
        )
        const uploadResult = await uploadUserFile(
          'journal',
          file,
          user.id,
          (progress) => {
            setAttachmentUpload((prev) => ({
              ...prev,
              progress,
              status:
                progress < 100 ? 'Uploading…' : 'Finishing upload…',
              isVisible: true,
            }))
          }
        )
        attachmentPayload = {
          url: uploadResult.url,
          key: uploadResult.key,
          contentType: file.type,
          size: file.size,
        }
      }

      await saveDailyPaper({
        entryDate,
        gratitude,
        tasks,
        funPlan,
        attachment: attachmentPayload,
        audioRecordings: audioRecordings.length > 0 ? audioRecordings : undefined,
        metadata: {
          ...(typeof entry.metadata === 'object' && entry.metadata !== null ? entry.metadata : {}),
          source: 'daily-paper:edit',
          ...(attachmentSection && { attachmentSection }),
        },
      })

      setSubmitSuccess(true)
      resetUploadState()

      setTimeout(() => {
        onSuccess()
      }, 800)
    } catch (error) {
      console.error('Daily Paper update failed:', error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to save your Daily Paper right now.'
      )
      setAttachmentUpload((prev) => ({ ...prev, isVisible: false }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      variant="outlined"
      className={cn(
        '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]',
        cardClassName
      )}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <div className="flex justify-end">
            <div>
              <div className="[&_input]:!w-auto [&_input]:!min-w-[170px] [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!rounded-none [&_input]:!px-0 [&_input]:!py-0 [&_input]:!pr-10 [&_input]:!text-right [&_input]:!text-[11px] [&_input]:!font-medium [&_input]:!uppercase [&_input]:!tracking-[0.2em] [&_input]:!text-neutral-500 [&_input]:placeholder:!text-neutral-500 [&_input]:focus:!ring-0 [&_svg]:!text-neutral-400">
                <DatePicker
                  value={entryDate}
                  onChange={(dateString: string) => setEntryDate(dateString)}
                  className="w-auto"
                  required
                />
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2A2A2A]" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Gratitude</p>
              <div className="h-px flex-1 bg-[#2A2A2A]" />
            </div>
            <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
              <RecordingTextarea
                label=""
                value={gratitude}
                onChange={setGratitude}
                rows={5}
                placeholder="Today I feel grateful for… Type or tap the mic to record."
                storageFolder="journal"
                recordingPurpose="quick"
                category="daily-paper"
                instanceId="dailyPaperEditGratitude"
                onAudioSaved={(audioUrl, transcript) => {
                  setAudioRecordings(prev => [...prev, {
                    url: audioUrl, transcript, type: 'audio' as const,
                    category: 'daily-paper-gratitude', created_at: new Date().toISOString(),
                  }])
                }}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2A2A2A]" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Aligned actions</p>
              <div className="h-px flex-1 bg-[#2A2A2A]" />
            </div>
            <div className="space-y-4">
              {TASK_LABELS.map((label, index) => (
                <div key={label} className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-left">
                    {label}
                  </p>
                  <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                    <RecordingTextarea
                      label=""
                      value={tasks[index]}
                      onChange={(value) => handleTaskChange(index, value)}
                      placeholder="Type or tap the mic to record."
                      rows={3}
                      storageFolder="journal"
                      recordingPurpose="quick"
                      category="daily-paper"
                      instanceId={`dailyPaperEditTask${index + 1}`}
                      onAudioSaved={(audioUrl, transcript) => {
                        setAudioRecordings(prev => [...prev, {
                          url: audioUrl, transcript, type: 'audio' as const,
                          category: `daily-paper-task-${index + 1}`, created_at: new Date().toISOString(),
                        }])
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2A2A2A]" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Fun promise</p>
              <div className="h-px flex-1 bg-[#2A2A2A]" />
            </div>
            <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
              <RecordingTextarea
                label=""
                value={funPlan}
                onChange={setFunPlan}
                placeholder="Something fun I will do today. Type or tap the mic to record."
                rows={3}
                storageFolder="journal"
                recordingPurpose="quick"
                category="daily-paper"
                instanceId="dailyPaperEditFun"
                onAudioSaved={(audioUrl, transcript) => {
                  setAudioRecordings(prev => [...prev, {
                    url: audioUrl, transcript, type: 'audio' as const,
                    category: 'daily-paper-fun', created_at: new Date().toISOString(),
                  }])
                }}
              />
            </div>
          </section>

          {audioRecordings.length > 0 && (
            <SavedRecordings
              recordings={audioRecordings}
              onDelete={(index) => setAudioRecordings(prev => prev.filter((_, i) => i !== index))}
            />
          )}

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
              Printed Daily Paper scan <span className="normal-case tracking-normal text-neutral-600">-- optional</span>
            </p>
            <div className="rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4 flex flex-col items-center gap-3">
              <p className="text-sm text-neutral-400 text-center">
                Add a photo or PDF if you used the printable form.
              </p>
              {hasExistingAttachment && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-center">
                  <a
                    href={entry.attachment_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-2 text-sm text-primary-500"
                  >
                    <FileText className="w-4 h-4" />
                    Current file
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAttachmentRemoved(true)
                      setAttachmentFiles([])
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {(attachmentRemoved || !entry.attachment_url) && (
                <FileUpload
                  accept="image/*,application/pdf"
                  multiple={false}
                  maxFiles={1}
                  maxSize={50}
                  label={hasNewAttachment ? 'Replace file' : 'Upload scan'}
                  variant="ghost"
                  className="flex flex-col items-center"
                  onUpload={(files) => {
                    setAttachmentFiles(files.slice(0, 1))
                    setAttachmentRemoved(false)
                    resetUploadState()
                  }}
                />
              )}
              {attachmentPreview && (
                <div className="overflow-hidden rounded-xl border border-[#282828]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL */}
                  <img
                    src={attachmentPreview}
                    alt="Daily Paper preview"
                    className="h-56 w-full object-cover"
                  />
                </div>
              )}
              {!attachmentPreview && hasNewAttachment && (
                <div className="rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3 text-sm text-neutral-300 text-center">
                  Selected: {attachmentFiles[0]?.name}
                </div>
              )}
            </div>
            <UploadProgress {...attachmentUpload} />
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
              Evidence / images <span className="normal-case tracking-normal text-neutral-600">-- optional</span>
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
                    setImageFiles([])
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
                  value={imageFiles}
                  onChange={setImageFiles}
                  onUpload={setImageFiles}
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
                    [gratitude, ...tasks, funPlan].filter(Boolean).join(' ') || ''
                  }
                />
              )}
              {aiGeneratedImageUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 text-center">
                    Selected VIVA image (saved with entry)
                  </p>
                  <div className="relative inline-block max-w-full rounded-xl border-2 border-primary-500/50 bg-[#161616] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aiGeneratedImageUrls[0]}
                      alt="VIVA generated"
                      className="max-h-80 w-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white"
                      onClick={() => setAiGeneratedImageUrls([])}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {submitError && (
            <div className="rounded-xl border border-[#D03739]/40 bg-[#D03739]/10 px-4 py-3 text-sm text-[#FFB4B4]">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="rounded-xl border border-[#199D67]/40 bg-[#199D67]/10 px-4 py-3 text-sm text-[#A8E5CE]">
              Daily Paper updated. Returning to entry…
            </div>
          )}

          <div className="flex flex-row gap-2 sm:gap-3 items-center justify-center">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting || isSaving}
              className="flex-1 max-w-[180px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting || isSaving}
              disabled={isSubmitting || isSaving}
              className="flex-1 max-w-[180px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {(isSubmitting || isSaving) ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  )
}
