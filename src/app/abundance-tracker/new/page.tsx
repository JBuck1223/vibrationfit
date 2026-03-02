'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { HelpCircle, Upload, Sparkles, ArrowLeft } from 'lucide-react'
import {
  Container,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Stack,
  DatePicker,
  PageHero,
  Modal,
  CategoryCard,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { colors } from '@/lib/design-system/tokens'

const VALUE_TYPES = [
  { value: 'money', label: 'Money' },
  { value: 'value', label: 'Value (intangible)' },
]

const visionCategoriesForAbundance = VISION_CATEGORIES.filter(
  (cat) => cat.key !== 'forward' && cat.key !== 'conclusion'
).sort((a, b) => a.order - b.order)

const ENTRY_CATEGORY_OPTIONS = [
  { value: 'gift', label: 'Gift' },
  { value: 'discount', label: 'Discount' },
  { value: 'income', label: 'Income' },
  { value: 'found_money', label: 'Found Money' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'support', label: 'Support / Kindness' },
  { value: 'synchronicity', label: 'Synchronicity' },
]

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
  const [visionCategory, setVisionCategory] = useState('')
  const [entryCategory, setEntryCategory] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)

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
          visionCategory: visionCategory || undefined,
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
      setVisionCategory('')
      setEntryCategory('')
      setDate(today)
      setImageSource(null)
      setFile(null)
      setAiGeneratedImageUrl(null)
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
        <div>
          <Link
            href="/abundance-tracker"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <PageHero
            title="Log Abundance Moment"
            subtitle="Capture gifts, synchronicities, and abundance flowing to you right now."
          />
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <DatePicker
                label="Date"
                value={date}
                maxDate={today}
                onChange={(dateString: string) => setDate(dateString)}
                required
              />

              <Select
                label="Track as:"
                value={valueType}
                onChange={(value) => setValueType(value as 'money' | 'value')}
                options={VALUE_TYPES}
              />

              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-200">
                    Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="text-neutral-400 hover:text-white transition-colors p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Help: Money vs Value"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={valueType === 'money' ? '0.00' : 'Optional amount'}
                  value={formatAmountWithCommas(amount)}
                  onChange={(event) => setAmount(parseAmountInput(event.target.value))}
                  required={valueType === 'money'}
                  prefix="$"
                />
              </div>
            </div>

            <Textarea
              label="Note"
              placeholder="Describe this abundance moment in present-tense appreciation."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              required
            />

            <div>
              <Select
                label="Kind of abundance:"
                value={entryCategory}
                onChange={(value) => setEntryCategory(value)}
                options={ENTRY_CATEGORY_OPTIONS}
                placeholder="Abundance type (optional)"
              />
            </div>

            <div>
              <p className="text-sm text-neutral-400 mb-3 text-center">
                Select categories for your abundance entry (optional)
              </p>
              <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                {visionCategoriesForAbundance.map((category) => {
                  const isSelected = visionCategory === category.key
                  return (
                    <CategoryCard
                      key={category.key}
                      category={category}
                      selected={isSelected}
                      onClick={() => setVisionCategory(isSelected ? '' : category.key)}
                      variant="outlined"
                      selectionStyle="border"
                      iconColor={isSelected ? '#39FF14' : '#FFFFFF'}
                      selectedIconColor="#39FF14"
                      className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-3">
                Image (optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Button
                  type="button"
                  variant={imageSource === 'upload' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImageSource('upload')
                    setAiGeneratedImageUrl(null)
                  }}
                  className="w-full sm:flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setImageSource('ai')
                    setFile(null)
                  }}
                  style={
                    imageSource === 'ai'
                      ? {
                          backgroundColor: colors.semantic.premium,
                          borderColor: colors.semantic.premium,
                        }
                      : {
                          borderColor: colors.semantic.premium,
                          color: colors.semantic.premium,
                        }
                  }
                  className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                    imageSource === 'ai'
                      ? 'text-white hover:opacity-90'
                      : 'bg-transparent hover:bg-[#BF00FF]/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with VIVA
                </button>
              </div>

              {imageSource === 'upload' && (
                <FileUpload
                  dragDrop
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
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
                    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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

            {successMessage && (
              <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? 'Logging...' : 'Log Abundance Moment'}
              </Button>
            </div>
          </form>

          <Modal
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="Money vs Value (intangible)"
            size="md"
          >
            <div className="space-y-4 text-sm text-neutral-300">
              <p>
                <strong className="text-white">Money</strong> entries require an amount.
              </p>
              <p>
                <strong className="text-white">Value (intangible)</strong> entries celebrate intangible abundance—share the story in the note and add an amount if you want to track it numerically.
              </p>
            </div>
          </Modal>
        </Card>
      </Stack>
    </Container>
  )
}
