'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Upload, Sparkles, Save } from 'lucide-react'
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Stack,
  DatePicker,
  Modal,
  CategoryGrid,
  Spinner,
  ImageLightbox,
  Toggle,
} from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { ABUNDANCE_ENTRY_CATEGORIES } from '@/lib/abundance/entry-categories'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
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

export interface AbundanceEditFormProps {
  eventId: string
  onCancel: () => void
  onSuccess: () => void
  /** Applied to outer Card for modal embedding */
  cardClassName?: string
  /** Negative margin on category pill strip to match modal padding (see Journal edit modal). */
  categoryGridBleedClass?: string
}

export function AbundanceEditForm({
  eventId,
  onCancel,
  onSuccess,
  cardClassName,
  categoryGridBleedClass,
}: AbundanceEditFormProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(today)
  const [valueType, setValueType] = useState<'money' | 'value'>('money')
  const [amount, setAmount] = useState('')
  const [visionCategories, setVisionCategories] = useState<string[]>([])
  const [entryCategory, setEntryCategory] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | 'keep' | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const ACCEPT_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif'

  const pendingImagePreviewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl)
    }
  }, [pendingImagePreviewUrl])

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('abundance_events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      if (error || !data) {
        onCancel()
        return
      }

      setDate(data.date || today)
      setValueType((data.value_type as 'money' | 'value') || 'money')
      setAmount(
        data.amount != null && Number(data.amount) > 0
          ? String(Number(data.amount))
          : ''
      )
      setVisionCategories(
        data.vision_category
          ? data.vision_category.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []
      )
      setEntryCategory(data.entry_category || '')
      setNote(data.note || '')
      setExistingImageUrl(data.image_url || null)
      setImageSource(data.image_url ? 'keep' : null)
      setLoading(false)
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [eventId, onCancel, router, today])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setErrorMessage('Please log in to update.')
        setIsSubmitting(false)
        return
      }

      let imageUrl: string | null | undefined = existingImageUrl ?? null
      if (imageSource === 'upload' && file) {
        const result = await uploadUserFile('abundance', file, user.id)
        imageUrl = result.url
      } else if (imageSource === 'ai' && aiGeneratedImageUrl) {
        imageUrl = aiGeneratedImageUrl
      } else if (imageSource === null || (imageSource === 'keep' && !existingImageUrl)) {
        imageUrl = null
      }

      const visionCategoryValue =
        visionCategories.length > 0 ? visionCategories.join(',') : null
      const numericAmount = amount?.trim()
        ? Number(amount.replace(/,/g, ''))
        : null
      const safeAmount =
        numericAmount != null && !Number.isNaN(numericAmount) ? numericAmount : null

      const updatePayload: Record<string, unknown> = {
        date,
        value_type: valueType,
        /** Money requires an amount (enforced by input); Value may omit or include an optional tracked amount — same as new entry POST. */
        amount: safeAmount,
        vision_category: visionCategoryValue,
        entry_category: entryCategory || null,
        note,
      }
      if (imageUrl !== undefined) {
        updatePayload.image_url = imageUrl
      }

      const { error } = await supabase
        .from('abundance_events')
        .update(updatePayload)
        .eq('id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const selectTriggerMatch = '[&_button]:!bg-[#1A1A1A] [&_button]:!border-[#282828]'

  return (
    <>
    <Card
      variant="outlined"
      className={cn(
        '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]',
        cardClassName
      )}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Date + top fields share tighter spacing than rest of form (avoid gap-lg under date only). */}
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="-mt-1 flex justify-end pt-0 md:-mt-0.5">
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

          {/* Mobile: label + control per section */}
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
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">Amount</p>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={valueType === 'money' ? '$' : 'Optional amount'}
                value={formatAmountWithCommas(amount)}
                onChange={(ev) => setAmount(parseAmountInput(ev.target.value))}
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

          {/* Desktop: one label row (top-aligned), one control row */}
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
                onChange={(ev) => setAmount(parseAmountInput(ev.target.value))}
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
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Note</p>
              <div className="h-px flex-1 bg-[#2A2A2A]" />
            </div>
            <Textarea
              placeholder="Describe this abundance moment in present-tense appreciation."
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              rows={6}
              required
              className="!bg-[#1A1A1A] !border-[#282828]"
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
            bleedClassName={categoryGridBleedClass}
          />

          <section className="space-y-3">
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Image <span className="normal-case tracking-normal text-neutral-600">— optional</span>
            </p>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4">
              {existingImageUrl && (imageSource === 'keep' || imageSource === null) && (
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    type="button"
                    className="shrink-0 overflow-hidden rounded-lg ring-offset-[#161616] transition hover:ring-2 hover:ring-primary-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => setLightboxUrl(existingImageUrl)}
                    aria-label="View image full size"
                  >
                    <img
                      src={existingImageUrl}
                      alt=""
                      className="h-20 w-20 object-cover"
                    />
                  </button>
                  <div className="flex-1 text-sm text-neutral-400">
                    Current image. Upload or generate a new one to replace.
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExistingImageUrl(null)
                      setImageSource(null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="flex flex-row flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant={imageSource === 'upload' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImageSource('upload')
                    setAiGeneratedImageUrl(null)
                    fileInputRef.current?.click()
                  }}
                  className="max-w-[180px] flex-1"
                >
                  <Upload className="mr-1.5 h-4 w-4 shrink-0" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                  size="sm"
                  onClick={() => {
                    setImageSource('ai')
                    setFile(null)
                  }}
                  className="max-w-[180px] flex-1"
                >
                  <Sparkles className="mr-1.5 h-4 w-4 shrink-0" />
                  VIVA Generate
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
                <>
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
                  {pendingImagePreviewUrl && (
                    <button
                      type="button"
                      className="mx-auto block text-xs font-medium text-primary-500 transition hover:text-primary-400 hover:underline"
                      onClick={() => setLightboxUrl(pendingImagePreviewUrl)}
                    >
                      View full image
                    </button>
                  )}
                </>
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
                    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        type="button"
                        className="mx-auto shrink-0 overflow-hidden rounded-lg ring-offset-[#161616] transition hover:ring-2 hover:ring-primary-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:mx-0"
                        onClick={() => setLightboxUrl(aiGeneratedImageUrl)}
                        aria-label="View generated image full size"
                      >
                        <img
                          src={aiGeneratedImageUrl}
                          alt=""
                          className="mx-auto h-20 w-20 object-cover sm:mx-0"
                        />
                      </button>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-white">Generated with VIVA</p>
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
              onClick={onCancel}
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
            <strong className="text-white">Value</strong> entries celebrate intangible abundance.
          </p>
        </div>
      </Modal>
    </Card>

    <ImageLightbox
      images={lightboxUrl ? [{ url: lightboxUrl, alt: 'Abundance image' }] : []}
      currentIndex={0}
      isOpen={lightboxUrl !== null}
      onClose={() => setLightboxUrl(null)}
      showCopyButton={false}
      showNavigation={false}
      showThumbnails={false}
      showCounter={false}
      className="!z-[260]"
    />
    </>
  )
}
