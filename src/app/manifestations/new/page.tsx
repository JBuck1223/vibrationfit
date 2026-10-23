'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, Input, Button, Container, Stack, Modal, FullBleed, IntensiveStepCompleteModal, CategoryGrid, Textarea } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, CheckCircle, XCircle, ImageIcon, Home, Save, Tag, X } from 'lucide-react'
import { reportFlowSignal } from '@/hooks/useActiveFlow'
import { useInShell } from '@/lib/app-shell/shell-context'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { cn } from '@/lib/utils'
import { CategorySheet, LIFE_CATEGORIES } from '@/components/app-shell/forms/CategorySheet'
import { VivaImagePanel } from '@/components/app-shell/forms/VivaImagePanel'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'actualized', label: 'Actualized' },
  { value: 'inactive', label: 'Inactive' },
] as const

export default function NewVisionBoardItemPage() {
  const router = useRouter()
  // In the app shell the form keeps the shell's glass instead of forced dark fields.
  const inShell = useInShell()
  const darkField = inShell ? '' : '!bg-[#1A1A1A] !border-[#282828]'
  const darkTextarea = inShell ? '' : '[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isIntensivePage = pathname.startsWith('/intensive/')
  const isIntensiveUrlParam = searchParams.get('intensive') === 'true'
  const wantsHousehold = searchParams.get('household') === '1'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<{ id: string; name: string; isMultiMember: boolean } | null>(null)
  const [shareWithHousehold, setShareWithHousehold] = useState(false)
  const [existingItems, setExistingItems] = useState<any[]>([])
  const [categoriesNeeded, setCategoriesNeeded] = useState<string[]>(LIFE_CATEGORY_KEYS)
  const [isUserInIntensive, setIsUserInIntensive] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [actualizedFile, setActualizedFile] = useState<File | null>(null)
  const [actualizedAiGeneratedImageUrl, setActualizedAiGeneratedImageUrl] = useState<string | null>(null)
  const [actualizedImageSource, setActualizedImageSource] = useState<'upload' | 'ai' | null>(null)
  const [visionUploadRevealed, setVisionUploadRevealed] = useState(false)
  const [evidenceUploadRevealed, setEvidenceUploadRevealed] = useState(false)
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
  const [showImageReminderModal, setShowImageReminderModal] = useState(false)
  const [imageReminderMessage, setImageReminderMessage] = useState('')
  // Shell composer: which image panel is open, and the life categories sheet.
  const [visionPanel, setVisionPanel] = useState<'upload' | 'ai' | null>(null)
  const [evidencePanel, setEvidencePanel] = useState<'upload' | 'ai' | null>(null)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    why_it_matters: '',
    what_it_feels_like: '',
    actualization_story: '',
    status: 'active',
    categories: [] as string[]
  })
  

  // Check if user is in intensive mode and load existing manifestations
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        // Resolve household so we can offer "Include in household"
        try {
          const res = await fetch('/api/household?includeMembers=true')
          if (res.ok) {
            const data = await res.json()
            if (data?.household) {
              const isMultiMember = (data.members?.length || 0) > 1
              setHousehold({
                id: data.household.id,
                name: data.household.name,
                isMultiMember,
              })
              if (wantsHousehold && isMultiMember) setShareWithHousehold(true)
            }
          }
        } catch (e) {
          console.warn('Could not load household context:', e)
        }

        // Check if user has an active intensive checklist
        const { data: checklist } = await supabase
          .from('intensive_checklist')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .maybeSingle()

        const inIntensive = !!checklist || isIntensiveUrlParam
        setIsUserInIntensive(inIntensive)

        // Load existing items if user is in intensive mode
        if (inIntensive) {
          const { data: items } = await supabase
            .from('manifestations')
            .select('categories')
            .eq('user_id', user.id)

          if (items) {
            setExistingItems(items)
            
            // Get all unique categories that already have items
            const coveredCategories = new Set<string>()
            items.forEach(item => {
              if (item.categories && Array.isArray(item.categories)) {
                item.categories.forEach((cat: string) => coveredCategories.add(cat))
              }
            })
            
            // Calculate which categories still need items
            const needed = LIFE_CATEGORY_KEYS.filter(cat => !coveredCategories.has(cat))
            setCategoriesNeeded(needed)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [isIntensiveUrlParam, wantsHousehold])

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        alert('Please log in to create a manifestation')
        return
      }

      // Get image URL (either from upload or AI generation)
      let imageUrl = ''
      if (imageSource === 'ai' && aiGeneratedImageUrl) {
        imageUrl = aiGeneratedImageUrl
      } else if (imageSource === 'upload' && file) {
        try {
          const uploadResult = await uploadUserFile('visionBoardUploaded', file, user.id)
          imageUrl = uploadResult.url
        } catch (error) {
          alert('Upload failed. Please try again or contact support if the issue persists.')
          return
        }
      } else if (!imageUrl) {
        // No image provided - show modal
        if (imageSource === 'ai') {
          setImageReminderMessage('Please click the "Generate Image" button before saving.')
        } else if (imageSource === 'upload') {
          setImageReminderMessage('Please select an image file before saving.')
        } else {
          setImageReminderMessage('Please either upload an image or generate one before saving.')
        }
        setShowImageReminderModal(true)
        setLoading(false)
        return
      }

      // Get actualized image URL if status is actualized
      let actualizedImageUrl = ''
      if (formData.status === 'actualized') {
        if (actualizedImageSource === 'ai' && actualizedAiGeneratedImageUrl) {
          actualizedImageUrl = actualizedAiGeneratedImageUrl
        } else if (actualizedImageSource === 'upload' && actualizedFile) {
          try {
            const uploadResult = await uploadUserFile('visionBoardUploaded', actualizedFile, user.id)
            actualizedImageUrl = uploadResult.url
          } catch (error) {
            alert('Upload failed. Please try again or contact support if the issue persists.')
            return
          }
        }
      }

      // Create manifestation
      const { error } = await supabase
        .from('manifestations')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          why_it_matters: formData.why_it_matters.trim() || null,
          what_it_feels_like: formData.what_it_feels_like.trim() || null,
          image_url: imageUrl,
          actualized_image_url: formData.status === 'actualized' && actualizedImageUrl ? actualizedImageUrl : null,
          actualization_story: formData.status === 'actualized' ? formData.actualization_story : null,
          status: formData.status,
          categories: formData.categories,
          household_id: shareWithHousehold && household?.isMultiMember ? household.id : null,
          actualized_at: formData.status === 'actualized' ? new Date().toISOString() : null,
          audio_recordings: audioRecordings,
        })

      if (error) throw error
      reportFlowSignal('manifestation_created', '/manifestations')

      // Update user stats
      await supabase.rpc('increment_vision_board_stats', { 
        p_user_id: user.id,
        p_status: formData.status 
      })

      // If in intensive mode, check if all categories are now covered
      if (isUserInIntensive) {
        // Reload items to check completion
        const { data: allItems } = await supabase
          .from('manifestations')
          .select('categories')
          .eq('user_id', user.id)

        if (allItems) {
          const coveredCategories = new Set<string>()
          allItems.forEach(item => {
            if (item.categories && Array.isArray(item.categories)) {
              item.categories.forEach((cat: string) => coveredCategories.add(cat))
            }
          })

          // Check if all 12 life categories are covered
          const allCategoriesCovered = LIFE_CATEGORY_KEYS.every(cat => coveredCategories.has(cat))

          if (allCategoriesCovered) {
            const { markIntensiveStep } = await import('@/lib/intensive/checklist')
            await markIntensiveStep('vision_board_completed')
            setShowStepCompleteModal(true)
            return
          } else {
            router.push(isIntensivePage ? '/intensive/vision-board' : '/manifestations/new')
            return
          }
        }
      }

      router.push(isIntensivePage ? '/intensive/vision-board' : '/manifestations')
    } catch (error) {
      console.error('Error creating manifestation:', error)
      alert('Failed to create manifestation')
    } finally {
      setLoading(false)
    }
  }

  if (inShell) {
    // App shell: the creation as a stack of glass cards with borderless
    // writing, a Photo / VIVA image toolbar, and Save in reach.
    const bare = '[&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!px-0 [&_textarea]:!text-[15px] [&_textarea]:!leading-relaxed [&_textarea]:!text-white [&_textarea]:placeholder:!text-white/40 [&_textarea]:focus:!ring-0 [&_textarea]:!shadow-none'
    const record = (category: string) => (audioUrl: string, transcript: string) =>
      setAudioRecordings(prev => [...prev, { url: audioUrl, transcript, type: 'audio' as const, category, created_at: new Date().toISOString() }])
    const heading = (text: string, hint?: string) => (
      <p className="mb-1 text-sm font-semibold text-white">
        {text}
        {hint ? <span className="ml-1.5 font-normal text-white/45">{hint}</span> : null}
      </p>
    )
    const toolButton = (on: boolean) =>
      cn('flex items-center gap-1.5 text-sm transition-colors', on ? '' : 'text-white/70 hover:text-white')
    const pickedCategories = LIFE_CATEGORIES.filter((c) => formData.categories.includes(c.key))

    // One image card for the vision image and, once actualized, the evidence.
    const imageCard = (opts: {
      title: string
      tour?: string
      panel: 'upload' | 'ai' | null
      setPanel: (p: 'upload' | 'ai' | null) => void
      file: File | null
      setFile: (f: File | null) => void
      aiUrl: string | null
      setAiUrl: (u: string | null) => void
      setSource: (s: 'upload' | 'ai' | null) => void
      text: string
      sceneLead: string
    }) => (
      <section className={cn(GLASS_CARD, 'p-4 md:p-5')} data-tour={opts.tour}>
        {heading(opts.title)}
        {opts.aiUrl && opts.panel !== 'ai' ? (
          <div className="relative mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opts.aiUrl} alt="" className="w-full rounded-2xl object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => { opts.setAiUrl(null); opts.setSource(null) }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => opts.setPanel(opts.panel === 'upload' ? null : 'upload')}
            className={toolButton(opts.panel === 'upload' || !!opts.file)}
            style={opts.panel === 'upload' || opts.file ? { color: '#39FF14' } : undefined}
          >
            <Upload className="h-4 w-4" /> Photo
          </button>
          <button
            type="button"
            onClick={() => opts.setPanel(opts.panel === 'ai' ? null : 'ai')}
            className={toolButton(opts.panel === 'ai')}
            style={opts.panel === 'ai' ? { color: '#d68bff' } : undefined}
          >
            <Sparkles className="h-4 w-4 text-[#d68bff]" /> VIVA image
          </button>
        </div>
        {opts.panel === 'upload' && (
          <div className="mt-3">
            <FileUpload
              dragDrop
              accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
              multiple={false}
              maxFiles={1}
              maxSize={10}
              value={opts.file ? [opts.file] : []}
              onChange={(files) => {
                const f = files[0] || null
                opts.setFile(f)
                if (f) { opts.setAiUrl(null); opts.setSource('upload') } else opts.setSource(null)
              }}
              onUpload={(files) => {
                const f = files[0] || null
                opts.setFile(f)
                if (f) { opts.setAiUrl(null); opts.setSource('upload') }
              }}
              dragDropText="Tap to choose a photo or drag one here"
              dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
              previewSize="lg"
            />
          </div>
        )}
        {opts.panel === 'ai' && (
          <div className="mt-3">
            <VivaImagePanel
              journalText={opts.text}
              sceneLead={opts.sceneLead}
              addedLabel="Added to this creation"
              onUse={(url) => {
                opts.setAiUrl(url || null)
                if (url) { opts.setFile(null); opts.setSource('ai') } else opts.setSource(null)
              }}
              onClose={() => opts.setPanel(null)}
            />
          </div>
        )}
      </section>
    )

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="hidden items-center gap-2 md:flex">
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button type="button" onClick={() => router.back()} className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#39FF14] px-5 py-2 text-sm font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add to board'}
            </button>
          </div>
        </div>

        <section className={cn(GLASS_CARD, 'p-4 md:p-5', bare)}>
          {/* Status lives in the card as separate chips, so it reads as part
              of the creation rather than another page toggle. */}
          <div className="mb-4 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Status">
            {STATUS_OPTIONS.map((status) => {
              const on = formData.status === status.value
              const color = status.value === 'actualized' ? '#D68BFF' : status.value === 'inactive' ? '#9CA3AF' : '#39FF14'
              return (
                <button
                  key={status.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFormData({
                    ...formData,
                    status: status.value,
                    actualization_story: status.value === 'actualized' ? formData.actualization_story : '',
                  })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    on ? 'text-white' : 'border-white/12 text-white/55 hover:text-white',
                  )}
                  style={on ? { borderColor: `${color}99`, background: `${color}1f` } : undefined}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, opacity: on ? 1 : 0.5 }} />
                  {status.label}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="What do you choose to create?"
            required
            aria-label="Creation name"
            className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-white/40 focus:outline-none md:text-2xl"
          />
          <div className="my-3 h-px bg-white/[0.08]" />
          <RecordingTextarea
            label=""
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Describe it as if it's already yours. Or tap the mic and talk."
            rows={4}
            storageFolder="visionBoard"
            recordingPurpose="quick"
            category="vision-board"
            onAudioSaved={record('vision-board')}
          />
        </section>

        {imageCard({
          title: 'Vision image',
          panel: visionPanel,
          setPanel: setVisionPanel,
          file,
          setFile,
          aiUrl: aiGeneratedImageUrl,
          setAiUrl: setAiGeneratedImageUrl,
          setSource: setImageSource,
          text: [formData.name, formData.description].filter(Boolean).join('. '),
          sceneLead: 'A vivid, inspiring vision board image of this creation, already real',
        })}

        <section className={cn(GLASS_CARD, 'p-4 md:p-5')}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCategorySheetOpen(true)}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
            >
              <Tag className="h-4 w-4" /> Life categories
            </button>
            {pickedCategories.length > 0 && (
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {pickedCategories.map((c) => (
                  <span key={c.key} className="rounded-full bg-[rgba(57,255,20,0.12)] px-2.5 py-0.5 text-xs text-[#39FF14]">
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isUserInIntensive && categoriesNeeded.length > 0 && (
            <p className="mt-2 text-xs text-white/55">
              Add at least one image for each life area. Still need: <span className="text-[#39FF14]">{categoriesNeeded.join(', ')}</span>
            </p>
          )}
          {household?.isMultiMember && (
            <>
              <div className="my-3 h-px bg-white/[0.08]" />
              <button
                type="button"
                onClick={() => setShareWithHousehold((v) => !v)}
                aria-pressed={shareWithHousehold}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    <Home className="h-4 w-4 text-[#00FFFF]" />
                    Include in {household.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {shareWithHousehold ? 'Everyone in your household will see this creation.' : 'Private to you until shared.'}
                  </span>
                </span>
                <span className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', shareWithHousehold ? 'bg-[#00FFFF]' : 'bg-white/15')}>
                  <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', shareWithHousehold ? 'translate-x-6 !bg-black' : 'translate-x-1')} />
                </span>
              </button>
            </>
          )}
        </section>

        <section className={cn(GLASS_CARD, 'p-4 md:p-5', bare)}>
          {heading('Why you want it', 'optional')}
          <Textarea
            value={formData.why_it_matters}
            onChange={(e) => setFormData({ ...formData, why_it_matters: e.target.value })}
            placeholder="Why this matters to you."
            rows={2}
          />
          <div className="my-3 h-px bg-white/[0.08]" />
          {heading('What it feels like', 'optional')}
          <Textarea
            value={formData.what_it_feels_like}
            onChange={(e) => setFormData({ ...formData, what_it_feels_like: e.target.value })}
            placeholder="The feeling of already living this reality."
            rows={2}
          />
        </section>

        {formData.status === 'actualized' && (
          <>
            {imageCard({
              title: 'Evidence image',
              panel: evidencePanel,
              setPanel: setEvidencePanel,
              file: actualizedFile,
              setFile: setActualizedFile,
              aiUrl: actualizedAiGeneratedImageUrl,
              setAiUrl: setActualizedAiGeneratedImageUrl,
              setSource: setActualizedImageSource,
              text: [formData.name, formData.description].filter(Boolean).join('. '),
              sceneLead: 'A joyful photo-like image showing this creation actualized in real life',
            })}
            <section className={cn(GLASS_CARD, 'p-4 md:p-5', bare)}>
              {heading('Actualization story')}
              <RecordingTextarea
                label=""
                value={formData.actualization_story}
                onChange={(value) => setFormData({ ...formData, actualization_story: value })}
                placeholder="Tell the story of how this arrived. Or tap the mic and talk."
                rows={5}
                storageFolder="visionBoard"
                recordingPurpose="quick"
                category="vision-board-actualization"
                onAudioSaved={record('vision-board-actualization')}
              />
            </section>
          </>
        )}

        {audioRecordings.length > 0 && (
          <SavedRecordings
            recordings={audioRecordings}
            onDelete={(index) => setAudioRecordings(prev => prev.filter((_, i) => i !== index))}
          />
        )}

        {/* Phones: Save stays in reach above the bottom bar while writing. */}
        <div className="sticky bottom-[calc(var(--shell-nav-height,76px)+env(safe-area-inset-bottom,0px)+16px)] z-20 md:hidden">
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Adding...' : 'Add to board'}
          </button>
        </div>

        <CategorySheet
          open={categorySheetOpen}
          onClose={() => setCategorySheetOpen(false)}
          selected={formData.categories}
          onToggle={handleCategoryToggle}
          onClear={() => setFormData((prev) => ({ ...prev, categories: [] }))}
        />

        <Modal isOpen={showImageReminderModal} onClose={() => setShowImageReminderModal(false)} title="Add an image">
          <div className="space-y-4 text-center">
            <p className="text-white/75">{imageReminderMessage}</p>
            <Button onClick={() => setShowImageReminderModal(false)} variant="primary">Got It</Button>
          </div>
        </Modal>
        <IntensiveStepCompleteModal
          isOpen={showStepCompleteModal}
          onClose={() => setShowStepCompleteModal(false)}
          stepId="vision_board"
        />
      </form>
    )
  }

  return (
    <Container size="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Card variant="outlined" className={inShell ? '!p-5 md:!p-6 lg:!p-8' : '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]'}>
            <Stack gap="lg">
              {/* Creation Name */}
              <section className="space-y-3 text-center">
                <div className="flex items-center gap-3">
                  <div className={`h-px flex-1 ${inShell ? 'bg-white/10' : 'bg-[#2A2A2A]'}`} />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Creation name</p>
                  <div className={`h-px flex-1 ${inShell ? 'bg-white/10' : 'bg-[#2A2A2A]'}`} />
                </div>
                <Input
                  type="text"
                  placeholder="What do you choose to create?"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${darkField} !text-base !font-medium !text-center`}
                  required
                />
              </section>

              {/* Image Source Toggle */}
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Vision image</p>
                
                {/* Toggle Buttons */}
                <div className="flex flex-row gap-2 items-center justify-center">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageSource('upload')
                      setAiGeneratedImageUrl(null)
                      setVisionUploadRevealed(true)
                    }}
                    className="flex-1 max-w-[180px]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant={imageSource === 'ai' ? 'accent' : 'outline-purple'}
                    size="sm"
                    onClick={() => {
                      setImageSource('ai')
                      setFile(null)
                      setVisionUploadRevealed(false)
                    }}
                    className="flex-1 max-w-[180px]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    VIVA Generate
                  </Button>
                </div>

                {/* Enhanced FileUpload Component */}
                {imageSource === 'upload' && (visionUploadRevealed || file) && (
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
                      title={formData.name}
                      description={formData.description}
                      visionText={
                        formData.name && formData.description
                          ? `${formData.name}. ${formData.description}`
                          : formData.description || formData.name || ''
                      }
                    />
                    
                    {/* Show AI-generated image preview */}
                    {aiGeneratedImageUrl && (
                      <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <img
                            src={aiGeneratedImageUrl}
                            alt="AI Generated Preview"
                            className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                          />
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-white">AI Generated Image</p>
                            <p className="text-xs text-neutral-400">
                              Generated with VIVA
                              <span className="ml-2 text-green-400">• Auto-Selected</span>
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
              </section>

              {/* Status */}
              <section className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Status</p>
                {/* Status Buttons - Single Line, Equal Width */}
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        status: status.value,
                        actualization_story: status.value === 'actualized' ? formData.actualization_story : ''
                      })}
                      className={`px-2 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 flex-1 ${
                        formData.status === status.value
                          ? status.value === 'active' 
                            ? 'bg-green-600 text-white shadow-lg'
                            : status.value === 'actualized'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {status.value === 'active' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                      {status.value === 'actualized' && <CheckCircle className="w-3 h-3 text-white" />}
                      {status.value === 'inactive' && <XCircle className="w-3 h-3 text-white" />}
                      {status.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Include in household */}
              {household?.isMultiMember && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShareWithHousehold((v) => !v)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                      shareWithHousehold
                        ? 'border-[#00FFFF] bg-[#00FFFF]/10'
                        : 'border-[#282828] bg-[#1A1A1A] hover:border-neutral-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-white">
                      <Home className="w-4 h-4 text-[#00FFFF]" />
                      Include in {household.name}
                    </span>
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        shareWithHousehold ? 'bg-[#00FFFF]' : 'bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                          shareWithHousehold ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">
                    {shareWithHousehold
                      ? 'Everyone in your household will see this creation.'
                      : 'Private to you until shared.'}
                  </p>
                </section>
              )}

              {/* Life Categories */}
              <FullBleed>
                <section className="space-y-2">
                  {isUserInIntensive && categoriesNeeded.length > 0 && (
                    <p className="text-xs text-neutral-500 text-center px-4 md:px-0">
                      Intensive mode: add at least one image for each life area. Still need: <strong className="text-primary-500">{categoriesNeeded.join(', ')}</strong>
                    </p>
                  )}
                  <CategoryGrid
                    categories={VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion')}
                    selectedCategories={formData.categories}
                    onCategoryClick={handleCategoryToggle}
                    pillLabel="Tag life categories"
                    lifeVisionCategoryStrip
                    desktopColumnCount={6}
                  />
                </section>
              </FullBleed>

              {/* Description */}
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Description</p>
                <div className={darkTextarea}>
                  <RecordingTextarea
                    label=""
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Describe this creation. Tap the mic to record."
                    rows={4}
                    storageFolder="visionBoard"
                    recordingPurpose="quick"
                    category="vision-board"
                    onAudioSaved={(audioUrl, transcript) => {
                      setAudioRecordings(prev => [...prev, {
                        url: audioUrl,
                        transcript,
                        type: 'audio' as const,
                        category: 'vision-board',
                        created_at: new Date().toISOString(),
                      }])
                    }}
                  />
                </div>
              </section>

              {/* Why you want it / What it feels like — optional depth */}
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Why you want it (optional)</p>
                <Textarea
                  value={formData.why_it_matters}
                  onChange={(e) => setFormData({ ...formData, why_it_matters: e.target.value })}
                  placeholder="Why this matters to you — your Life Vision can seed the language, then this text is yours."
                  rows={3}
                  className={darkField}
                />
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">What it feels like (optional)</p>
                <Textarea
                  value={formData.what_it_feels_like}
                  onChange={(e) => setFormData({ ...formData, what_it_feels_like: e.target.value })}
                  placeholder="The feeling of already living this reality."
                  rows={3}
                  className={darkField}
                />
              </section>

              {/* Actualized Image - Only show when status is actualized */}
              {formData.status === 'actualized' && (
                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Evidence image</p>
                  
                  {/* Toggle Buttons */}
                  <div className="flex flex-row gap-2 items-center justify-center">
                    <Button
                      type="button"
                      variant={actualizedImageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActualizedImageSource('upload')
                        setActualizedAiGeneratedImageUrl(null)
                        setEvidenceUploadRevealed(true)
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={actualizedImageSource === 'ai' ? 'accent' : 'outline-purple'}
                      size="sm"
                      onClick={() => {
                        setActualizedImageSource('ai')
                        setActualizedFile(null)
                        setEvidenceUploadRevealed(false)
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      VIVA Generate
                    </Button>
                  </div>

                  {/* Enhanced FileUpload Component for Actualized Image */}
                  {actualizedImageSource === 'upload' && (evidenceUploadRevealed || actualizedFile) && (
                    <FileUpload
                      dragDrop
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={actualizedFile ? [actualizedFile] : []}
                      onChange={(files) => setActualizedFile(files[0] || null)}
                      onUpload={(files) => setActualizedFile(files[0] || null)}
                      dragDropText="Click to upload or drag and drop"
                      dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                      previewSize="lg"
                    />
                  )}

                  {actualizedImageSource === 'ai' && (
                    <>
                      <AIImageGenerator
                        type="vision_board"
                        onImageGenerated={(url) => setActualizedAiGeneratedImageUrl(url)}
                        title={`Actualized: ${formData.name}`}
                        description={`Evidence of actualization: ${formData.description}`}
                        visionText={
                          formData.name && formData.description
                            ? `Actualized: ${formData.name}. Evidence: ${formData.description}`
                            : `Actualized: ${formData.description || formData.name || ''}`
                        }
                      />
                      
                      {actualizedAiGeneratedImageUrl && (
                        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <img
                              src={actualizedAiGeneratedImageUrl}
                              alt="AI Generated Evidence Preview"
                              className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                            />
                            <div className="flex-1 text-center sm:text-left">
                              <p className="text-sm font-medium text-white">AI Generated Evidence</p>
                              <p className="text-xs text-neutral-400">
                                Generated with VIVA
                                <span className="ml-2 text-green-400">• Auto-Selected</span>
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActualizedAiGeneratedImageUrl(null)}
                              className="w-full sm:w-auto"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {/* Actualization Story - Only show when status is actualized */}
              {formData.status === 'actualized' && (
                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Actualization story</p>
                  <div className={darkTextarea}>
                    <RecordingTextarea
                      label=""
                      value={formData.actualization_story}
                      onChange={(value) => setFormData({ ...formData, actualization_story: value })}
                      placeholder="Tell the story of how this was actualized. Tap the mic to record."
                      rows={6}
                      storageFolder="visionBoard"
                      recordingPurpose="quick"
                      category="vision-board-actualization"
                      onAudioSaved={(audioUrl, transcript) => {
                        setAudioRecordings(prev => [...prev, {
                          url: audioUrl,
                          transcript,
                          type: 'audio' as const,
                          category: 'vision-board-actualization',
                          created_at: new Date().toISOString(),
                        }])
                      }}
                    />
                  </div>
                </section>
              )}

              {audioRecordings.length > 0 && (
                <SavedRecordings
                  recordings={audioRecordings}
                  onDelete={(index) => setAudioRecordings(prev => prev.filter((_, i) => i !== index))}
                />
              )}

              {/* Submit */}
              <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end">
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
                  loading={loading}
                  disabled={loading}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  {loading ? 'Creating...' : 'Add to Manifestations'}
                </Button>
              </div>
            </Stack>
          </Card>
        </Stack>
      </form>

      {/* Image Reminder Modal */}
      <Modal
        isOpen={showImageReminderModal}
        onClose={() => setShowImageReminderModal(false)}
        title="No Image Attached"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <ImageIcon className="w-16 h-16 text-primary-500" />
          </div>
          <p className="text-neutral-300 text-center">
            {imageReminderMessage}
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowImageReminderModal(false)}
              variant="primary"
            >
              Got It
            </Button>
          </div>
        </div>
      </Modal>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="vision_board"
      />
    </Container>
  )
}
