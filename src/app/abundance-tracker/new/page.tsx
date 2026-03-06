'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HelpCircle, Upload, Sparkles, Save, ChevronDown, ChevronRight } from 'lucide-react'
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
} from '@/lib/design-system/components'
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

export default function AbundanceNewEntryPage() {
  const today = new Date().toISOString().split('T')[0]
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
  const [visionCategoriesOpen, setVisionCategoriesOpen] = useState(false)
  const [imageSectionOpen, setImageSectionOpen] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const ACCEPT_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      let imageUrl: string | undefined
      if (imageSource === 'upload' && file) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
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
      <Stack gap="md">
        <PageHero
          title="Log Abundance Moment"
          subtitle="Capture gifts, synchronicities, and abundance flowing to you right now."
        >
          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/abundance-tracker">
                Abundance Dashboard
              </Link>
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-5">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {/* Entry date */}
              <div className="rounded-xl border border-[#1F1F1F] bg-[#161616] p-3 md:p-4">
                <Inline className="items-center gap-3 md:gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                      Entry date
                    </p>
                    <p className="text-base font-semibold text-white">
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

              {/* Track as (Money / Value) - segmented toggle like original */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
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
                <div className="inline-flex rounded-xl border-2 border-[#333] bg-[#161616] p-0.5">
                  <button
                    type="button"
                    onClick={() => setValueType('money')}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                      valueType === 'money'
                        ? 'bg-[#39FF14] text-black'
                        : 'bg-transparent text-[#39FF14] hover:bg-[#39FF14]/10'
                    }`}
                  >
                    Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setValueType('value')}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                      valueType === 'value'
                        ? 'bg-[#39FF14] text-black'
                        : 'bg-transparent text-[#39FF14] hover:bg-[#39FF14]/10'
                    }`}
                  >
                    Value
                  </button>
                </div>
              </section>

              {/* Amount */}
              <section className="space-y-2">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
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
              <section className="space-y-2">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
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
              <section className="space-y-2">
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
                  Note
                </Text>
                <Textarea
                  placeholder="Describe this abundance moment in present-tense appreciation."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  required
                  className="!bg-[#404040] !border-[#333]"
                />
              </section>

              {/* Vision categories - collapsible */}
              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setVisionCategoriesOpen((o) => !o)}
                  className="flex items-center gap-2 w-full text-left focus:outline-none rounded-lg p-1 -m-1"
                  aria-expanded={visionCategoriesOpen}
                >
                  {visionCategoriesOpen ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
                    Vision categories (optional)
                  </Text>
                </button>
                {visionCategoriesOpen && (
                  <div className="grid grid-cols-4 md:grid-cols-12 gap-2 pt-1">
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
                )}
              </section>

              {/* Image (optional) - collapsible */}
              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setImageSectionOpen((o) => !o)}
                  className="flex items-center gap-2 w-full text-left focus:outline-none rounded-lg p-1 -m-1"
                  aria-expanded={imageSectionOpen}
                >
                  {imageSectionOpen ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.25em] underline underline-offset-2 decoration-[#333]">
                    Image (optional)
                  </Text>
                </button>
                {imageSectionOpen && (
                  <div className="rounded-xl border border-dashed border-[#333] bg-[#131313] p-3 md:p-4 flex flex-col gap-3 mt-1">
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
                        <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 mt-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <img
                              src={aiGeneratedImageUrl}
                              alt="VIVA generated"
                              className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                            />
                            <div className="flex-1 text-center sm:text-left">
                              <p className="text-sm font-medium text-white">Generated with VIVA</p>
                              <p className="text-xs text-neutral-400">
                                <span className="text-green-400">Auto-selected for this entry</span>
                              </p>
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
                        </div>
                      )}
                    </>
                  )}
                </div>
                )}
              </section>

              {successMessage && (
                <div className="rounded-lg border border-[#199D67]/40 bg-[#199D67]/10 px-3 py-2 text-sm text-[#A8E5CE]">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-lg border border-[#D03739]/40 bg-[#D03739]/10 px-3 py-2 text-sm text-[#FFB4B4]">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-row gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => router.push('/abundance-tracker')}
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
                <strong className="text-white">Value</strong> entries celebrate intangible abundance—share the story in the note and add an amount if you want to track it numerically.
              </p>
            </div>
          </Modal>
        </Card>
      </Stack>
    </Container>
  )
}
