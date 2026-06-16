'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import * as Diff from 'diff'
import {
  Sparkles,
  Edit,
  Wand2,
  PenLine,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  SlidersHorizontal,
  CheckCircle,
  Copy,
  FileCheck,
  ArrowRight,
  User,
} from 'lucide-react'
import {
  Badge,
  Card,
  Button,
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
  ProgressBar,
} from '@/lib/design-system'
import { WarningConfirmationDialog } from '@/lib/design-system/components/overlays'
import {
  ORDERED_VISION_CATEGORIES,
  getVisionCategory,
  visionToRecordingKey,
  META_CATEGORY_KEYS,
  type LifeCategoryKey,
  type VisionCategoryKey,
} from '@/lib/design-system/vision-categories'

function recordingKeyForVisionCategory(key: VisionCategoryKey): LifeCategoryKey {
  return (META_CATEGORY_KEYS as readonly string[]).includes(key) ? 'fun' : (key as LifeCategoryKey)
}
import { createClient } from '@/lib/supabase/client'
import {
  updateDraftCategory,
  commitDraft,
  getCategoriesChangedFromActive,
  normalizeVisionCategoryText,
  type VisionData,
} from '@/lib/life-vision/draft-helpers'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { normalizeProfileVersionFromRpc } from '@/lib/profile/profile-version-from-rpc'
import { getBookendTemplate } from '@/lib/viva/bookend-templates'

type SourceMode = 'fresh' | 'refine_active' | 'iterate_draft'

export default function UnifiedCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.category as string
  const supabase = createClient()
  const { draftId, activeVisionId, visions, refreshVisions } = useLifeVisionStudio()
  const isMetaCategory = (META_CATEGORY_KEYS as readonly string[]).includes(categoryKey)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const [draftVision, setDraftVision] = useState<VisionData | null>(null)
  const [activeVision, setActiveVision] = useState<VisionData | null>(null)
  const [showDraftBanner, setShowDraftBanner] = useState(true)
  const [showFreshConfirm, setShowFreshConfirm] = useState(false)
  const [isResettingDraft, setIsResettingDraft] = useState(false)
  const [isCommittingDraft, setIsCommittingDraft] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)

  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null)
  const [includeProfile, setIncludeProfile] = useState(true)
  const [includeActiveReference, setIncludeActiveReference] = useState(true)
  const [manualText, setManualText] = useState('')
  const [manualViewMode, setManualViewMode] = useState<'edit' | 'highlight'>('edit')
  const [showManualCurrent, setShowManualCurrent] = useState(true)
  const [showManualNew, setShowManualNew] = useState(true)
  const hasActiveContent = !!(activeVision && (activeVision[categoryKey as keyof VisionData] as string)?.trim())

  // Profile mode state
  const [fullProfile, setFullProfile] = useState<any>(null)
  /** From `get_profile_version_number` RPC — never read `user_profiles.version_number` for display */
  const [profileVersionFromRpc, setProfileVersionFromRpc] = useState<number | null>(null)
  const [profileData, setProfileData] = useState<{ story: string; hasStory: boolean; state: string; hasStateData: boolean } | null>(null)
  const [getMeStartedText, setGetMeStartedText] = useState('')
  const [vivaSteeringText, setVivaSteeringText] = useState('')
  const [inspirationQuestions, setInspirationQuestions] = useState<string[]>([])
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false)
  const [showInspirationQuestions, setShowInspirationQuestions] = useState(false)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenErrorInfo, setTokenErrorInfo] = useState<{ tokensRemaining?: number }>({})

  // Shared state
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [previousRefinement, setPreviousRefinement] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)

  // Update method choice (VIVA vs Manual) — only shown when active content exists
  const [updateMethod, setUpdateMethod] = useState<'viva' | 'manual' | null>(null)

  // VIVA generation mode: add to existing or complete rewrite (null = not yet chosen, cards expanded)
  const [vivaGenerateMode, setVivaGenerateMode] = useState<'add' | 'rewrite' | null>(null)
  const [showGenModeCards, setShowGenModeCards] = useState(true)
  const [showInstructionsSection, setShowInstructionsSection] = useState(true)
  const instructionsSectionRef = useRef<HTMLDivElement>(null)

  // Manual path state
  const [manualStep, setManualStep] = useState<'write' | 'proofread' | 'polish'>('write')
  const [proofreadEdits, setProofreadEdits] = useState<Array<{ original: string; suggested: string; reason: string }>>([])
  const [editSelections, setEditSelections] = useState<Record<number, boolean>>({})
  const [proofreadLoading, setProofreadLoading] = useState(false)
  const [polishText, setPolishText] = useState('')
  const [polishViewMode, setPolishViewMode] = useState<'edit' | 'highlight'>('edit')

  const categoryGridRef = useRef<HTMLDivElement>(null)
  const compareSectionRef = useRef<HTMLElement | null>(null)

  const category = getVisionCategory(categoryKey as VisionCategoryKey)
  // Full vision strip: Forward + 12 life areas + Conclusion (matches vision document order)
  const allCategories = ORDERED_VISION_CATEGORIES.filter(
    c => !(META_CATEGORY_KEYS as readonly string[]).includes(c.key)
  )
  const lifeCategoryKeys = allCategories.map(c => c.key)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const currentCategoryLabel = category?.label ?? ''

  const changedFromActive = useMemo(
    () => getCategoriesChangedFromActive(activeVision, draftVision, lifeCategoryKeys),
    [activeVision, draftVision, lifeCategoryKeys],
  )

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

  const loadData = async (overrideDraftId?: string) => {
    if (!user) return
    const effectiveDraftId = overrideDraftId ?? draftId
    setLoading(true)
    setError(null)
    setProfileVersionFromRpc(null)
    setSourceMode(null)

    try {
      const queries: Promise<any>[] = []

      // Load draft vision
      if (effectiveDraftId) {
        queries.push(
          Promise.resolve(supabase.from('vision_versions').select('*').eq('id', effectiveDraftId).single())
            .then(r => ({ type: 'draft', data: r.data }))
        )
      } else {
        queries.push(Promise.resolve({ type: 'draft', data: null }))
      }

      // Load active vision
      if (activeVisionId) {
        queries.push(
          Promise.resolve(supabase.from('vision_versions').select('*').eq('id', activeVisionId).single())
            .then(r => ({ type: 'active', data: r.data }))
        )
      } else {
        queries.push(Promise.resolve({ type: 'active', data: null }))
      }

      // Load profile
      queries.push(
        Promise.resolve(supabase.from('user_profiles').select('*')
          .eq('user_id', user.id).eq('is_active', true).eq('is_draft', false).maybeSingle())
          .then(r => ({ type: 'profile', data: r.data }))
      )

      // Load category state (per-category draft data)
      queries.push(
        Promise.resolve(supabase.from('vision_new_category_state').select('*')
          .eq('user_id', user.id).eq('category', categoryKey).maybeSingle())
          .then(r => ({ type: 'categoryState', data: r.data }))
      )

      const results = await Promise.all(queries)

      const draftResult = results.find(r => r.type === 'draft')?.data
      const activeResult = results.find(r => r.type === 'active')?.data
      const profileResult = results.find(r => r.type === 'profile')?.data
      const categoryStateResult = results.find(r => r.type === 'categoryState')?.data

      const activeValue = activeResult ? ((activeResult[categoryKey as keyof VisionData] as string) || '') : ''
      const draftValue = draftResult ? ((draftResult[categoryKey as keyof VisionData] as string) || '') : ''

      if (draftResult) {
        setDraftVision(draftResult)
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
        // Only pre-fill manualText if draft truly differs from active (prior generation)
        if (draftValue.trim() && draftValue.trim() !== activeValue.trim()) {
          setManualText(draftValue)
        } else {
          setManualText('')
        }
      } else {
        setActiveVision(null)
      }

      if (profileResult) {
        setFullProfile(profileResult)
        const { data: rpcProfileVersion, error: rpcProfileVersionError } = await supabase.rpc(
          'get_profile_version_number',
          { p_profile_id: profileResult.id }
        )
        if (rpcProfileVersionError) {
          console.error('get_profile_version_number:', rpcProfileVersionError)
        }
        setProfileVersionFromRpc(normalizeProfileVersionFromRpc(rpcProfileVersion))
        const storyField = `${categoryKey}_story`
        const stateField = `state_${categoryKey}`
        const story = profileResult[storyField] || ''
        const state = profileResult[stateField] || ''
        setProfileData({ story, hasStory: story.trim().length > 0, state, hasStateData: !!state })
        setIncludeProfile(!!(story.trim() || state.trim()))

        const filtered = getFilteredQuestionsForCategory(categoryKey, profileResult)
        setInspirationQuestions(filtered.map(q => q.text))
      } else {
        setFullProfile(null)
        setProfileVersionFromRpc(null)
        setProfileData(null)
        setInspirationQuestions([])
        setIncludeProfile(false)
      }

      // Restore non-vision WIP (starter/steering). Skip stale category_vision_text
      // that matches active — it must not re-hydrate the editor or checkmarks.
      if (categoryStateResult) {
        if (categoryStateResult.get_me_started_text) setGetMeStartedText(categoryStateResult.get_me_started_text)
        if (categoryStateResult.imagination_text) setVivaSteeringText(categoryStateResult.imagination_text)
        const wipText = categoryStateResult.category_vision_text?.trim() ?? ''
        const activeNorm = normalizeVisionCategoryText(activeValue)
        const draftNorm = normalizeVisionCategoryText(draftValue)
        if (wipText && wipText !== activeNorm && wipText !== draftNorm) {
          setManualText(categoryStateResult.category_vision_text)
          setCurrentRefinement(categoryStateResult.category_vision_text)
        }
      }

      // Pick a default sourceMode based on what content exists for this category.
      // Priority: a working draft (with content distinct from active) → iterate the draft;
      // otherwise an active version → refine from it; otherwise generate fresh.
      const activeText = activeResult ? ((activeResult[categoryKey as keyof VisionData] as string) || '') : ''
      const draftText = draftResult ? ((draftResult[categoryKey as keyof VisionData] as string) || '') : ''
      const hasDraftCat = !!(draftText.trim() && draftText.trim() !== activeText.trim())
      const hasActiveCat = !!activeText.trim()
      setSourceMode(hasDraftCat ? 'iterate_draft' : hasActiveCat ? 'refine_active' : 'fresh')
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Profile mode: Get Me Started
  const handleGetMeStarted = async () => {
    if (isMetaCategory) {
      const perspective = activeVision?.perspective || fullProfile?.perspective || 'singular'
      const bookend = getBookendTemplate('high', perspective as 'singular' | 'plural')
      setGetMeStartedText(categoryKey === 'forward' ? bookend.forward : bookend.conclusion)
      return
    }

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

  // Make sure a draft exists for refine/iterate paths.
  // Returns the draft vision to use, or null if creation failed.
  const ensureDraftForRefine = async (): Promise<VisionData | null> => {
    if (draftVision) return draftVision
    if (!activeVisionId) return null
    const res = await fetch('/api/vision/draft/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visionId: activeVisionId }),
    })
    if (!res.ok) throw new Error('Failed to create draft')
    const json = await res.json().catch(() => ({}))
    const newDraft: VisionData | null = json?.draft ?? json ?? null
    if (newDraft && newDraft.id) {
      setDraftVision(newDraft)
      await refreshVisions()
      return newDraft
    }
    await refreshVisions()
    return null
  }

  const handleEditWithViva = async () => {
    const mode: SourceMode | null = updateMethod === 'viva'
      ? (vivaGenerateMode === 'add' ? 'refine_active' : vivaGenerateMode === 'rewrite' ? 'fresh' : null)
      : sourceMode
    if (!mode) return

    const activeVal = activeVision ? ((activeVision[categoryKey as keyof VisionData] as string) || '') : ''
    const draftVal = draftVision ? ((draftVision[categoryKey as keyof VisionData] as string) || '') : ''

    const profileHasData = !!(profileData?.state?.trim() || profileData?.story?.trim())
    const hasGenerateSignal =
      getMeStartedText.trim() ||
      vivaSteeringText.trim() ||
      (includeProfile && profileHasData)

    if (mode === 'refine_active' && !activeVal.trim()) return
    if (mode === 'iterate_draft' && !draftVal.trim() && !activeVal.trim()) return
    if (mode === 'fresh' && !hasGenerateSignal) return

    compareSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    saveCategoryState()

    const priorManual = manualText
    if (priorManual.trim()) setPreviousRefinement(priorManual)
    setIsGenerating(true)
    setCurrentRefinement('')
    setManualText('')
    setError(null)

    try {
      // "Complete Rewrite" mode for refine/iterate: use fresh generation path instead of refine
      const useRewriteMode = vivaGenerateMode === 'rewrite' && (mode === 'refine_active' || mode === 'iterate_draft')

      if ((mode === 'refine_active' || mode === 'iterate_draft') && !useRewriteMode) {
        const targetDraft = await ensureDraftForRefine()
        if (!targetDraft) throw new Error('No draft available to refine into')

        const baseForRefine = mode === 'refine_active'
          ? activeVal
          : (draftVal || activeVal)

        if (!baseForRefine.trim()) throw new Error('No baseline text to refine')

        const referenceForRefine =
          mode === 'iterate_draft' &&
          includeActiveReference &&
          activeVal.trim() &&
          activeVal.trim() !== baseForRefine.trim()
            ? activeVal
            : undefined
        const activeVersionNumber = activeVision?.version_number
          ?? visions.filter(v => !v.is_draft).find(v => v.is_active)?.version_number
          ?? null
        const referenceLabel =
          mode === 'iterate_draft' && referenceForRefine
            ? `ACTIVE VISION${activeVersionNumber != null ? ` V${activeVersionNumber}` : ''} (REFERENCE)`
            : undefined

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('perspective')
          .eq('user_id', user.id)
          .single()

        const pc =
          includeProfile && profileData
            ? {
                state: profileData.state?.trim() || undefined,
                story: profileData.story?.trim() || undefined,
              }
            : undefined

        const response = await fetch('/api/viva/refine-category-weave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visionId: targetDraft.id,
            category: categoryKey,
            currentVisionText: baseForRefine,
            refinement: { notes: vivaSteeringText.trim() || undefined },
            weave: { enabled: false as const },
            perspective: profile?.perspective || 'singular',
            profileContext: pc && (pc.state || pc.story) ? pc : undefined,
            referenceText: referenceForRefine,
            referenceLabel,
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
              if (data.content) {
                fullText += data.content
                setCurrentRefinement(fullText)
                setManualText(fullText)
              }
            }
          }
        }
        return
      }

      // mode === 'fresh' OR "Complete Rewrite" mode — full generation from profile + starter + imagination.
      const stateField = `state_${categoryKey}`
      const storyField = `${categoryKey}_story`
      const currentStateText = includeProfile ? (fullProfile?.[stateField] || '') : ''
      const profileStoryText = includeProfile ? (fullProfile?.[storyField] || '') : ''

      const response = await fetch('/api/viva/category-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryKey,
          getMeStartedText,
          imaginationText: vivaSteeringText,
          currentStateText,
          profileStoryText,
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
          setManualText(fullText)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run VIVA')
    } finally {
      setIsGenerating(false)
      if (updateMethod === 'viva') {
        setShowInstructionsSection(false)
      }
    }
  }

  // Category navigation
  const isFirstCategory = currentIndex === 0
  const isLastCategory = currentIndex === allCategories.length - 1
  const canReviewFromLast = isLastCategory && !!draftVision && changedFromActive.length > 0

  const handleCategoryChange = (key: string) => {
    setGetMeStartedText('')
    setVivaSteeringText('')
    setPreviousRefinement(null)
    setManualText('')
    setUpdateMethod(null)
    setManualStep('write')
    setProofreadEdits([])
    setEditSelections({})
    setPolishText('')
    setVivaGenerateMode(null)
    setShowGenModeCards(true)
    setShowInstructionsSection(true)
    router.push(`/life-vision/new/${key}`)
  }

  const saveManualEdit = async () => {
    if (!draftVision || !manualText.trim()) return

    const scrollPosition = window.scrollY
    setIsDraftSaving(true)
    try {
      const updatedDraft = await updateDraftCategory(draftVision.id, categoryKey, manualText)
      setDraftVision(updatedDraft)

      await refreshVisions()
      setTimeout(() => window.scrollTo({ top: scrollPosition, behavior: 'instant' as ScrollBehavior }), 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsDraftSaving(false)
    }
  }

  const handleStartFresh = async () => {
    if (!activeVisionId || !user) return
    setIsResettingDraft(true)
    try {
      const res = await fetch('/api/vision/draft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: activeVisionId, replaceExisting: true }),
      })
      const body = await res.json().catch(() => ({} as { error?: string; draft?: VisionData }))
      if (!res.ok) {
        throw new Error(body?.error || `Failed to create draft (${res.status})`)
      }
      const newDraft = body.draft as VisionData | undefined
      if (!newDraft?.id) {
        throw new Error('Failed to create fresh draft')
      }

      await refreshVisions()
      setManualText('')
      setCurrentRefinement('')
      setPreviousRefinement(null)
      setGetMeStartedText('')
      setVivaSteeringText('')
      setShowDraftBanner(false)
      setDraftVision(newDraft)
      await loadData(newDraft.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start fresh')
    } finally {
      setIsResettingDraft(false)
      setShowFreshConfirm(false)
    }
  }

  const handleCommitDraft = async () => {
    if (!draftVision) return
    setIsCommittingDraft(true)
    setCommitError(null)
    try {
      const vision = await commitDraft(draftVision.id)
      await refreshVisions()
      router.push(`/life-vision/${vision.id}`)
    } catch (err) {
      console.error('Error committing draft:', err)
      setCommitError(err instanceof Error ? err.message : 'Failed to commit draft')
      setIsCommittingDraft(false)
    }
  }

  const saveCategoryState = async () => {
    if (!user) return
    const hasData = getMeStartedText.trim() || vivaSteeringText.trim() || manualText.trim()
    if (!hasData) return

    try {
      await supabase
        .from('vision_new_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          get_me_started_text: getMeStartedText || null,
          imagination_text: vivaSteeringText || null,
          category_vision_text: manualText || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,category' })

    } catch (err) {
      console.error('Failed to save category state:', err)
    }
  }

  const goToPreviousCategory = () => {
    saveCategoryState()
    if (currentIndex > 0) handleCategoryChange(allCategories[currentIndex - 1].key)
  }

  const goToNextCategory = () => {
    saveCategoryState()
    if (currentIndex < allCategories.length - 1) {
      handleCategoryChange(allCategories[currentIndex + 1].key)
    } else if (canReviewFromLast && draftVision) {
      router.push(`/life-vision/${draftVision.id}`)
    }
  }

  // Proofread handler
  const handleProofread = async () => {
    if (!manualText.trim()) return
    setProofreadLoading(true)
    setProofreadEdits([])
    setEditSelections({})
    setError(null)

    try {
      const response = await fetch('/api/viva/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualText, category: categoryKey }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 402) {
          setTokenErrorInfo({ tokensRemaining: errorData.tokensRemaining })
          setShowInsufficientTokens(true)
          setProofreadLoading(false)
          return
        }
        throw new Error(errorData.error || `Proofread failed (${response.status})`)
      }

      const data = await response.json()
      const edits = data.edits || []
      setProofreadEdits(edits)
      // Default all edits to "apply"
      const selections: Record<number, boolean> = {}
      edits.forEach((_: any, i: number) => { selections[i] = true })
      setEditSelections(selections)
      setManualStep('proofread')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proofread')
    } finally {
      setProofreadLoading(false)
    }
  }

  // Apply selected proofread edits to produce polished text
  const applyProofreadEdits = () => {
    let polished = manualText
    // Apply edits in reverse order of their position to preserve indices
    const editsToApply = proofreadEdits
      .map((edit, i) => ({ ...edit, index: i }))
      .filter(edit => editSelections[edit.index])
      .sort((a, b) => {
        const posA = polished.lastIndexOf(a.original)
        const posB = polished.lastIndexOf(b.original)
        return posB - posA
      })

    for (const edit of editsToApply) {
      polished = polished.replace(edit.original, edit.suggested)
    }

    setPolishText(polished)
    setPolishViewMode('edit')
    setManualStep('polish')
  }

  // Diff renderers
  const normalizeText = (text: string) => text.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim()

  const renderAddedDiff = (oldText: string, newText: string) => {
    const diff = Diff.diffSentences(oldText, newText)
    return (
      <div className="space-y-2 w-full">
        <div className="w-full px-4 py-3 bg-[#101010] border-2 border-neutral-800 rounded-lg min-h-[200px] whitespace-pre-wrap text-sm leading-[1.75] text-neutral-100">
          {diff.map((part, i) => {
            if (part.removed) return null
            if (part.added) return <span key={i} className="bg-green-500/30 text-green-200 px-1 rounded">{part.value}</span>
            return <span key={i}>{part.value}</span>
          })}
        </div>
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
  const isFirstTime = !activeVision || !activeValue.trim()
  const gridMode = draftVision?.parent_id ? 'draft' : 'completion'

  const nonDraftVisions = visions.filter(v => !v.is_draft)
  const activeVisionVersion = nonDraftVisions.find(v => v.is_active)?.version_number ?? nonDraftVisions.length
  const draftVersionLabel = `V${nonDraftVisions.length + 1}`
  const activeVersionLabel = `V${activeVisionVersion}`

  // Resolve the version this draft was forked from so the "Continue Draft" banner
  // can tell the user *which* version they're refining (e.g. "based on Version 2").
  const draftParentVersion = draftVision?.parent_id
    ? nonDraftVisions.find(v => v.id === draftVision.parent_id) ?? null
    : null

  const draftCategoryText = draftVision ? ((draftVision[categoryKey as keyof VisionData] as string) || '') : ''
  const hasDraftCat = !!(draftCategoryText.trim() && draftCategoryText.trim() !== activeValue.trim())
  const canRefineActive = !!activeValue.trim()
  const canIterateDraft = hasDraftCat

  const profileHasData = !!(profileData?.state?.trim() || profileData?.story?.trim())
  const hasGenerateSignal =
    !!getMeStartedText.trim() ||
    !!vivaSteeringText.trim() ||
    (includeProfile && profileHasData)

  const canRunViva =
    updateMethod === 'viva'
      ? (vivaGenerateMode === null ? false : vivaGenerateMode === 'rewrite' ? hasGenerateSignal : canRefineActive)
      : sourceMode === 'fresh'
        ? hasGenerateSignal
        : sourceMode === 'refine_active'
          ? canRefineActive
          : sourceMode === 'iterate_draft'
            ? canIterateDraft
            : false

  const getMeStartedPlaceholder = isFirstTime || isMetaCategory
    ? 'Your starter text will appear here...'
    : includeProfile && profileHasData
      ? 'Tap Get Me Started for a contrast-flip starter from your profile, then edit here.'
      : 'Your starter text will appear here...'

  const effectiveMode = updateMethod === 'viva'
    ? (vivaGenerateMode === 'add' ? 'refine_active' : vivaGenerateMode === 'rewrite' ? 'fresh' : null)
    : sourceMode

  const vivaSteeringPlaceholder = effectiveMode === 'fresh'
    ? 'Is anything missing? Add it here...'
    : 'Tell VIVA how to refine this section...'

  const actionLabel =
    effectiveMode === 'refine_active'
      ? `Refine ${category.label} with VIVA`
      : effectiveMode === 'iterate_draft'
        ? `Iterate ${category.label} with VIVA`
        : `Create ${category.label} with VIVA`

  const generatingLabel =
    effectiveMode === 'refine_active'
      ? 'Refining with VIVA...'
      : effectiveMode === 'iterate_draft'
        ? 'Iterating with VIVA...'
        : 'Generating with VIVA...'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Category Grid */}
        <div ref={categoryGridRef}>
          <CategoryGrid
            categories={allCategories}
            activeCategory={categoryKey}
            refinedCategories={changedFromActive}
            completedCategories={gridMode === 'completion' ? changedFromActive : undefined}
            onCategoryClick={handleCategoryChange}
            mode={gridMode as any}
            lifeVisionCategoryStrip
            title={isFirstTime ? 'Life Vision Categories' : 'Choose a Category to Update'}
            bleedClassName="max-md:-mx-4"
            pillLabel="scroll"
            desktopColumnCount={6}
          />
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 -mt-2">
          <ProgressBar
            value={Math.round((changedFromActive.length / allCategories.length) * 100)}
            variant="accent"
            className="h-2 flex-1"
          />
          <span className="text-xs text-neutral-400 whitespace-nowrap">
            {changedFromActive.length} of {allCategories.length} · {Math.round((changedFromActive.length / allCategories.length) * 100)}%
          </span>
        </div>

        {/* Continue Draft / Start Fresh Banner — own card above the category card */}
        {showDraftBanner && draftVision && changedFromActive.length > 0 && (
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-accent-500" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-500">
                  Draft In Progress
                </h3>
              </div>
              <p className="text-sm text-neutral-300">
                You have a draft in progress
                {draftParentVersion && (
                  <>
                    {' '}based on{' '}
                    <span className="font-semibold text-white">
                      Version {draftParentVersion.version_number}
                    </span>
                    {draftParentVersion.is_active && (
                      <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-500 bg-primary-500/10">
                        Active
                      </span>
                    )}
                  </>
                )}
                {' '}with <span className="font-semibold text-white">{changedFromActive.length} of {allCategories.length}</span> categories updated.
              </p>
              {commitError && (
                <p className="text-xs text-red-400">{commitError}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCommitDraft}
                  disabled={isCommittingDraft}
                >
                  {isCommittingDraft ? (
                    <><Spinner size="sm" className="mr-1.5" />Committing...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-1.5" />Commit as Active</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDraftBanner(false)}
                >
                  Continue Editing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFreshConfirm(true)}
                >
                  Start Fresh
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Overarching Category Card */}
        <Card>
          {/* Card Header */}
          <div className="mb-6 flex items-center gap-3 md:gap-4">
            <div className="h-px flex-1 bg-neutral-800" />
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500 md:h-8 md:w-8">
                <Icon icon={category.icon} size="xs" color="#000000" />
              </div>
              <h3 className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-400">
                {category.label}
              </h3>
            </div>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          {/* Method Choice Cards — Update with VIVA vs Update Myself */}
          {!isFirstTime && sourceMode && (() => {
            const methodCards = [
              {
                key: 'viva' as const,
                icon: Wand2,
                title: 'Update with VIVA',
                description: 'Let VIVA help you refine, expand, or rewrite this section using AI.',
                iconColor: 'text-accent-100',
                bgColor: 'bg-accent-700/20',
              },
              {
                key: 'manual' as const,
                icon: User,
                title: 'Update Myself',
                description: 'Write or edit your vision text directly. VIVA will proofread for vibrational grammar when you\'re done.',
                iconColor: 'text-secondary-500',
                bgColor: 'bg-secondary-500/20',
              },
            ]
            const selectedCard = updateMethod ? methodCards.find(c => c.key === updateMethod) : null
            const isCollapsed = !!selectedCard

            return (
            <div className={updateMethod ? 'mb-6' : ''}>
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => {
                    setUpdateMethod(null)
                    setVivaGenerateMode(null)
                    setShowGenModeCards(true)
                  }}
                  className="w-full relative flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-colors"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Step 1 · Update Method</h4>
                  <p className="text-sm font-medium text-white mt-1 flex items-center gap-2">
                    {(() => { const SelIcon = selectedCard.icon; return <SelIcon className="w-4 h-4 text-primary-500" /> })()}
                    {selectedCard.title}
                  </p>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  </div>
                </button>
              ) : (
              <>
              <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 text-center mb-3">Step 1 · Update Method</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {methodCards.map(card => {
                  const CardIcon = card.icon
                  return (
                    <div
                      key={card.key}
                      role="button"
                      tabIndex={0}
                      onClick={async () => {
                        setUpdateMethod(card.key)
                        if (card.key === 'viva') {
                          setVivaSteeringText('')
                        }
                        if (card.key === 'manual') {
                          setManualStep('write')
                          setManualText('')
                          setManualViewMode('edit')
                          setProofreadEdits([])
                          setEditSelections({})
                          setPolishText('')
                          if (!draftVision) await ensureDraftForRefine()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setUpdateMethod(card.key)
                        }
                      }}
                      className="group relative rounded-2xl border-2 border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:-translate-y-0.5 cursor-pointer p-4 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bgColor} ${card.iconColor}`}>
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-200">
                            {card.title}
                          </h3>
                          <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              </>
              )}
            </div>
            )
          })()}

          {/* Source Mode Cards — only shown for first-time users (no active content yet) */}
          {sourceMode && isFirstTime && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(() => {
                  const profileLabel = `Profile${profileVersionFromRpc != null ? ` v${profileVersionFromRpc}` : ''}`
                  const activeLabel = `Vision V${activeVisionVersion}`
                  const draftLabel = `Draft V${nonDraftVisions.length + 1}`
                  type Tag = {
                    key: 'Profile' | 'Active' | 'Draft'
                    label: string
                    showActiveBadge?: boolean
                    on: boolean
                    locked: boolean
                    onToggle?: () => void
                  }
                  const cards: Array<{
                    key: SourceMode
                    icon: typeof Wand2
                    title: string
                    description: string
                    disabled: boolean
                    disabledReason: string
                    tags: Tag[]
                  }> = [
                    {
                      key: 'fresh',
                      icon: Wand2,
                      title: 'Generate Fresh',
                      description: 'Your notes below are the primary signal. VIVA writes a new draft, enhanced by your profile.',
                      disabled: false,
                      disabledReason: '',
                      tags: [
                        { key: 'Profile', label: profileLabel, on: includeProfile, locked: false, onToggle: () => setIncludeProfile(p => !p) },
                      ],
                    },
                    {
                      key: 'refine_active',
                      icon: RefreshCw,
                      title: 'Refine Active',
                      description: 'Your notes below are the primary signal. VIVA reshapes your active vision, enhanced by your profile.',
                      disabled: !canRefineActive,
                      disabledReason: 'No active vision text for this category yet.',
                      tags: [
                        { key: 'Profile', label: profileLabel, on: includeProfile, locked: false, onToggle: () => setIncludeProfile(p => !p) },
                        { key: 'Active', label: activeLabel, showActiveBadge: true, on: true, locked: true },
                      ],
                    },
                    {
                      key: 'iterate_draft',
                      icon: PenLine,
                      title: 'Iterate on Draft',
                      description: 'Your notes below are the primary signal. VIVA iterates your draft, with active and profile for context.',
                      disabled: !canIterateDraft,
                      disabledReason: 'No draft yet. Generate or refine first.',
                      tags: [
                        { key: 'Profile', label: profileLabel, on: includeProfile, locked: false, onToggle: () => setIncludeProfile(p => !p) },
                        { key: 'Active', label: activeLabel, showActiveBadge: true, on: includeActiveReference, locked: false, onToggle: () => setIncludeActiveReference(p => !p) },
                        { key: 'Draft', label: draftLabel, on: true, locked: true },
                      ],
                    },
                  ]
                  const tagOnStyles: Record<Tag['key'], string> = {
                    Profile: 'border-[#00FFFF]/40 bg-[#00FFFF]/10 text-[#00FFFF]',
                    Active: 'border-primary-500/40 bg-primary-500/10 text-primary-500',
                    Draft: 'border-accent-500/40 bg-accent-500/10 text-accent-500',
                  }
                  const tagOffStyles = 'border-neutral-700 bg-neutral-900/60 text-neutral-500'

                  return cards.map(card => {
                    const isSelected = sourceMode === card.key
                    const CardIcon = card.icon
                    const interactive = isSelected && !card.disabled
                    return (
                      <div
                        key={card.key}
                        role="button"
                        tabIndex={card.disabled ? -1 : 0}
                        aria-pressed={isSelected}
                        onClick={() => !card.disabled && setSourceMode(card.key)}
                        onKeyDown={(e) => {
                          if (card.disabled) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSourceMode(card.key)
                          }
                        }}
                        title={card.disabled ? card.disabledReason : ''}
                        className={`group relative text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                          card.disabled
                            ? 'border-neutral-800 bg-neutral-900/40 opacity-50 cursor-not-allowed'
                            : isSelected
                              ? 'border-primary-500 bg-primary-500/5 shadow-[0_0_0_1px_rgba(57,255,20,0.15)] -translate-y-0.5'
                              : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:-translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-primary-500 text-black' : 'bg-neutral-800 text-neutral-300 group-hover:text-white'
                          }`}>
                            <CardIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                                {card.title}
                              </h3>
                              {isSelected && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-500">Selected</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                              {card.disabled ? card.disabledReason : card.description}
                            </p>
                            {!card.disabled && (
                              <>
                              <div className="flex flex-wrap items-center gap-1 mt-2">
                                <span className="text-[10px] uppercase tracking-wide text-neutral-500 mr-0.5">Uses:</span>
                                {card.tags.map(tag => {
                                  const baseClasses = `inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors ${
                                    tag.on ? tagOnStyles[tag.key] : tagOffStyles
                                  }`
                                  const content = (
                                    <>
                                      {tag.label}
                                      {tag.showActiveBadge && tag.on && (
                                        <span className="rounded-full bg-primary-500 text-black px-1 text-[9px] font-bold uppercase tracking-wide">Active</span>
                                      )}
                                      {!tag.on && <span className="text-[9px] uppercase">off</span>}
                                    </>
                                  )
                                  if (interactive && !tag.locked && tag.onToggle) {
                                    return (
                                      <button
                                        key={tag.key}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          tag.onToggle?.()
                                        }}
                                        className={`${baseClasses} cursor-pointer hover:opacity-80`}
                                        title={`Toggle ${tag.key} context`}
                                      >
                                        {content}
                                      </button>
                                    )
                                  }
                                  return (
                                    <span
                                      key={tag.key}
                                      className={`${baseClasses} ${interactive && tag.locked ? 'opacity-90' : ''}`}
                                      title={interactive && tag.locked ? `${tag.key} is required for this mode` : ''}
                                    >
                                      {content}
                                    </span>
                                  )
                                })}
                              </div>
                              {interactive && (
                                <p className="mt-1 text-[10px] italic text-neutral-500">
                                  Click to add or remove sources
                                </p>
                              )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* VIVA Generate Mode: Add Only vs Complete Rewrite */}
          {(updateMethod === 'viva' || (isFirstTime && sourceMode && sourceMode !== 'fresh')) && (() => {
            const genModes = [
              { key: 'add' as const, title: 'Add Only', description: 'Weave new content into existing text' },
              { key: 'rewrite' as const, title: 'Complete Rewrite', description: 'Generate a full replacement' },
            ]
            const selectedGenMode = vivaGenerateMode ? genModes.find(m => m.key === vivaGenerateMode) : null
            const isCollapsed = !!selectedGenMode && !showGenModeCards

            return (
            <div className={vivaGenerateMode ? 'mb-6' : ''}>
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => setShowGenModeCards(true)}
                  className="w-full relative flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-colors"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">{updateMethod === 'viva' ? 'Step 2 · ' : ''}Generation Mode</h4>
                  <p className="text-sm font-medium text-white mt-1">{selectedGenMode.title}</p>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  </div>
                </button>
              ) : (
              <>
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 text-center mb-3">{updateMethod === 'viva' ? 'Step 2 · ' : ''}Generation Mode</h4>
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {genModes.map(mode => {
                    const isSelected = vivaGenerateMode === mode.key
                    return (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => {
                          setVivaGenerateMode(mode.key)
                          setShowGenModeCards(false)
                        }}
                        className={`text-left rounded-xl border-2 p-3 transition-all duration-200 ${
                          isSelected
                            ? 'border-accent-500 bg-accent-500/5'
                            : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                        }`}
                      >
                        <h5 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {mode.title}
                        </h5>
                        <p className="text-xs text-neutral-400 mt-0.5">{mode.description}</p>
                      </button>
                    )
                  })}
                </div>
              </>
              )}
            </div>
            )
          })()}

          {/* Inputs — fresh mode shows starter + imagination, refine modes show notes only. */}
          {((updateMethod === 'viva' && vivaGenerateMode) || isFirstTime) && (
          <section ref={instructionsSectionRef}>
            {/* VIVA path: collapsible after generation */}
            {updateMethod === 'viva' && !showInstructionsSection ? (
              <button
                type="button"
                onClick={() => setShowInstructionsSection(true)}
                className="w-full relative flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-colors"
              >
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Step 3 · Instructions</h4>
                <p className="text-sm font-medium text-white mt-1">
                  {vivaSteeringText.trim() ? vivaSteeringText.trim().slice(0, 60) + (vivaSteeringText.trim().length > 60 ? '…' : '') : 'No instructions provided'}
                </p>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            ) : (
            <div>
              {sourceMode === 'fresh' && updateMethod !== 'viva' && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-white text-center mb-2">
                      Starter Text
                    </h2>
                    <p className="text-center text-sm text-neutral-400 mb-3 leading-relaxed">
                      {isMetaCategory
                        ? `Tap Get Me Started and VIVA will generate the first draft of the ${categoryKey} section of your Life Vision.`
                        : `Tap Get Me Started and VIVA will generate the first draft of the ${category?.label.toLowerCase() || categoryKey} section of your Life Vision.`}
                    </p>

                    <div className="relative">
                      <VIVALoadingOverlay
                        isVisible={isGeneratingStarter && !getMeStartedText.trim()}
                        messages={isMetaCategory
                          ? ['Personalizing your vision text...', 'Weaving in your life details...', 'Building your starting point...']
                          : [`VIVA is reading your ${category.label.toLowerCase()} profile...`, 'Activating your vision language...', 'Building your starting point...']}
                        cycleDuration={3000}
                        showProgressBar={false}
                        size="sm"
                        className="rounded-xl"
                      />
                      <RecordingTextarea
                        value={getMeStartedText}
                        onChange={setGetMeStartedText}
                        placeholder={getMeStartedPlaceholder}
                        className="min-h-[120px] w-full !bg-[#101010] !border !border-neutral-800 focus-within:!border-accent-500"
                        rows={5}
                        storageFolder="lifeVision"
                        recordingPurpose="quick"
                        category={visionToRecordingKey(recordingKeyForVisionCategory(categoryKey as VisionCategoryKey))}
                        instanceId="get-me-started"
                        hideClear
                      />
                    </div>
                    <div className="flex justify-center mt-3">
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
                  </div>

                  <div className="py-6"><div className="h-px bg-neutral-800" /></div>
                </>
              )}

              <div>
                {updateMethod === 'viva' ? (
                  <>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 text-center mb-3">Step 3 · Instructions</h4>
                    <p className="text-center text-sm text-neutral-400 mb-3 leading-relaxed">
                      Tell VIVA how to refine this section. (Optional — VIVA can refine without notes too.)
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white text-center mb-2">
                      {effectiveMode === 'fresh' ? 'Unleash Your Imagination' : 'Update Notes'}
                    </h2>
                    <p className="text-center text-sm text-neutral-400 mb-3 leading-relaxed">
                      {effectiveMode === 'fresh'
                        ? 'Add any details, tone, or specifics you want VIVA to weave into your vision. (Optional.)'
                        : 'Tell VIVA how to refine this section. (Optional — VIVA can refine without notes too.)'}
                    </p>
                  </>
                )}

                {/* Inspiration Questions (collapsible) — only for life categories */}
                {!isMetaCategory && inspirationQuestions.length > 0 && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-800/30 p-4 mb-4">
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

                <RecordingTextarea
                  value={vivaSteeringText}
                  onChange={setVivaSteeringText}
                  placeholder={vivaSteeringPlaceholder}
                  className="min-h-[150px] w-full !bg-[#101010] !border !border-neutral-800 focus-within:!border-accent-500"
                  rows={6}
                  storageFolder="lifeVision"
                  recordingPurpose="quick"
                  category={visionToRecordingKey(recordingKeyForVisionCategory(categoryKey as VisionCategoryKey))}
                  instanceId="viva-steering"
                  hideClear
                />
              </div>

              {/* Action button — single CTA. The streamed result lands directly
                  in the Compare panel below, so no duplicate output box here. */}
              <div className="flex justify-center gap-3 pt-6">
                <Button
                  onClick={handleEditWithViva}
                  disabled={isGenerating || !canRunViva}
                  variant="accent"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <><Spinner variant="secondary" size="sm" />{generatingLabel}</>
                  ) : manualText.trim().length >= 50 ? (
                    <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>
                  ) : (
                    <><Wand2 className="w-5 h-5" />{actionLabel}</>
                  )}
                </Button>
                {!isGenerating && manualText.trim() && !draftVision && (
                  (() => {
                    const completedAfterSave = new Set([...changedFromActive, categoryKey])
                    const allComplete = allCategories.every(c => completedAfterSave.has(c.key))

                    if (allComplete) {
                      return (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            saveCategoryState()
                            router.push('/life-vision/new/assembly')
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />Save & Finish
                        </Button>
                      )
                    }

                    const nextIncomplete = allCategories.find(c =>
                      c.key !== categoryKey && !changedFromActive.includes(c.key)
                    )
                    return (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          saveCategoryState()
                          if (nextIncomplete) {
                            handleCategoryChange(nextIncomplete.key)
                          } else {
                            router.push('/life-vision/new')
                          }
                        }}
                      >
                        Save & Continue
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )
                  })()
                )}
              </div>
              <p className="text-center text-xs text-neutral-500 mt-3">
                {manualText.trim().length >= 50
                  ? 'Your draft is ready below. Adjust your instructions and regenerate, or scroll down to review.'
                  : 'Your generated text will appear in the Draft section below for review.'}
              </p>
            </div>
            )}
          </section>
          )}

          {/* Manual Path — Update Myself */}
          {updateMethod === 'manual' && (
            <section>
              {manualStep === 'write' && (
                <div>
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                      Write Your Update
                    </h4>
                    <p className="text-sm text-neutral-400 text-center max-w-md">
                      Edit your vision text below. When you&apos;re done, VIVA will proofread it for vibrational grammar.
                    </p>
                  </div>

                  <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                    {/* Active panel (read-only) */}
                    <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                      <div className="mb-2 flex items-center justify-between gap-3 min-h-[32px]">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Current Active</h5>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                        </div>
                      </div>
                      <AutoResizeTextarea
                        value={activeValue}
                        onChange={() => {}}
                        readOnly
                        className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                        minHeight={200}
                      />
                    </div>

                    {/* Draft panel (editable, starts empty) */}
                    <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Your Draft</h5>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                          {manualViewMode === 'highlight' && normalizeText(manualText) === normalizeText(activeValue) && (
                            <span className="text-[11px] text-neutral-500 italic">No changes to highlight</span>
                          )}
                        </div>
                        <div className="inline-flex rounded-md bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] p-0.5">
                          <button
                            type="button"
                            onClick={() => setManualViewMode('edit')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                              manualViewMode === 'edit' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                            }`}
                          >
                            <Edit className="w-3 h-3 inline mr-1" />Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualViewMode('highlight')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                              manualViewMode === 'highlight' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 inline mr-1" />Highlight
                          </button>
                        </div>
                      </div>
                      {manualViewMode === 'highlight' && manualText.trim() ? (
                        renderAddedDiff(normalizeText(activeValue), normalizeText(manualText))
                      ) : (
                        <AutoResizeTextarea
                          value={manualText}
                          onChange={setManualText}
                          placeholder="Type your updated vision here..."
                          className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                          minHeight={200}
                        />
                      )}
                      {!manualText.trim() && (
                        <div className="mt-3 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManualText(activeValue)}
                          >
                            <Copy className="w-4 h-4 mr-2" />Copy Active to Draft
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Proofread / Save buttons */}
                  <div className="mt-6 flex justify-center gap-3">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={handleProofread}
                      disabled={!manualText.trim() || proofreadLoading}
                    >
                      {proofreadLoading ? (
                        <><Spinner size="sm" className="mr-2" />Proofreading...</>
                      ) : (
                        <><FileCheck className="w-4 h-4 mr-2" />Proofread with VIVA</>
                      )}
                    </Button>
                    <SaveButton
                      saveLabel="Save to Draft"
                      hasUnsavedChanges={!!(draftVision && manualText.trim())}
                      isSaving={isDraftSaving}
                      onClick={saveManualEdit}
                      disabled={!draftVision || !manualText.trim() || proofreadLoading}
                    />
                  </div>
                </div>
              )}

              {manualStep === 'proofread' && (
                <div>
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                      Vibrational Grammar Check
                    </h4>
                    <p className="text-sm text-neutral-400 text-center max-w-md">
                      {proofreadEdits.length === 0
                        ? 'Your text already follows vibrational grammar perfectly!'
                        : `VIVA found ${proofreadEdits.length} suggestion${proofreadEdits.length === 1 ? '' : 's'}. Choose which to apply.`}
                    </p>
                  </div>

                  {proofreadEdits.length > 0 ? (
                    <>
                      <div className="space-y-3 max-w-2xl mx-auto">
                        {proofreadEdits.map((edit, i) => (
                          <div
                            key={i}
                            className={`rounded-xl border p-4 transition-colors ${
                              editSelections[i]
                                ? 'border-accent-500/30 bg-accent-500/5'
                                : 'border-neutral-800 bg-neutral-900/40'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => setEditSelections(prev => ({ ...prev, [i]: !prev[i] }))}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                  editSelections[i]
                                    ? 'border-accent-500 bg-accent-500 text-black'
                                    : 'border-neutral-600 bg-transparent'
                                }`}
                              >
                                {editSelections[i] && <CheckCircle className="w-3 h-3" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                  <span className="line-through text-red-400/80">{edit.original}</span>
                                  <ArrowRight className="w-3 h-3 inline mx-2 text-neutral-500" />
                                  <span className="text-green-400">{edit.suggested}</span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">{edit.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex justify-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManualStep('write')}
                        >
                          Back to Editing
                        </Button>
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={applyProofreadEdits}
                        >
                          Apply Selected Edits
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-6 flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setManualStep('write')}
                      >
                        Back to Editing
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          setPolishText(manualText)
                          setManualStep('polish')
                        }}
                      >
                        Continue to Save
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {manualStep === 'polish' && (
                <div>
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                      Review & Save
                    </h4>
                    <p className="text-sm text-neutral-400 text-center max-w-md">
                      Compare your draft with the polished version. Make any final tweaks, then save.
                    </p>
                  </div>

                  <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                    {/* Draft panel (read-only) */}
                    <div className="rounded-2xl border border-neutral-700 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                      <div className="mb-2 flex items-center gap-2 min-h-[32px]">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Your Draft</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-neutral-400 bg-neutral-800">Before</span>
                      </div>
                      <AutoResizeTextarea
                        value={manualText}
                        onChange={() => {}}
                        readOnly
                        className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                        minHeight={200}
                      />
                    </div>

                    {/* Polish panel (editable) */}
                    <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Polished</h5>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Final</span>
                          {polishViewMode === 'highlight' && normalizeText(polishText) === normalizeText(manualText) && (
                            <span className="text-[11px] text-neutral-500 italic">No changes to highlight</span>
                          )}
                        </div>
                        <div className="inline-flex rounded-md bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] p-0.5">
                          <button
                            type="button"
                            onClick={() => setPolishViewMode('edit')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                              polishViewMode === 'edit' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                            }`}
                          >
                            <Edit className="w-3 h-3 inline mr-1" />Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolishViewMode('highlight')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                              polishViewMode === 'highlight' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 inline mr-1" />Highlight
                          </button>
                        </div>
                      </div>
                      {polishViewMode === 'highlight' && polishText.trim() ? (
                        renderAddedDiff(normalizeText(manualText), normalizeText(polishText))
                      ) : (
                        <AutoResizeTextarea
                          value={polishText}
                          onChange={setPolishText}
                          placeholder="Your polished vision..."
                          className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                          minHeight={200}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManualStep('proofread')}
                    >
                      Back to Edits
                    </Button>
                    <SaveButton
                      saveLabel="Save to Draft"
                      hasUnsavedChanges={!!(draftVision && polishText.trim())}
                      isSaving={isDraftSaving}
                      onClick={async () => {
                        if (!draftVision || !polishText.trim()) return
                        const scrollPosition = window.scrollY
                        setIsDraftSaving(true)
                        try {
                          setManualText(polishText)
                          const updatedDraft = await updateDraftCategory(draftVision.id, categoryKey, polishText)
                          setDraftVision(updatedDraft)
                          await refreshVisions()
                          setTimeout(() => window.scrollTo({ top: scrollPosition, behavior: 'instant' as ScrollBehavior }), 0)
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to save')
                        } finally {
                          setIsDraftSaving(false)
                        }
                      }}
                      disabled={!draftVision || !polishText.trim()}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {draftVision && ((updateMethod === 'viva' && vivaGenerateMode) || isFirstTime) && (
            <section ref={compareSectionRef} className="mt-12 pt-8 border-t border-neutral-800 mb-8">
              {hasActiveContent ? (
                <>
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">{updateMethod === 'viva' ? 'Step 4 · ' : ''}Compare</h4>
                    {updateMethod === 'viva' && !showInstructionsSection && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowInstructionsSection(true)
                          setTimeout(() => instructionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                        }}
                        className="text-xs text-accent-500 hover:text-accent-400 transition-colors"
                      >
                        Not quite right? Adjust instructions &amp; regenerate ↑
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-sm text-neutral-300">
                        {activeVersionLabel}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                      </span>
                      <div
                        role="switch"
                        aria-checked={showManualCurrent}
                        onClick={() => setShowManualCurrent(!showManualCurrent)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                          showManualCurrent ? 'bg-primary-500' : 'bg-neutral-600'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                          showManualCurrent ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`} />
                      </div>
                      <div className="w-px h-4 bg-neutral-700 mx-1" />
                      <div
                        role="switch"
                        aria-checked={showManualNew}
                        onClick={() => setShowManualNew(!showManualNew)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                          showManualNew ? 'bg-accent-500' : 'bg-neutral-600'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                          showManualNew ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`} />
                      </div>
                      <span className="flex items-center gap-1.5 text-sm text-neutral-300">
                        {draftVersionLabel}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                      </span>
                    </div>
                  </div>

                  <div className={`space-y-6 ${showManualCurrent && showManualNew ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
                    <div className={showManualCurrent ? 'block' : 'hidden'}>
                      <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                        <div className="mb-2 flex items-center justify-between gap-3 min-h-[32px]">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Version {activeVisionVersion}</h5>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                          </div>
                          {activeVision && (
                            <span className="text-[11px] text-neutral-400">
                              {new Date(activeVision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <AutoResizeTextarea
                          value={activeValue}
                          onChange={() => {}}
                          readOnly
                          className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                          minHeight={200}
                        />
                      </div>
                    </div>

                    <div className={showManualNew ? 'block' : 'hidden'}>
                      <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Version {nonDraftVisions.length + 1}</h5>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                            {manualViewMode === 'highlight' && normalizeText(manualText) === normalizeText(activeValue) && (
                              <span className="text-[11px] text-neutral-500 italic">No changes to highlight</span>
                            )}
                          </div>
                          <div className="inline-flex rounded-md bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] p-0.5">
                            <button
                              type="button"
                              onClick={() => setManualViewMode('edit')}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                manualViewMode === 'edit' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                              }`}
                            >
                              <Edit className="w-3 h-3 inline mr-1" />Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualViewMode('highlight')}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                manualViewMode === 'highlight' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 inline mr-1" />Highlight
                            </button>
                          </div>
                        </div>
                        {manualViewMode === 'highlight' ? (
                          normalizeText(manualText) !== normalizeText(activeValue)
                            ? renderAddedDiff(normalizeText(activeValue), normalizeText(manualText))
                            : (
                              <AutoResizeTextarea
                                value={manualText}
                                onChange={() => {}}
                                readOnly
                                placeholder="Your new version will appear here after you generate or type..."
                                className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                                minHeight={200}
                              />
                            )
                        ) : (
                          <AutoResizeTextarea
                            value={manualText}
                            onChange={setManualText}
                            placeholder="Generate with VIVA in Step 3 above, or type your vision here..."
                            className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                            minHeight={200}
                          />
                        )}
                        {!isGenerating && previousRefinement && (
                          <div className="mt-4 flex justify-center">
                            <Button
                              onClick={() => { setCurrentRefinement(previousRefinement); setManualText(previousRefinement); setPreviousRefinement(null) }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />Revert to Previous
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <SaveButton
                      saveLabel="Save to Draft"
                      hasUnsavedChanges={!!(
                        draftVision &&
                        manualText.trim() &&
                        manualText.trim() !== ((draftVision[categoryKey as keyof VisionData] as string) || '').trim()
                      )}
                      isSaving={isDraftSaving}
                      onClick={saveManualEdit}
                      disabled={!draftVision || !manualText.trim()}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6 flex flex-col items-center gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Draft</h4>
                  </div>
                  <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Version {nonDraftVisions.length + 1}</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                      </div>
                      <div className="inline-flex rounded-md bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] p-0.5">
                        <button
                          type="button"
                          onClick={() => setManualViewMode('edit')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                            manualViewMode === 'edit' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <Edit className="w-3 h-3 inline mr-1" />Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualViewMode('highlight')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                            manualViewMode === 'highlight' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />Highlight
                        </button>
                      </div>
                    </div>
                    {manualViewMode === 'highlight' ? (
                      manualText.trim()
                        ? renderAddedDiff('', normalizeText(manualText))
                        : (
                          <AutoResizeTextarea
                            value={manualText}
                            onChange={() => {}}
                            readOnly
                            placeholder="Your new version will appear here after Viva runs or you type..."
                            className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                            minHeight={200}
                          />
                        )
                    ) : (
                      <AutoResizeTextarea
                        value={manualText}
                        onChange={setManualText}
                        placeholder="Generate with VIVA in Step 3 above, or type your vision here..."
                        className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                        minHeight={200}
                      />
                    )}
                    {!isGenerating && previousRefinement && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() => { setCurrentRefinement(previousRefinement); setManualText(previousRefinement); setPreviousRefinement(null) }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />Revert to Previous
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <SaveButton
                      saveLabel="Save to Draft"
                      hasUnsavedChanges={!!(
                        draftVision &&
                        manualText.trim() &&
                        manualText.trim() !== ((draftVision[categoryKey as keyof VisionData] as string) || '').trim()
                      )}
                      isSaving={isDraftSaving}
                      onClick={saveManualEdit}
                      disabled={!draftVision || !manualText.trim()}
                    />
                  </div>
                </>
              )}
            </section>
          )}
        </Card>

        {/* Commit Draft as Active — persistent action outside the dismissable banner */}
        {draftVision && !showDraftBanner && (
          <div className="flex flex-col items-center gap-2">
            {commitError && (
              <p className="text-xs text-red-400">{commitError}</p>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleCommitDraft}
              disabled={isCommittingDraft}
            >
              {isCommittingDraft ? (
                <><Spinner size="sm" className="mr-1.5" />Committing...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-1.5" />Commit Draft as Active Vision</>
              )}
            </Button>
          </div>
        )}

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
            {changedFromActive.includes(categoryKey) && (
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

      <WarningConfirmationDialog
        isOpen={showFreshConfirm}
        onClose={() => setShowFreshConfirm(false)}
        onConfirm={handleStartFresh}
        type="draft"
        title="Start Fresh?"
        message={`This will delete your current draft across all ${allCategories.length} categories${changedFromActive.length > 0 ? ` (${changedFromActive.length} updated so far)` : ''} and create a fresh starting point from your active vision. This cannot be undone.`}
        confirmText="Delete Draft & Start Fresh"
        isProcessing={isResettingDraft}
      />
    </Container>
  )
}
