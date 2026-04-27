'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import * as Diff from 'diff'
import {
  Sparkles,
  Edit,
  Wand2,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  RefreshCw,
  Lightbulb,
  ChevronDown,
} from 'lucide-react'
import {
  Card,
  Button,
  Badge,
  Spinner,
  SaveButton,
  AutoResizeTextarea,
  Icon,
  CategoryGrid,
  Container,
  Stack,
  IconList,
  VIVALoadingOverlay,
  InsufficientTokensDialog,
} from '@/lib/design-system'
import { VISION_CATEGORIES, getVisionCategory, getVisionCategoryLabel, getCategoryStateField, getCategoryStoryField, visionToRecordingKey, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'
import { colors } from '@/lib/design-system/tokens'
import { updateDraftCategory, type VisionData } from '@/lib/life-vision/draft-helpers'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

type SourceMode = 'profile' | 'vision'

export default function UnifiedCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.category as string
  const supabase = createClient()
  const { draftId, activeVisionId, refreshVisions } = useLifeVisionStudio()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const [draftVision, setDraftVision] = useState<VisionData | null>(null)
  const [activeVision, setActiveVision] = useState<VisionData | null>(null)
  const [refinedCategories, setRefinedCategories] = useState<string[]>([])

  const [sourceMode, setSourceMode] = useState<SourceMode>('profile')
  const hasActiveContent = !!(activeVision && (activeVision[categoryKey as keyof VisionData] as string)?.trim())

  // Profile mode state
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState<{ story: string; hasStory: boolean; state: string; hasStateData: boolean } | null>(null)
  const [getMeStartedText, setGetMeStartedText] = useState('')
  const [imaginationText, setImaginationText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false)
  const [showContextCard, setShowContextCard] = useState(false)

  const [showInspirationQuestions, setShowInspirationQuestions] = useState(false)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenErrorInfo, setTokenErrorInfo] = useState<{ tokensRemaining?: number }>({})

  // Vision mode state
  const [refinementNotes, setRefinementNotes] = useState('')
  const [refineFromRevision, setRefineFromRevision] = useState(false)

  // Shared state
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [originalVisionText, setOriginalVisionText] = useState('')
  const [previousRefinement, setPreviousRefinement] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'highlight'>('edit')
  const [showCurrentVision, setShowCurrentVision] = useState(false)
  const [showRefinement, setShowRefinement] = useState(true)
  const [currentRefinementId, setCurrentRefinementId] = useState<string | null>(null)

  const categoryGridRef = useRef<HTMLDivElement>(null)

  const category = getVisionCategory(categoryKey as LifeCategoryKey)
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const currentCategoryLabel = category?.label ?? ''

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setUser(session.user)
    }
    init()
  }, [])

  useEffect(() => {
    if (user && categoryKey) loadData()
  }, [user, categoryKey, draftId, activeVisionId])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const queries: Promise<any>[] = []

      // Load draft vision
      if (draftId) {
        queries.push(
          supabase.from('vision_versions').select('*').eq('id', draftId).single()
            .then(r => ({ type: 'draft', data: r.data }))
        )
      } else {
        queries.push(Promise.resolve({ type: 'draft', data: null }))
      }

      // Load active vision
      if (activeVisionId) {
        queries.push(
          supabase.from('vision_versions').select('*').eq('id', activeVisionId).single()
            .then(r => ({ type: 'active', data: r.data }))
        )
      } else {
        queries.push(Promise.resolve({ type: 'active', data: null }))
      }

      // Load profile
      queries.push(
        supabase.from('user_profiles').select('*')
          .eq('user_id', user.id).eq('is_active', true).eq('is_draft', false).maybeSingle()
          .then(r => ({ type: 'profile', data: r.data }))
      )

      const results = await Promise.all(queries)

      const draftResult = results.find(r => r.type === 'draft')?.data
      const activeResult = results.find(r => r.type === 'active')?.data
      const profileResult = results.find(r => r.type === 'profile')?.data

      const activeValue = activeResult ? ((activeResult[categoryKey as keyof VisionData] as string) || '') : ''
      const draftValue = draftResult ? ((draftResult[categoryKey as keyof VisionData] as string) || '') : ''

      if (draftResult) {
        setDraftVision(draftResult)
        setRefinedCategories(draftResult.refined_categories || [])
        // Only pre-populate Update field if draft has actual generated content
        // (different from active, meaning a VIVA generation already happened)
        if (draftValue.trim() && draftValue.trim() !== activeValue.trim()) {
          setCurrentRefinement(draftValue)
        } else {
          setCurrentRefinement('')
        }
      }

      if (activeResult) {
        setActiveVision(activeResult)
        setOriginalVisionText(activeValue)

        if (activeValue.trim()) {
          setSourceMode('vision')
        }
      }

      if (profileResult) {
        setFullProfile(profileResult)
        const storyField = getCategoryStoryField(categoryKey as LifeCategoryKey)
        const stateField = getCategoryStateField(categoryKey as LifeCategoryKey)
        const story = profileResult[storyField] || ''
        const state = profileResult[stateField] || ''
        setProfileData({ story, hasStory: story.trim().length > 0, state, hasStateData: !!state })

        const filtered = getFilteredQuestionsForCategory(categoryKey as LifeCategoryKey, profileResult)
        setInspirationQuestions(filtered.map(q => q.text))
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Profile mode: Get Me Started
  const handleGetMeStarted = async () => {
    setIsGeneratingStarter(true)
    setGetMeStartedText('')
    setError(null)

    try {
      const response = await fetch('/api/viva/imagination-starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryKey, perspective: 'singular' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 402) {
          setTokenErrorInfo({ tokensRemaining: errorData.tokensRemaining })
          setShowInsufficientTokens(true)
          return
        }
        throw new Error(errorData.error || `Failed to generate starter (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
          setGetMeStartedText(fullText)
        }
      }
      const finalChunk = decoder.decode()
      if (finalChunk) { fullText += finalChunk; setGetMeStartedText(fullText) }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate starter text')
    } finally {
      setIsGeneratingStarter(false)
    }
  }

  // Profile mode: Generate vision text from Get Me Started + Imagination
  const handleGenerateFromProfile = async () => {
    if (!getMeStartedText.trim() && !imaginationText.trim()) return
    if (!draftVision) return

    if (currentRefinement.trim()) setPreviousRefinement(currentRefinement)
    setIsGenerating(true)
    setCurrentRefinement('')
    setShowRefinement(true)
    setViewMode('edit')

    try {
      const stateField = getCategoryStateField(categoryKey as LifeCategoryKey)
      const currentStateText = fullProfile?.[stateField] || ''

      const response = await fetch('/api/viva/category-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryKey,
          getMeStartedText,
          imaginationText,
          currentStateText,
          perspective: activeVision?.perspective || 'singular',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
          setCurrentRefinement(fullText)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate vision text')
    } finally {
      setIsGenerating(false)
    }
  }

  // Vision mode: Refine with VIVA (from current vision text)
  const handleRefineWithViva = async () => {
    if (!draftVision || !activeVision) return

    const activeValue = (activeVision[categoryKey as keyof VisionData] as string) || ''
    const inputText = refineFromRevision && currentRefinement.trim() ? currentRefinement : activeValue
    if (!inputText.trim()) return

    if (currentRefinement.trim()) setPreviousRefinement(currentRefinement)
    setIsGenerating(true)
    setOriginalVisionText(activeValue)
    setCurrentRefinement('')
    setShowCurrentVision(true)
    setShowRefinement(true)
    setViewMode('edit')

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('perspective')
        .eq('user_id', user.id)
        .single()

      const response = await fetch('/api/viva/refine-category-weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId: draftVision.id,
          category: categoryKey,
          currentVisionText: inputText,
          refinement: { notes: refinementNotes.trim() || undefined },
          weave: { enabled: false as const },
          perspective: profile?.perspective || 'singular',
        }),
      })

      if (!response.ok) throw new Error('Failed to refine category')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.error) throw new Error(data.error)
            if (data.content) { fullText += data.content; setCurrentRefinement(fullText) }
            if (data.done && data.refinementId) setCurrentRefinementId(data.refinementId)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save to draft
  const saveDraft = async () => {
    if (!draftVision || !currentRefinement.trim()) return

    const scrollPosition = window.scrollY
    const activeElement = document.activeElement as HTMLElement
    setIsDraftSaving(true)

    try {
      const updatedDraft = await updateDraftCategory(draftVision.id, categoryKey, currentRefinement)
      setDraftVision(updatedDraft)
      setRefinedCategories(updatedDraft.refined_categories || [])

      if (currentRefinementId) {
        await supabase.from('vision_refinements').update({ applied: true, applied_at: new Date().toISOString() }).eq('id', currentRefinementId)
        setCurrentRefinementId(null)
      }

      await refreshVisions()

      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' as ScrollBehavior })
        if (activeElement?.focus) activeElement.focus()
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsDraftSaving(false)
    }
  }

  // Category navigation
  const isFirstCategory = currentIndex === 0
  const isLastCategory = currentIndex === allCategories.length - 1
  const canReviewFromLast = isLastCategory && !!draftVision && refinedCategories.length > 0

  const handleCategoryChange = (key: string) => {
    setGetMeStartedText('')
    setImaginationText('')
    setRefinementNotes('')
    setPreviousRefinement(null)
    setRefineFromRevision(false)
    setCurrentRefinementId(null)
    router.push(`/life-vision/new/${key}`)
  }

  const goToPreviousCategory = () => {
    if (currentIndex > 0) handleCategoryChange(allCategories[currentIndex - 1].key)
  }

  const goToNextCategory = () => {
    if (currentIndex < allCategories.length - 1) {
      handleCategoryChange(allCategories[currentIndex + 1].key)
    } else if (canReviewFromLast && draftVision) {
      router.push(`/life-vision/${draftVision.id}`)
    }
  }

  // Diff renderer
  const renderDiff = (oldText: string, newText: string) => {
    const diff = Diff.diffWords(oldText, newText)
    return (
      <div className="prose prose-invert max-w-none p-4 bg-neutral-800/50 rounded-lg border-2 min-h-[120px] whitespace-pre-wrap text-sm" style={{ borderColor: colors.accent[500] }}>
        {diff.map((part, i) => {
          if (part.added) return <span key={i} className="bg-green-500/30 text-green-200 px-1 rounded">{part.value}</span>
          if (part.removed) return <span key={i} className="bg-red-500/30 text-red-300 px-1 rounded line-through">{part.value}</span>
          return <span key={i}>{part.value}</span>
        })}
      </div>
    )
  }

  if (!category) return <Container><p className="text-red-400 py-12 text-center">Invalid category</p></Container>

  if (loading) {
    return <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center"><Spinner size="lg" /></Container>
  }

  if (error && !draftVision) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="primary">Go Back</Button>
        </div>
      </Container>
    )
  }

  const activeValue = activeVision ? ((activeVision[categoryKey as keyof VisionData] as string) || '') : ''
  const hasExistingRevision = !!(currentRefinement.trim() && currentRefinement.trim() !== activeValue.trim())
  const isFirstTime = !activeVision || !activeValue.trim()
  const gridMode = draftVision?.parent_id ? 'draft' : 'completion'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Category Grid */}
        <div ref={categoryGridRef}>
          <CategoryGrid
            categories={VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion')}
            activeCategory={categoryKey}
            refinedCategories={refinedCategories}
            completedCategories={gridMode === 'completion' ? refinedCategories : undefined}
            onCategoryClick={handleCategoryChange}
            mode={gridMode as any}
            fillWidth
            title={isFirstTime ? 'Choose a Category' : 'Choose a Category to Update'}
            bleedClassName="max-md:-mx-4"
            pillLabel="scroll"
          />
        </div>

        {/* Overarching Category Card */}
        <Card>
          {/* Card Header with Version Badge */}
          <div className="mb-2 flex flex-row items-center justify-center gap-2 md:gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500 md:h-8 md:w-8">
              <Icon icon={category.icon} size="xs" color="#000000" />
            </div>
            <h3 className="max-w-full text-sm font-medium uppercase tracking-[0.25em] text-neutral-400">
              {category.label}
            </h3>
            {draftVision && (
              <Badge
                variant={draftVision.parent_id ? 'warning' : 'success'}
                className="ml-2 text-[10px]"
              >
                {draftVision.parent_id ? 'Draft' : 'Version 1'}
              </Badge>
            )}
          </div>
          <div className="mb-6 border-b border-neutral-800" />

          {/* Source Mode Toggle — only show when active vision has content */}
          {hasActiveContent && (
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="inline-flex rounded-lg border border-neutral-700 bg-[#101010] p-1">
                <button
                  onClick={() => setSourceMode('profile')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    sourceMode === 'profile'
                      ? 'bg-primary-500 text-black'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  From Profile
                </button>
                <button
                  onClick={() => setSourceMode('vision')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    sourceMode === 'vision'
                      ? 'bg-accent-500 text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  From Current Vision
                </button>
              </div>

              {/* Current vision — collapsible toggle below source selector */}
              {sourceMode === 'vision' && activeValue.trim() && (
                <div className="w-full rounded-xl border border-primary-500/30 bg-[#1A1A1A] p-4">
                  <button
                    onClick={() => setShowCurrentVision(!showCurrentVision)}
                    className="w-full flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-500">Current</h5>
                      {activeVision && (
                        <span className="text-[10px] text-neutral-500">
                          Active · {new Date(activeVision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-primary-500 transition-transform ${showCurrentVision ? 'rotate-180' : ''}`} />
                  </button>
                  {showCurrentVision && (
                    <div className="pt-3 mt-3 border-t border-primary-500/20">
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{activeValue}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 1: Input — differs by source mode */}
          <section className="mb-8">
            {sourceMode === 'profile' ? (
              <div className="space-y-6">
                {/* Profile Context (collapsible) */}
                {(profileData || fullProfile) && (
                  <div className="rounded-xl border border-[#00FFFF]/30 bg-[#00FFFF]/5 p-4">
                    <button
                      onClick={() => setShowContextCard(!showContextCard)}
                      className="w-full flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[#00FFFF]" />
                        </div>
                        <span className="text-sm font-medium text-[#00FFFF]">Current State of {category.label} from Profile</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#00FFFF] transition-transform ${showContextCard ? 'rotate-180' : ''}`} />
                    </button>

                    {showContextCard && profileData?.state && (
                      <div className="pt-3 mt-3 border-t border-[#00FFFF]/20">
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{profileData.state}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inspiration Questions (collapsible) */}
                {inspirationQuestions.length > 0 && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-800/30 p-4">
                    <button
                      onClick={() => setShowInspirationQuestions(!showInspirationQuestions)}
                      className="w-full flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-medium text-neutral-300">Questions to Inspire You</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showInspirationQuestions ? 'rotate-180' : ''}`} />
                    </button>
                    {showInspirationQuestions && (
                      <div className="pt-3 mt-3 border-t border-neutral-700">
                        <IconList items={inspirationQuestions} />
                      </div>
                    )}
                  </div>
                )}

                {/* Get Me Started */}
                <div>
                  <label className="block text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                    Get Me Started
                  </label>
                  <div className="flex justify-center mb-3">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={handleGetMeStarted}
                      disabled={isGeneratingStarter}
                    >
                      {isGeneratingStarter ? (
                        <><Spinner size="sm" className="mr-2" />Generating...</>
                      ) : getMeStartedText.trim().length >= 50 ? (
                        <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />Get Me Started</>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <VIVALoadingOverlay
                      isVisible={isGeneratingStarter && !getMeStartedText.trim()}
                      messages={[`VIVA is reading your ${category.label.toLowerCase()} profile...`, 'Activating your vision language...', 'Building your starting point...']}
                      cycleDuration={3000}
                      showProgressBar={false}
                      size="sm"
                      className="rounded-xl"
                    />
                    <RecordingTextarea
                      value={getMeStartedText}
                      onChange={setGetMeStartedText}
                      placeholder={`Press "Get Me Started" and VIVA will create a starting point from your ${category.label.toLowerCase()} profile data...`}
                      className="min-h-[120px] w-full !bg-[#101010] !border-neutral-800 focus-within:!border-primary-500"
                      rows={5}
                      storageFolder="lifeVision"
                      recordingPurpose="quick"
                      category={visionToRecordingKey(categoryKey as LifeCategoryKey)}
                      instanceId="get-me-started"
                    />
                  </div>
                </div>

                {/* Unleash Your Imagination */}
                <div>
                  <label className="block text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                    Unleash Your Imagination
                  </label>
                  <RecordingTextarea
                    value={imaginationText}
                    onChange={setImaginationText}
                    placeholder={`Dream bigger. What does your absolute dream ${category.label.toLowerCase()} life look like?`}
                    className="min-h-[150px] w-full !bg-[#101010] !border-neutral-800 focus-within:!border-accent-500"
                    rows={6}
                    storageFolder="lifeVision"
                    recordingPurpose="quick"
                    category={visionToRecordingKey(categoryKey as LifeCategoryKey)}
                    instanceId="imagination"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleGenerateFromProfile}
                    disabled={isGenerating || (!getMeStartedText.trim() && !imaginationText.trim())}
                    variant="accent"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <><Spinner variant="secondary" size="sm" />Generating with VIVA...</>
                    ) : (
                      <><Wand2 className="w-5 h-5" />Generate {category.label} Vision</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Vision mode — Update Notes + VIVA generate */
              <div className="space-y-4">
                <div>
                  <label className="block text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                    Tell VIVA How to Update
                  </label>
                  <RecordingTextarea
                    value={refinementNotes}
                    onChange={setRefinementNotes}
                    placeholder="Tell VIVA how to update this category..."
                    className="min-h-[100px] w-full !bg-[#101010] !border-neutral-800 focus-within:!border-accent-500"
                    rows={4}
                    storageFolder="lifeVision"
                    recordingPurpose="quick"
                    category={`refine-${categoryKey}`}
                    instanceId="refinement-notes"
                  />
                </div>

                {hasExistingRevision && (
                  <label className="flex items-center justify-center gap-2 pt-1 cursor-pointer select-none">
                    <div
                      role="switch"
                      aria-checked={refineFromRevision}
                      onClick={() => setRefineFromRevision(!refineFromRevision)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                        refineFromRevision ? 'bg-accent-500' : 'bg-neutral-600'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                        refineFromRevision ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`} />
                    </div>
                    <span className="text-sm text-neutral-300">Update from current revision</span>
                  </label>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleRefineWithViva}
                    disabled={isGenerating || !activeValue.trim()}
                    variant="accent"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <><Spinner variant="secondary" size="sm" />Updating with VIVA...</>
                    ) : (
                      <><Wand2 className="w-5 h-5" />{refineFromRevision && hasExistingRevision ? `Update ${category.label} Revision` : `Update ${category.label} With VIVA`}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* VIVA Generation Overlay + Streaming Result */}
          <section className="relative">
            <VIVALoadingOverlay
              isVisible={isGenerating && !currentRefinement.trim()}
              messages={[
                `VIVA is crafting your ${category.label.toLowerCase()} vision...`,
                'Weaving your intentions into words...',
                'Channeling your ideal future...',
              ]}
              cycleDuration={3500}
              showProgressBar={false}
              size="md"
              className="rounded-xl"
            />

            {/* Update result — shows when generating or has content */}
            {(isGenerating || currentRefinement.trim()) && (
              <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] p-4 md:p-5" style={{ overflowAnchor: 'none' } as React.CSSProperties}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: colors.accent[500] }}>
                    {isFirstTime ? `${category.label} Vision` : `Updated ${category.label}`}
                  </h5>

                  {originalVisionText && currentRefinement && !isGenerating && (
                    <div className="inline-flex self-center sm:self-auto rounded-lg border border-accent-500/40 bg-[#101010] p-1">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'edit' ? 'bg-accent-500 text-white' : 'text-neutral-300 hover:text-white'}`}
                      >
                        <Edit className="w-3.5 h-3.5 inline mr-1.5" />Edit
                      </button>
                      <button
                        onClick={() => setViewMode('highlight')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'highlight' ? 'bg-accent-500 text-white' : 'text-neutral-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />Highlight
                      </button>
                    </div>
                  )}
                </div>

                {viewMode === 'highlight' && originalVisionText && currentRefinement && !isGenerating ? (
                  renderDiff(originalVisionText, currentRefinement)
                ) : (
                  <AutoResizeTextarea
                    value={currentRefinement}
                    onChange={setCurrentRefinement}
                    placeholder={isFirstTime ? 'Your generated vision will stream here...' : 'Your updated vision will stream here...'}
                    className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3"
                    style={{ overflowAnchor: 'none' } as React.CSSProperties}
                    minHeight={120}
                  />
                )}

                {!isGenerating && currentRefinement.trim() && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {previousRefinement && (
                      <Button
                        onClick={() => { setCurrentRefinement(previousRefinement); setPreviousRefinement(null) }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />Revert to Previous
                      </Button>
                    )}
                    <SaveButton
                      saveLabel="Save to Draft"
                      hasUnsavedChanges={!!(
                        draftVision &&
                        currentRefinement.trim() &&
                        currentRefinement.trim() !== ((draftVision[categoryKey as keyof VisionData] as string) || '').trim()
                      )}
                      isSaving={isDraftSaving}
                      onClick={saveDraft}
                      disabled={!draftVision || !currentRefinement.trim()}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Compare Section — only shows when there's generated content AND active vision to compare against */}
          {currentRefinement.trim() && activeValue.trim() && !isGenerating && (
            <section className="border-t border-neutral-800 pt-6 mt-6">
              <div className="mb-5 text-center">
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Compare</h4>
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    role="switch"
                    aria-checked={showCurrentVision}
                    onClick={() => setShowCurrentVision(!showCurrentVision)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      showCurrentVision ? 'bg-primary-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showCurrentVision ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <span className="text-sm text-neutral-300">Show Current Vision</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    role="switch"
                    aria-checked={showRefinement}
                    onClick={() => setShowRefinement(!showRefinement)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      showRefinement ? 'bg-accent-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showRefinement ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <span className="text-sm text-neutral-300">Show Update</span>
                </label>
              </div>

              <div className={`space-y-6 ${showCurrentVision && showRefinement ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
                {/* Current Vision Panel */}
                <div className={showCurrentVision ? 'block' : 'hidden'}>
                  <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">Current Vision</h5>
                      {activeVision && (
                        <span className="text-[11px] text-neutral-400">
                          Active · {new Date(activeVision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <AutoResizeTextarea
                      value={activeValue}
                      onChange={() => {}}
                      readOnly
                      className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3"
                      minHeight={120}
                    />
                  </div>
                </div>

                {/* Update Panel (read-only view for compare) */}
                <div className={showRefinement ? 'block' : 'hidden'}>
                  <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] p-4 md:p-5">
                    <h5 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: colors.accent[500] }}>
                      {isFirstTime ? 'Generated Vision' : 'Updated Vision'}
                    </h5>
                    <AutoResizeTextarea
                      value={currentRefinement}
                      onChange={() => {}}
                      readOnly
                      className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3"
                      minHeight={120}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </Card>

        {/* Previous / Progress / Next Footer */}
        <div className="flex items-center justify-between px-4 md:px-0">
          <div className="flex-1 flex justify-start">
            <Button onClick={goToPreviousCategory} disabled={isFirstCategory} variant="outline" size="sm" className="w-24 md:w-auto">
              <ChevronsLeft className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronLeft className="w-4 h-4 flex-shrink-0 hidden md:block" />
              <span className="hidden md:inline">Previous</span>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-0.5 text-sm text-neutral-400 md:flex-row md:gap-2">
            <div className="flex items-center gap-2">
              <span>{currentIndex + 1} of {allCategories.length}</span>
              <span>·</span>
              <span>{currentCategoryLabel}</span>
            </div>
            {refinedCategories.includes(categoryKey) && (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline">·</span>
                <span className="text-primary-500">{isFirstTime ? 'Complete' : 'Updated'}</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            <Button onClick={goToNextCategory} disabled={isLastCategory && !canReviewFromLast} variant={canReviewFromLast ? 'primary' : 'outline'} size="sm" className="w-24 md:w-auto">
              <span className="hidden md:inline">{canReviewFromLast ? 'Review' : 'Next'}</span>
              <ChevronsRight className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronRight className="w-4 h-4 flex-shrink-0 hidden md:block" />
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Card className="bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}
      </Stack>

      <InsufficientTokensDialog
        isOpen={showInsufficientTokens}
        onClose={() => setShowInsufficientTokens(false)}
        tokensRemaining={tokenErrorInfo.tokensRemaining}
        actionName="Get Me Started"
      />
    </Container>
  )
}
