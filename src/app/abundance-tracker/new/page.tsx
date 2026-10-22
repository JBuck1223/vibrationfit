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
import { useInShell } from '@/lib/app-shell/shell-context'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { DateSheetField } from '@/components/app-shell/forms/DateSheetField'
import { VivaImagePanel } from '@/components/app-shell/forms/VivaImagePanel'
import { CategorySheet, LIFE_CATEGORIES } from '@/components/app-shell/forms/CategorySheet'
import { ImageIcon, Plus, X } from 'lucide-react'

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
  const inShell = useInShell()
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)

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

  if (inShell) {
    // App shell: an amount card, a note card and a slim attachments toolbar,
    // all glass, with Save in reach. Same fields and saving as below.
    const chip = 'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors'
    const toggleCategory = (key: string) =>
      setVisionCategories((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <DateSheetField value={date} onChange={setDate} />
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button type="button" onClick={() => router.push('/abundance-tracker')} className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#39FF14] px-5 py-2 text-sm font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <section className={cn(GLASS_CARD, 'p-4 md:p-5')}>
          <div className="flex items-center justify-center gap-2">
            <div role="radiogroup" aria-label="Money or value" className="grid grid-cols-2 rounded-full border border-white/15 bg-white/[0.05] p-1">
              {(['money', 'value'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={valueType === v}
                  onClick={() => setValueType(v)}
                  className={cn(
                    'rounded-full px-5 py-1.5 text-sm font-semibold transition-colors',
                    valueType === v ? 'bg-[#39FF14] text-black' : 'text-white/75 hover:text-white',
                  )}
                >
                  {v === 'money' ? 'Money' : 'Value'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setHelpOpen(true)} aria-label="Help: Money vs Value" className="text-white/50 hover:text-white">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-[#39FF14]/70">$</span>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Amount"
              placeholder="0"
              value={formatAmountWithCommas(amount)}
              onChange={(event) => setAmount(parseAmountInput(event.target.value))}
              required={valueType === 'money'}
              size={Math.max(2, formatAmountWithCommas(amount).length + 1)}
              className="max-w-full !border-0 !bg-transparent !p-0 text-center !text-5xl !font-bold !leading-tight tabular-nums !text-[#39FF14] placeholder:!text-[#39FF14]/30 !shadow-none focus:!outline-none focus:!ring-0"
            />
          </div>
          <p className="mt-1 text-center text-xs text-white/45">{valueType === 'money' ? 'How much came to you?' : 'Optional: put a number on it'}</p>

          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:justify-center md:px-0">
            {ABUNDANCE_ENTRY_CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={entryCategory === value}
                onClick={() => setEntryCategory(entryCategory === value ? '' : value)}
                className={cn(
                  chip,
                  entryCategory === value ? 'border-[#39FF14] bg-[rgba(57,255,20,0.14)] text-[#39FF14]' : 'border-white/15 text-white/75 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={cn(GLASS_CARD, 'p-4 md:p-5')}>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-[#FFB020]" aria-hidden />
            What's flowing to you
          </p>
          <div className="[&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!px-0 [&_textarea]:!text-[15px] [&_textarea]:!leading-relaxed [&_textarea]:!text-white [&_textarea]:placeholder:!text-white/40 [&_textarea]:focus:!ring-0 [&_textarea]:!shadow-none">
            <RecordingTextarea
              value={note}
              onChange={(value) => {
                setNote(value)
                if (noteError) setNoteError(null)
              }}
              placeholder="Describe it in present-tense appreciation. Or tap the mic and talk."
              rows={4}
              storageFolder="profile"
              instanceId="abundance-note"
              recordingPurpose="quick"
              category="abundance"
              onAudioSaved={(audioUrl, transcript) => {
                setAudioRecordings((prev) => [
                  ...prev,
                  { url: audioUrl, transcript, type: 'audio' as const, category: 'abundance', created_at: new Date().toISOString() },
                ])
              }}
            />
          </div>
          {noteError ? <p className="mt-1 text-xs text-red-400" role="alert">{noteError}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {visionCategories.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                aria-label={`Remove ${LIFE_CATEGORIES.find((c) => c.key === key)?.label ?? key}`}
                className={cn(chip, 'border-[#39FF14]/50 bg-[rgba(57,255,20,0.1)] text-[#39FF14]')}
              >
                {LIFE_CATEGORIES.find((c) => c.key === key)?.label ?? key}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button type="button" onClick={() => setCategorySheetOpen(true)} className={cn(chip, 'border-dashed border-white/30 text-white/75 hover:text-white')}>
              <Plus className="h-3.5 w-3.5" /> Categories
            </button>
          </div>

          <div className="mt-4 flex items-center gap-5 border-t border-white/[0.08] pt-3 text-sm">
            <button
              type="button"
              onClick={() => {
                setImageSource(imageSource === 'upload' ? null : 'upload')
                setAiGeneratedImageUrl(null)
              }}
              className={cn('flex items-center gap-1.5', imageSource === 'upload' ? 'text-[#39FF14]' : 'text-white/70 hover:text-white')}
            >
              <ImageIcon className="h-4 w-4" /> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setImageSource(imageSource === 'ai' ? null : 'ai')
                setFile(null)
              }}
              className={cn('flex items-center gap-1.5', imageSource === 'ai' ? 'text-[#BF00FF]' : 'text-white/70 hover:text-white')}
            >
              <Sparkles className="h-4 w-4 text-[#d68bff]" /> VIVA image
            </button>
          </div>
          {imageSource === 'upload' ? (
            <div className="mt-3">
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
            </div>
          ) : null}
          {imageSource === 'ai' ? (
            <div className="mt-3">
              <VivaImagePanel
                journalText={note || 'An abundance moment to celebrate.'}
                onUse={(url) => setAiGeneratedImageUrl(url || null)}
                onClose={() => {
                  setImageSource(null)
                  setAiGeneratedImageUrl(null)
                }}
              />
            </div>
          ) : null}
        </section>

        {errorMessage && (
          <div className="rounded-xl border border-[#D03739]/40 bg-[#D03739]/10 px-4 py-3 text-sm text-[#FFB4B4]">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-[#199D67]/40 bg-[#199D67]/10 px-4 py-3 text-sm text-[#A8E5CE]">{successMessage}</div>
        )}

        {/* Phones: Save stays in reach above the bottom bar. */}
        <div className="sticky bottom-[calc(var(--shell-nav-height,76px)+env(safe-area-inset-bottom,0px)+16px)] z-20 md:hidden">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save abundance'}
          </button>
        </div>

        <CategorySheet open={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} selected={visionCategories} onToggle={toggleCategory} />

        <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Money vs Value" size="md">
          <div className="space-y-4 text-sm text-neutral-300">
            <p>
              <strong className="text-white">Money</strong> entries require an amount.
            </p>
            <p>
              <strong className="text-white">Value</strong> entries celebrate intangible abundance—share the story in the note and add an amount if you want to track it numerically.
            </p>
          </div>
        </Modal>
      </form>
    )
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
