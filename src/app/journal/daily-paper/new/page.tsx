'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Stack, Inline, Text } from '@/lib/design-system/components'
import { UploadCloud } from 'lucide-react'
import { RecordingInput } from '@/components/RecordingInput'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
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

      if (hasAttachment) {
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
        metadata: {
          source: 'daily-paper:new',
          attachmentOriginalName: attachmentMetadata?.originalName ?? null,
        },
      })

      setSubmitSuccess(true)
      resetUploadState()

      setTimeout(() => {
        router.push('/journal/daily-paper')
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
      <Stack gap="xl">
        <section className="space-y-3 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
            Daily Paper Entry
          </h1>
        </section>

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
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                    className="ml-auto rounded-xl border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#199D67] focus:outline-none focus:ring-2 focus:ring-[#199D67]"
                  />
                </Inline>
              </div>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Gratitude
                </Text>
                <RecordingInput
                  label="Today I feel grateful for…"
                  value={gratitude}
                  onChange={setGratitude}
                  placeholder="Type or transcribe audio."
                  recordingCategory="dailyPaperGratitude"
                  multiline
                  rows={5}
                />
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Aligned actions
                </Text>
                <div className="space-y-4">
                  {TASK_LABELS.map((label, index) => (
                    <RecordingInput
                      key={label}
                      label={`Task ${index + 1}`}
                      placeholder="Type or transcribe audio."
                      value={tasks[index]}
                      onChange={(value) => handleTaskChange(index, value)}
                      recordingCategory={`dailyPaperTask${index + 1}`}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Fun promise
                </Text>
                <RecordingInput
                  label="Something fun I will do today"
                  placeholder="Type or transcribe audio."
                  value={funPlan}
                  onChange={setFunPlan}
                  recordingCategory="dailyPaperFun"
                />
              </section>

              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Optional upload
                </Text>
                <div className="rounded-2xl border border-dashed border-[#333] bg-[#131313] p-5 md:p-6">
                  <Stack gap="md" className="items-center text-center text-neutral-300">
                    <div className="flex justify-center">
                      <UploadCloud className="h-6 w-6 text-[#14B8A6]" />
                    </div>
                    <span className="text-sm">
                      Add a photo or PDF if you filled the printed Daily Paper.
                    </span>
                    <FileUpload
                      accept="image/*,application/pdf"
                      multiple={false}
                      maxFiles={1}
                      maxSize={50}
                      label={hasAttachment ? 'Replace attachment' : 'Upload attachment'}
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
                        File attached: {attachmentFiles[0]?.name}
                      </div>
                    )}
                  </Stack>
                </div>
                <UploadProgress {...attachmentUpload} />
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

              <div className="flex justify-center">
                <Button type="submit" size="md" loading={isSubmitting || isSaving}>
                  Save Daily Paper
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
                variant="secondary"
                size="sm"
                onClick={() => router.push('/journal/daily-paper/resources')}
              >
                Open resources
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

