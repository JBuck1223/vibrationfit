'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Upload, Sparkles, Save } from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Stack,
  Text,
  Inline,
  DatePicker,
  PageHero,
  Modal,
  CategoryCard,
  Spinner,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { ABUNDANCE_ENTRY_CATEGORIES } from '@/lib/abundance/entry-categories'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'

const VALUE_TYPES = [
  { value: 'money', label: 'Money' },
  { value: 'value', label: 'Value (intangible)' },
]

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

export default function AbundanceEditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [loading, setLoading] = useState(true)
  const [eventId, setEventId] = useState<string | null>(null)
  const [date, setDate] = useState(today)
  const [valueType, setValueType] = useState<'money' | 'value'>('money')
  const [amount, setAmount] = useState('')
  const [visionCategories, setVisionCategories] = useState<string[]>([])
  const [entryCategory, setEntryCategory] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | 'keep' | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPT_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif'

  useEffect(() => {
    async function fetchData() {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('abundance_events')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        router.push('/abundance-tracker')
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

    fetchData()
  }, [params, router, today])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!eventId) return
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
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
      const numericAmount = amount
        ? Number(amount.replace(/,/g, ''))
        : null

      const updatePayload: Record<string, unknown> = {
        date,
        value_type: valueType,
        amount: valueType === 'money' && numericAmount != null ? numericAmount : null,
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

      setSuccessMessage('Abundance moment updated.')
      router.push(`/abundance-tracker/${eventId}`)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Edit Abundance Entry" />

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              {/* Entry date - journal/new style */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                <Inline className="items-center gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Entry date
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {date
                        ? new Intl.DateTimeFormat(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(`${date}T00:00:00`))
                        : '—'}
                    </p>
                  </div>
                  <div className="ml-auto w-full md:w-auto">
                    <DatePicker
                      value={date}
                      maxDate={today}
                      onChange={(dateString: string) => setDate(dateString)}
                      className="w-full md:w-auto"
                    />
                  </div>
                </Inline>
              </div>

              {/* Track as */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                    Track as
                  </Text>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="p-0.5 rounded-full text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Help: Money vs Value"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <Select
                  value={valueType}
                  onChange={(value) => setValueType(value as 'money' | 'value')}
                  options={VALUE_TYPES}
                />
              </section>

              {/* Amount */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Amount
                </Text>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={valueType === 'money' ? '$' : 'Optional amount'}
                  value={formatAmountWithCommas(amount)}
                  onChange={(event) => setAmount(parseAmountInput(event.target.value))}
                  required={valueType === 'money'}
                  prefix="$"
                  className="!bg-[#404040] !border-[#333]"
                />
              </section>

              {/* Kind of abundance */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Kind of abundance
                </Text>
                <Select
                  value={entryCategory}
                  onChange={(value) => setEntryCategory(value)}
                  options={ABUNDANCE_ENTRY_CATEGORIES.map(({ value, label }) => ({ value, label }))}
                  placeholder="Abundance type (optional)"
                />
              </section>

              {/* Note */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Note
                </Text>
                <Textarea
                  placeholder="Describe this abundance moment in present-tense appreciation."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  required
                  className="!bg-[#404040] !border-[#333]"
                />
              </section>

              {/* Vision categories */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Vision categories (optional)
                </Text>
                <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                  {visionCategoriesForAbundance.map((category) => {
                    const isSelected = visionCategories.includes(category.key)
                    return (
                      <CategoryCard
                        key={category.key}
                        category={category}
                        selected={isSelected}
                        onClick={() => {
                          setVisionCategories((prev) =>
                            isSelected ? prev.filter((k) => k !== category.key) : [...prev, category.key]
                          )
                        }}
                        variant="outlined"
                        selectionStyle="border"
                        iconColor={isSelected ? '#39FF14' : '#FFFFFF'}
                        selectedIconColor="#39FF14"
                        className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                      />
                    )
                  })}
                </div>
              </section>

              {/* Image (optional) - journal/new dashed block */}
              <section className="space-y-4">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                  Image (optional)
                </Text>
                <div className="rounded-2xl border border-dashed border-[#333] bg-[#131313] p-5 md:p-6 flex flex-col gap-4">
                  {existingImageUrl && (imageSource === 'keep' || imageSource === null) && (
                    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <img
                        src={existingImageUrl}
                        alt="Current"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
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
                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                    <Button
                      type="button"
                      variant={imageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('upload')
                        setAiGeneratedImageUrl(null)
                        fileInputRef.current?.click()
                      }}
                      className="w-full sm:flex-1 sm:max-w-[200px]"
                    >
                      <Upload className="w-5 h-5 mr-2 flex-shrink-0" />
                      Upload Image
                    </Button>
                    <Button
                      type="button"
                      variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                      size="sm"
                      onClick={() => {
                        setImageSource('ai')
                        setFile(null)
                      }}
                      className="w-full sm:flex-1 sm:max-w-[200px]"
                    >
                      <Sparkles className="w-5 h-5 mr-2 flex-shrink-0" />
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
                        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <img
                            src={aiGeneratedImageUrl}
                            alt="VIVA generated"
                            className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                          />
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

              <div className="flex flex-row gap-2 sm:gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => router.push(`/abundance-tracker/${eventId}`)}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
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
      </Stack>
    </Container>
  )
}
