'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Stack, Inline, Text, DatePicker, PageHero } from '@/lib/design-system/components'
import { UploadCloud, Save, HelpCircle, Upload, Sparkles, Eye, X } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { useDailyPaperMutation } from '@/hooks/useDailyPaper'

const TASK_LABELS = [
  'First aligned move',
  'Next aligned move',
  'Clear space move',
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

export default function NewDailyPaperPage() {
  const router = useRouter()
  const supabase = createClient()
  const { saveDailyPaper, isSaving } = useDailyPaperMutation()

  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().split('T')[0]
  })
  const [gratitude, setGratitude] = useState('')
  const [tasks, setTasks] = useState(['', '', ''])
  const [funPlan, setFunPlan] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [attachmentUpload, setAttachmentUpload] =
    useState<UploadState>(initialUploadState)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [aiGeneratedImageUrls, setAiGeneratedImageUrls] = useState<string[]>([])
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
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
      <Stack gap="lg">
        <PageHero
          title="Daily Paper Entry"
          subtitle="Your daily practice for vibrational alignment"
        >
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/daily-paper')}
              className="w-full md:w-auto md:flex-none flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 shrink-0" />
              See All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/daily-paper/resources')}
              className="w-full md:w-auto md:flex-none flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              Resources
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                <Inline className="items-center gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Entry date
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {new Intl.DateTimeFormat(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(`${entryDate}T00:00:00`))}
                    </p>
                  </div>
                  <div className="ml-auto w-full md:w-auto">
                    <DatePicker
                      value={entryDate}
                      onChange={(dateString: string) => setEntryDate(dateString)}
                      className="w-full md:w-auto"
                    />
                  </div>
                </Inline>
              </div>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Gratitude
                </Text>
                <RecordingTextarea
                  label="Today I feel grateful for…"
                  value={gratitude}
                  onChange={setGratitude}
                  placeholder="Type or click the microphone to turn your voice into text."
                  rows={5}
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
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Aligned actions
                </Text>
                <div className="space-y-4">
                  {TASK_LABELS.map((label, index) => (
                    <RecordingTextarea
                      key={label}
                      label={`Task ${index + 1}`}
                      value={tasks[index]}
                      onChange={(value) => handleTaskChange(index, value)}
                      placeholder="Type or click the microphone to turn your voice into text."
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
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Fun promise
                </Text>
                <RecordingTextarea
                  label="Something fun I will do today"
                  value={funPlan}
                  onChange={setFunPlan}
                  placeholder="Type or click the microphone to turn your voice into text."
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
              </section>

              {audioRecordings.length > 0 && (
                <section className="space-y-4">
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                    Recordings
                  </Text>
                  <SavedRecordings
                    recordings={audioRecordings}
                    onDelete={(index) => setAudioRecordings(prev => prev.filter((_, i) => i !== index))}
                  />
                </section>
              )}

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Attachment (optional)
                </Text>
                <div className="rounded-2xl border border-dashed border-[#333] bg-[#131313] p-5 md:p-6">
                  <Stack gap="md" className="items-center text-center text-neutral-300">
                    <div className="flex justify-center">
                      <UploadCloud className="h-6 w-6 text-primary-500" />
                    </div>
                    <span className="text-sm">
                      Add a photo or PDF if you filled the printed Daily Paper.
                    </span>
                    <FileUpload
                      accept="image/*,application/pdf"
                      multiple={false}
                      maxFiles={1}
                      maxSize={50}
                      label={hasAttachment ? 'Replace file' : 'Upload Daily Paper scan'}
                      variant="ghost"
                      onUpload={(files) => {
                        setAttachmentFiles(files.slice(0, 1))
                        resetUploadState()
                      }}
                    />
                    {attachmentPreview && (
                      <div className="overflow-hidden rounded-xl border border-[#333]">
                        <img
                          src={attachmentPreview}
                          alt="Daily Paper preview"
                          className="h-56 w-full object-cover"
                        />
                      </div>
                    )}
                    {!attachmentPreview && hasAttachment && (
                      <div className="rounded-xl border border-[#333] bg-[#1F1F1F] px-4 py-3 text-sm text-neutral-300">
                        Selected: {attachmentFiles[0]?.name}
                      </div>
                    )}
                  </Stack>
                </div>
                <UploadProgress {...attachmentUpload} />
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Evidence / images (optional)
                </Text>
                <div className="rounded-2xl border border-dashed border-[#333] bg-[#131313] p-5 md:p-6 flex flex-col items-stretch justify-center gap-4">
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
                        setImageFiles([])
                      }}
                      className="w-full sm:flex-1 sm:max-w-[200px]"
                    >
                      <Sparkles className="w-5 h-5 mr-2 flex-shrink-0" />
                      Generate with VIVA
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
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Selected VIVA image (will be saved with entry)
                      </p>
                      <div className="relative inline-block max-w-full rounded-xl border-2 border-primary-500/50 bg-[#161616] overflow-hidden">
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

              <div className="flex justify-end">
                <Button type="submit" size="md" loading={isSubmitting || isSaving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </Stack>
          </form>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="sm" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
              Need a refresher?
            </Text>
            <p className="text-sm text-neutral-300">
              Check the Daily Paper resources for printable layouts and a quick process recap.
            </p>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/daily-paper/resources')}
                className="flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Resources
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

