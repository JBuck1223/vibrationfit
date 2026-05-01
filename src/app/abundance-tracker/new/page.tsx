'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Upload, Sparkles, Save } from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Input,
  Select,
  Stack,
  DatePicker,
  Modal,
  CategoryGrid,
  Toggle,
} from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { ABUNDANCE_ENTRY_CATEGORIES } from '@/lib/abundance/entry-categories'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'

const visionCategoriesForAbundance = VISION_CATEGORIES.filter(
  (cat) => cat.key !== 'forward' && cat.key !== 'conclusion'
).sort((a, b) => a.order - b.order)

function formatAmountWithCommas(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = decPart ? `${withCommas}.${decPart}` : withCommas
  return stripped.endsWith('.') ? `${formatted}.` : formatted
}

function parseAmountInput(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const hasTrailingDot = stripped.endsWith('.')
  if (decPart) return `${intPart}.${decPart}`
  if (hasTrailingDot) return `${intPart}.`
  return intPart
}

export default function AbundanceNewEntryPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [valueType, setValueType] = useState<'money' | 'value'>('money')
  const [amount, setAmount] = useState('')
  const [visionCategories, setVisionCategories] = useState<string[]>([])
  const [entryCategory, setEntryCategory] = useState('')
  const [note, setNote] = useState('')
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const ACCEPT_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif'

  const selectTriggerMatch = '[&_button]:!bg-[#1A1A1A] [&_button]:!border-[#282828]'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setNoteError(null)
    const hasAnything = note.trim() || amount.trim() || audioRecordings.length > 0 || file || aiGeneratedImageUrl
    if (!hasAnything) {
      setNoteError('Add something before saving -- a note, an amount, or a recording.')
      return
    }
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      let imageUrl: string | undefined
      if (imageSource === 'upload' && file) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          setErrorMessage('Please log in to upload an image.')
          setIsSubmitting(false)
          return
        }
        const result = await uploadUserFile('abundance', file, user.id)
        imageUrl = result.url
      } else if (imageSource === 'ai' && aiGeneratedImageUrl) {
        imageUrl = aiGeneratedImageUrl
      }

      const response = await fetch('/api/vibration/abundance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          valueType,
          amount: amount ? Number(amount.replace(/,/g, '')) : undefined,
          visionCategories: visionCategories.length > 0 ? visionCategories : undefined,
          entryCategory: entryCategory || undefined,
          note,
          imageUrl,
          audioRecordings,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to log abundance moment.')
      }

      setSuccessMessage('Abundance moment logged. VIVA captured the appreciation vibe.')
      setNote('')
      setAmount('')
      setValueType('money')
      setVisionCategories([])
      setEntryCategory('')
      setDate(today)
      setImageSource(null)
      setFile(null)
      setAiGeneratedImageUrl(null)
      router.push('/abundance-tracker')
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">Log abundance moment</h1>

        <Card
          variant="outlined"
          className="w-full !p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]"
        >
          <div className="px-3 pt-2 pb-8 md:p-0">
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {/* Date + top fields: single column so Stack gap-lg is not inserted between date and toggles */}
              <div className="flex flex-col gap-4 md:gap-5">
                <div className="flex justify-end">
                  <div
                    className="[&_input]:!w-auto [&_input]:!min-w-[140px] [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!rounded-none [&_input]:!px-0 [&_input]:!py-0 [&_input]:!pr-8 [&_input]:!text-right [&_input]:!text-[11px] [&_input]:!font-medium [&_input]:!uppercase [&_input]:!leading-none [&_input]:!tracking-[0.2em] [&_input]:!text-neutral-500 [&_input]:placeholder:!text-neutral-500 [&_input]:focus:!ring-0 [&_svg]:!right-2 [&_svg]:!h-4 [&_svg]:!w-4 [&_svg]:!text-neutral-400"
                  >
                    <DatePicker
                      value={date}
                      maxDate={today}
                      onChange={(dateString: string) => setDate(dateString)}
                      className="w-auto"
                      popoverAlign="end"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-6 md:hidden">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-[11px] uppercase leading-none tracking-[0.2em] text-neutral-500">
                        Money or Value
                      </p>
                      <button
                        type="button"
                        onClick={() => setHelpOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center rounded-full p-0.5 text-neutral-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Help: Money vs Value"
                      >
                        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <Toggle
                      variant="segmented"
                      size="sm"
                      fullWidth
                      segmentedField
                      value={valueType}
                      onChange={(v) => setValueType(v)}
                      options={[
                        { value: 'money', label: 'Money' },
                        { value: 'value', label: 'Value' },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      Amount
                    </p>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={valueType === 'money' ? '$' : 'Optional amount'}
                      value={formatAmountWithCommas(amount)}
                      onChange={(event) => setAmount(parseAmountInput(event.target.value))}
                      required={valueType === 'money'}
                      prefix="$"
                      className="!bg-[#1A1A1A] !border-[#282828]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      Type{' '}
                      <span className="normal-case tracking-normal text-neutral-600">— optional</span>
                    </p>
                    <div className={cn('w-full min-w-0', selectTriggerMatch)}>
                      <Select
                        value={entryCategory}
                        onChange={(value) => setEntryCategory(value)}
                        options={ABUNDANCE_ENTRY_CATEGORIES.map(({ value, label }) => ({ value, label }))}
                        placeholder="Abundance type (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:block md:space-y-3">
                  <div className="grid grid-cols-3 gap-4 lg:gap-6 items-start">
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-center text-[11px] uppercase leading-none tracking-[0.2em] text-neutral-500">
                        Money or Value
                      </p>
                      <button
                        type="button"
                        onClick={() => setHelpOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center rounded-full p-0.5 text-neutral-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Help: Money vs Value"
                      >
                        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="text-center text-[11px] uppercase leading-none tracking-[0.2em] text-neutral-500">
                      Amount
                    </p>
                    <p className="text-center text-[11px] uppercase leading-none tracking-[0.2em] text-neutral-500">
                      Type{' '}
                      <span className="normal-case tracking-normal text-neutral-600">— optional</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 items-stretch gap-4 lg:gap-6">
                    <Toggle
                      variant="segmented"
                      size="sm"
                      fullWidth
                      segmentedField
                      value={valueType}
                      onChange={(v) => setValueType(v)}
                      options={[
                        { value: 'money', label: 'Money' },
                        { value: 'value', label: 'Value' },
                      ]}
                      className="h-full min-h-0 w-full min-w-0"
                    />
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={valueType === 'money' ? '$' : 'Optional amount'}
                      value={formatAmountWithCommas(amount)}
                      onChange={(event) => setAmount(parseAmountInput(event.target.value))}
                      required={valueType === 'money'}
                      prefix="$"
                      className="!bg-[#1A1A1A] !border-[#282828]"
                    />
                    <div className={cn('min-w-0 w-full', selectTriggerMatch)}>
                      <Select
                        value={entryCategory}
                        onChange={(value) => setEntryCategory(value)}
                        options={ABUNDANCE_ENTRY_CATEGORIES.map(({ value, label }) => ({ value, label }))}
                        placeholder="Abundance type (optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#2A2A2A]" />
                  <p
                    className={cn(
                      'text-[11px] uppercase tracking-[0.22em]',
                      noteError ? 'text-red-400' : 'text-neutral-500'
                    )}
                  >
                    Note
                  </p>
                  <div className="h-px flex-1 bg-[#2A2A2A]" />
                </div>
                {noteError && (
                  <p className="text-center text-sm text-red-400" role="alert">
                    {noteError}
                  </p>
                )}
                <RecordingTextarea
                  value={note}
                  onChange={(value) => {
                    setNote(value)
                    if (noteError) setNoteError(null)
                  }}
                  placeholder="Describe this abundance moment in present-tense appreciation. Type or use the microphone to turn your voice into text."
                  rows={5}
                  storageFolder="profile"
                  instanceId="abundance-note"
                  recordingPurpose="quick"
                  category="abundance"
                  className="!bg-[#1A1A1A] !border-[#282828]"
                  onAudioSaved={(audioUrl, transcript) => {
                    setAudioRecordings((prev) => [
                      ...prev,
                      {
                        url: audioUrl,
                        transcript,
                        type: 'audio' as const,
                        category: 'abundance',
                        created_at: new Date().toISOString(),
                      },
                    ])
                  }}
                />
              </section>

              <CategoryGrid
                title="Vision categories"
                pillLabel="Vision categories"
                categories={visionCategoriesForAbundance}
                selectedCategories={visionCategories}
                onCategoryClick={(key) => {
                  setVisionCategories((prev) =>
                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                  )
                }}
                lifeVisionCategoryStrip
                desktopColumnCount={6}
                bleedClassName="-mx-3 md:mx-0"
              />

              <section className="space-y-3">
                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Image <span className="normal-case tracking-normal text-neutral-600">— optional</span>
                </p>
                <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                    <Button
                      type="button"
                      variant={imageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('upload')
                        setAiGeneratedImageUrl(null)
                        fileInputRef.current?.click()
                      }}
                      className="w-full sm:flex-1 sm:max-w-[220px]"
                    >
                      <Upload className="mr-2 h-5 w-5 shrink-0" />
                      Upload image
                    </Button>
                    <Button
                      type="button"
                      variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                      size="sm"
                      onClick={() => {
                        setImageSource('ai')
                        setFile(null)
                      }}
                      className="w-full sm:flex-1 sm:max-w-[220px]"
                    >
                      <Sparkles className="mr-2 h-5 w-5 shrink-0" />
                      Generate with VIVA
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_IMAGES}
                    className="hidden"
                    aria-hidden
                    onChange={(e) => {
                      const chosen = e.target.files?.[0]
                      if (chosen) {
                        setFile(chosen)
                        setImageSource('upload')
                        setAiGeneratedImageUrl(null)
                      }
                      e.target.value = ''
                    }}
                  />
                  {imageSource === 'upload' && (
                    <FileUpload
                      dragDrop
                      accept={ACCEPT_IMAGES}
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={file ? [file] : []}
                      onChange={(files) => setFile(files[0] || null)}
                      onUpload={(files) => setFile(files[0] || null)}
                      dragDropText="Click to upload or drag and drop"
                      dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                      previewSize="lg"
                    />
                  )}
                  {imageSource === 'ai' && (
                    <>
                      <AIImageGenerator
                        type="vision_board"
                        onImageGenerated={(url) => setAiGeneratedImageUrl(url)}
                        title=""
                        description={note}
                        visionText={note || 'An abundance moment to celebrate.'}
                      />
                      {aiGeneratedImageUrl && (
                        <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:flex-row sm:items-center">
                          <img
                            src={aiGeneratedImageUrl}
                            alt=""
                            className="mx-auto h-20 w-20 rounded-lg object-cover sm:mx-0"
                          />
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-white">Generated with VIVA</p>
                            <p className="text-xs text-neutral-400">Used when you save this entry.</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiGeneratedImageUrl(null)}
                            className="w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {successMessage && (
                <div className="rounded-xl border border-[#199D67]/40 bg-[#199D67]/10 px-4 py-3 text-sm text-[#A8E5CE]">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-[#D03739]/40 bg-[#D03739]/10 px-4 py-3 text-sm text-[#FFB4B4]">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-row items-center justify-center gap-2 pt-2 sm:gap-3">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => router.push('/abundance-tracker')}
                  disabled={isSubmitting}
                  className="max-w-[180px] flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="max-w-[180px] flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Stack>
          </form>
          </div>

          <Modal
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="Money vs Value"
            size="md"
          >
            <div className="space-y-4 text-sm text-neutral-300">
              <p>
                <strong className="text-white">Money</strong> entries require an amount.
              </p>
              <p>
                <strong className="text-white">Value</strong> entries celebrate intangible abundance—share the story in the note and add an amount if you want to track it numerically.
              </p>
            </div>
          </Modal>
        </Card>
      </Stack>
    </Container>
  )
}
