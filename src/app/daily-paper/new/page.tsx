'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Stack, DatePicker } from '@/lib/design-system'
import { Save, Upload, Sparkles, X, HelpCircle } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { useDailyPaperMutation } from '@/hooks/useDailyPaper'

const TASK_LABELS = ['Task 1', 'Task 2', 'Task 3']

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

type DailyPaperRecording = {
  url: string
  transcript: string
  type: 'audio'
  category: string
  created_at: string
}

export default function NewDailyPaperPage() {
  const router = useRouter()
  const supabase = createClient()
  const { saveDailyPaper, isSaving } = useDailyPaperMutation()

  const [entryDate, setEntryDate] = useState('')

  useEffect(() => {
    setEntryDate(new Date().toLocaleDateString('en-CA'))
  }, [])
  const [gratitude, setGratitude] = useState('')
  const [tasks, setTasks] = useState(['', '', ''])
  const [funPlan, setFunPlan] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [attachmentUpload, setAttachmentUpload] =
    useState<UploadState>(initialUploadState)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [audioRecordings, setAudioRecordings] = useState<DailyPaperRecording[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const attachmentPreview = useMemo(() => {
    const file = attachmentFiles[0]
    if (!file) return null
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
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

  const hasAttachment = attachmentFiles.length > 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setSubmitError(null)
    setSubmitSuccess(false)
    setIsSubmitting(true)

    try {
      if (!entryDate.trim()) {
        setSubmitError('Please choose an entry date.')
        return
      }

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user

      if (!user) {
        throw new Error('Please sign in to save your Daily Paper.')
      }

      let attachmentMetadata: {
        url: string
        key: string
        contentType?: string
        size?: number
        originalName?: string
      } | null = null
      let attachmentSection: 'evidence' | 'optional' | null = null

      if (hasAttachment) {
        attachmentSection = 'optional'
        const file = attachmentFiles[0]

        setAttachmentUpload({
          progress: 5,
          status: 'Preparing upload…',
          fileName: file.name,
          fileSize: file.size,
          isVisible: true,
        })

        const uploadResult = await uploadUserFile('journal', file, user.id, (progress) => {
          setAttachmentUpload((prev) => ({
            ...prev,
            progress,
            status: progress < 100 ? 'Uploading handwritten Daily Paper…' : 'Finishing upload…',
            isVisible: true,
          }))
        })

        attachmentMetadata = {
          url: uploadResult.url,
          key: uploadResult.key,
          contentType: file.type,
          size: file.size,
          originalName: file.name,
        }
      } else if (aiGeneratedImageUrls.length > 0) {
        attachmentSection = 'evidence'
        const imageUrl = aiGeneratedImageUrls[0]
        const isOurCdn =
          imageUrl.startsWith('https://media.vibrationfit.com/') ||
          imageUrl.includes('media.vibrationfit.com')
        if (isOurCdn) {
          const key = new URL(imageUrl).pathname.slice(1)
          attachmentMetadata = {
            url: imageUrl,
            key,
            contentType: 'image/png',
            size: 0,
            originalName: 'viva-generated.png',
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
          attachmentMetadata = {
            url: uploadResult.url,
            key: uploadResult.key,
            contentType: vivaFile.type,
            size: vivaFile.size,
            originalName: vivaFile.name,
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
        attachmentMetadata = {
          url: uploadResult.url,
          key: uploadResult.key,
          contentType: file.type,
          size: file.size,
          originalName: file.name,
        }
      }

      await saveDailyPaper({
        entryDate,
        gratitude,
        tasks,
        funPlan,
        attachment: attachmentMetadata
          ? {
              url: attachmentMetadata.url,
              key: attachmentMetadata.key,
              contentType: attachmentMetadata.contentType,
              size: attachmentMetadata.size,
            }
          : undefined,
        audioRecordings: audioRecordings.length > 0 ? audioRecordings : undefined,
        metadata: {
          source: 'daily-paper:new',
          attachmentOriginalName: attachmentMetadata?.originalName ?? null,
          ...(attachmentSection && { attachmentSection }),
        },
      })

      setSubmitSuccess(true)
      resetUploadState()

      setTimeout(() => {
        router.push('/daily-paper')
      }, 900)
    } catch (error) {
      console.error('Daily Paper submission failed:', error)
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to save your Daily Paper right now.',
      )
      setAttachmentUpload((prev) => ({ ...prev, isVisible: false }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Card variant="outlined" className="!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]">
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
                    instanceId="dailyPaperGratitude"
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
                          instanceId={`dailyPaperTask${index + 1}`}
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
                    instanceId="dailyPaperFun"
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
                  <FileUpload
                    accept="image/*,application/pdf"
                    multiple={false}
                    maxFiles={1}
                    maxSize={50}
                    label={hasAttachment ? 'Replace file' : 'Upload scan'}
                    variant="ghost"
                    className="flex flex-col items-center"
                    onUpload={(files) => {
                      setAttachmentFiles(files.slice(0, 1))
                      resetUploadState()
                    }}
                  />
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
                  {!attachmentPreview && hasAttachment && (
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
                  Daily Paper saved. Returning to your archive…
                </div>
              )}

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
                  loading={isSubmitting || isSaving}
                  disabled={isSubmitting || isSaving}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting || isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Stack>
          </Card>

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="sm" className="text-center">
              <p className="text-sm text-neutral-400 uppercase tracking-[0.3em]">
                Need a refresher?
              </p>
              <p className="text-sm text-neutral-300 text-balance">
                Check the Daily Paper resources for printable layouts and a quick process recap.
              </p>
              <div className="flex justify-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/daily-paper/resources')}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  Resources
                </Button>
              </div>
            </Stack>
          </Card>
        </Stack>
      </form>
    </Container>
  )
}

