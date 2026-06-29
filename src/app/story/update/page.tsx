'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as Diff from 'diff'
import {
  Sparkles,
  PenLine,
  Edit,
  X,
  RefreshCw,
  Wand2,
  User,
  ChevronDown,
  FileText,
  CheckCircle,
  ArrowRight,
  FileCheck,
  RotateCcw,
  Copy,
  AlertCircle,
} from 'lucide-react'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  AutoResizeTextarea,
  SaveButton,
  VIVALoadingOverlay,
} from '@/lib/design-system/components'
import { InsufficientTokensDialog } from '@/lib/design-system/components/overlays'
import { createClient } from '@/lib/supabase/client'
import { useStoryStudio } from '@/components/story-studio/StoryStudioContext'
import type { Story } from '@/lib/stories/types'

type UpdateMethod = 'viva' | 'manual' | null
type VivaGenerateMode = 'add' | 'rewrite' | null
type ManualStep = 'write' | 'proofread' | 'polish'
type ViewMode = 'edit' | 'highlight'

interface ProofreadEdit {
  original: string
  suggested: string
  reason: string
}

export default function StoryUpdatePage() {
  const supabase = createClient()
  const { stories, updateTargetId, refreshStories } = useStoryStudio()

  // Top-level state
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Step state
  const [updateMethod, setUpdateMethod] = useState<UpdateMethod>(null)
  const [vivaGenerateMode, setVivaGenerateMode] = useState<VivaGenerateMode>(null)
  const [showGenModeCards, setShowGenModeCards] = useState(true)
  const [showInstructionsSection, setShowInstructionsSection] = useState(true)

  // VIVA path
  const [vivaInstructions, setVivaInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [previousRefinement, setPreviousRefinement] = useState<string | null>(null)

  // Manual path
  const [manualText, setManualText] = useState('')
  const [manualStep, setManualStep] = useState<ManualStep>('write')
  const [manualViewMode, setManualViewMode] = useState<ViewMode>('edit')
  const [proofreadEdits, setProofreadEdits] = useState<ProofreadEdit[]>([])
  const [editSelections, setEditSelections] = useState<Record<number, boolean>>({})
  const [proofreadLoading, setProofreadLoading] = useState(false)
  const [polishText, setPolishText] = useState('')
  const [polishViewMode, setPolishViewMode] = useState<ViewMode>('edit')

  // Compare panel
  const [compareViewMode, setCompareViewMode] = useState<ViewMode>('edit')
  const [showCompareCurrent, setShowCompareCurrent] = useState(true)
  const [showCompareNew, setShowCompareNew] = useState(true)

  // Save
  const [isSaving, setIsSaving] = useState(false)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenErrorInfo, setTokenErrorInfo] = useState<{ tokensRemaining?: number }>({})

  const compareSectionRef = useRef<HTMLElement | null>(null)
  const instructionsSectionRef = useRef<HTMLDivElement>(null)

  const normalizeText = (text: string) =>
    text.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim()

  // Load the selected story whenever the area-bar target changes
  useEffect(() => {
    if (!updateTargetId) {
      setStory(null)
      setLoading(false)
      return
    }
    const found = stories.find(s => s.id === updateTargetId)
    if (found) {
      setStory(found)
      setLoading(false)
      const live = found.content || ''
      // Recover unsaved legacy pending drafts into the editor until the user saves
      const legacyDraft =
        found.pending_content &&
        normalizeText(found.pending_content) !== normalizeText(live)
          ? found.pending_content
          : null
      setManualText(legacyDraft || live)
      setCurrentRefinement(legacyDraft || '')
    } else {
      setLoading(false)
    }
  }, [updateTargetId, stories])

  // Reset step state when the selected story changes
  useEffect(() => {
    setUpdateMethod(null)
    setVivaGenerateMode(null)
    setShowGenModeCards(true)
    setShowInstructionsSection(true)
    setVivaInstructions('')
    setPreviousRefinement(null)
    setManualStep('write')
    setManualViewMode('edit')
    setProofreadEdits([])
    setEditSelections({})
    setPolishText('')
    setPolishViewMode('edit')
    setCompareViewMode('edit')
    setShowCompareCurrent(true)
    setShowCompareNew(true)
    setError(null)
  }, [updateTargetId])

  const currentContent = story?.content || ''
  const proposedText = currentRefinement || manualText || ''

  const hasChanges = normalizeText(proposedText) !== normalizeText(currentContent)
  const hasExistingAudio = !!(story?.user_audio_url || story?.audio_set_id)

  // -------- VIVA refine streaming --------
  const handleVivaGenerate = useCallback(async () => {
    if (!story) return
    const mode: 'refine' | 'rewrite' = vivaGenerateMode === 'rewrite' ? 'rewrite' : 'refine'
    const baseText = currentRefinement.trim() || story.content || ''
    if (!baseText.trim() || !vivaInstructions.trim()) return

    if (currentRefinement.trim()) setPreviousRefinement(currentRefinement)

    setIsGenerating(true)
    setError(null)
    setCurrentRefinement('')

    compareSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    try {
      const response = await fetch('/api/stories/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          feedback: vivaInstructions.trim(),
          currentContent: baseText,
          mode,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({} as any))
        if (response.status === 402 || errBody?.insufficientTokens) {
          setTokenErrorInfo({ tokensRemaining: errBody?.tokensRemaining })
          setShowInsufficientTokens(true)
          throw new Error(errBody?.error || 'Insufficient tokens')
        }
        throw new Error(errBody?.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullText = ''
      let done = false
      let lineBuffer = ''

      while (!done) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        const chunk = decoder.decode(value, { stream: true })
        lineBuffer += chunk
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (!jsonStr.trim()) continue
          try {
            const data = JSON.parse(jsonStr)
            if (data.error) {
              if (data.insufficientTokens) {
                setTokenErrorInfo({ tokensRemaining: data.tokensRemaining })
                setShowInsufficientTokens(true)
              }
              throw new Error(data.error)
            }
            if (data.content) {
              fullText += data.content
              setCurrentRefinement(fullText)
            }
            if (data.done) {
              done = true
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message.startsWith('Unexpected token')) {
              continue
            }
            throw parseErr
          }
        }
      }

      await refreshStories()
      setShowInstructionsSection(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate update')
    } finally {
      setIsGenerating(false)
    }
  }, [story, vivaGenerateMode, vivaInstructions, currentRefinement, refreshStories])

  const handleSave = useCallback(async (text?: string) => {
    if (!story) return
    const newContent = (text ?? proposedText).trim()
    if (!newContent) return

    if (
      hasExistingAudio &&
      normalizeText(newContent) !== normalizeText(currentContent) &&
      !window.confirm(
        'This story already has audio. Saving will update the story text, but your existing recording will not change automatically. You may want to re-record after saving.\n\nSave anyway?',
      )
    ) {
      return
    }

    setIsSaving(true)
    setError(null)
    const wordCount = newContent.split(/\s+/).filter(Boolean).length

    try {
      const { error: dbError } = await supabase
        .from('stories')
        .update({
          content: newContent,
          pending_content: null,
          pending_title: null,
          word_count: wordCount,
          source: story.source === 'ai_generated' ? 'ai_assisted' : story.source,
          updated_at: new Date().toISOString(),
        })
        .eq('id', story.id)

      if (dbError) throw dbError

      setUpdateMethod(null)
      setVivaGenerateMode(null)
      setVivaInstructions('')
      setCurrentRefinement('')
      setManualText(newContent)
      setPreviousRefinement(null)
      setManualStep('write')
      setProofreadEdits([])
      setEditSelections({})
      setPolishText('')
      setShowInstructionsSection(true)
      setShowGenModeCards(true)
      await refreshStories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story')
    } finally {
      setIsSaving(false)
    }
  }, [story, proposedText, currentContent, hasExistingAudio, supabase, refreshStories])

  const handleRevertEdits = useCallback(() => {
    setCurrentRefinement('')
    setManualText(currentContent)
    setPreviousRefinement(null)
    setManualStep('write')
    setProofreadEdits([])
    setEditSelections({})
    setPolishText('')
    setError(null)
  }, [currentContent])

  const handleProofread = useCallback(async () => {
    if (!manualText.trim()) return
    setProofreadLoading(true)
    setProofreadEdits([])
    setEditSelections({})
    setError(null)

    try {
      const response = await fetch('/api/viva/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualText }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({} as any))
        if (response.status === 402) {
          setTokenErrorInfo({ tokensRemaining: errData.tokensRemaining })
          setShowInsufficientTokens(true)
          setProofreadLoading(false)
          return
        }
        throw new Error(errData.error || `Proofread failed (${response.status})`)
      }

      const data = await response.json()
      const edits: ProofreadEdit[] = data.edits || []
      setProofreadEdits(edits)
      const selections: Record<number, boolean> = {}
      edits.forEach((_, i) => { selections[i] = true })
      setEditSelections(selections)
      setManualStep('proofread')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proofread')
    } finally {
      setProofreadLoading(false)
    }
  }, [manualText])

  const applyProofreadEdits = useCallback(() => {
    let polished = manualText
    const selected = proofreadEdits
      .map((edit, i) => ({ ...edit, index: i }))
      .filter(edit => editSelections[edit.index])
      .sort((a, b) => {
        const posA = polished.lastIndexOf(a.original)
        const posB = polished.lastIndexOf(b.original)
        return posB - posA
      })
    for (const edit of selected) {
      polished = polished.replace(edit.original, edit.suggested)
    }
    setPolishText(polished)
    setPolishViewMode('edit')
    setManualStep('polish')
  }, [manualText, proofreadEdits, editSelections])

  // -------- Diff renderers --------
  const renderAddedDiff = (oldText: string, newText: string) => {
    const diff = Diff.diffSentences(normalizeText(oldText), normalizeText(newText))
    return (
      <div className="w-full px-4 py-3 bg-[#101010] border-2 border-neutral-800 rounded-lg min-h-[200px] whitespace-pre-wrap text-sm leading-[1.75] text-neutral-100">
        {diff.map((part, i) => {
          if (part.removed) return null
          if (part.added) return <span key={i} className="bg-green-500/30 text-green-200 px-1 rounded">{part.value}</span>
          return <span key={i}>{part.value}</span>
        })}
      </div>
    )
  }

  const renderFullDiff = (oldText: string, newText: string) => {
    const diff = Diff.diffWords(normalizeText(oldText), normalizeText(newText))
    return (
      <div className="w-full px-4 py-3 bg-[#101010] border-2 border-neutral-800 rounded-lg min-h-[200px] whitespace-pre-wrap text-sm leading-[1.75] text-neutral-100">
        {diff.map((part, i) => {
          if (part.removed) return <span key={i} className="bg-red-500/30 text-red-200 px-0.5 rounded line-through">{part.value}</span>
          if (part.added) return <span key={i} className="bg-green-500/30 text-green-200 px-0.5 rounded">{part.value}</span>
          return <span key={i}>{part.value}</span>
        })}
      </div>
    )
  }

  // -------- Early returns --------
  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!story) {
    return (
      <Container size="xl">
        <Card className="text-center p-8 md:p-12">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Select a Story to Update</h2>
          <p className="text-sm text-neutral-400">
            Choose a completed story from the selector above to begin updating.
          </p>
        </Card>
      </Container>
    )
  }

  // Derived UI state
  const methodCards = [
    {
      key: 'viva' as const,
      icon: Wand2,
      title: 'Update with VIVA',
      description: 'Let VIVA refine, expand, or rewrite this story for you.',
      iconColor: 'text-accent-100',
      bgColor: 'bg-accent-700/20',
    },
    {
      key: 'manual' as const,
      icon: User,
      title: 'Update Myself',
      description: "Write or edit your story directly. VIVA will proofread for vibrational grammar when you're done.",
      iconColor: 'text-secondary-500',
      bgColor: 'bg-secondary-500/20',
    },
  ]
  const selectedMethodCard = updateMethod ? methodCards.find(c => c.key === updateMethod) : null
  const methodIsCollapsed = !!selectedMethodCard

  const genModes = [
    { key: 'add' as const, title: 'Add Only', description: 'Weave new content into the existing story' },
    { key: 'rewrite' as const, title: 'Complete Rewrite', description: 'Generate a full replacement from your instructions' },
  ]
  const selectedGenMode = vivaGenerateMode ? genModes.find(m => m.key === vivaGenerateMode) : null
  const genModeIsCollapsed = !!selectedGenMode && !showGenModeCards

  const actionLabel = vivaGenerateMode === 'rewrite' ? 'Rewrite Story with VIVA' : 'Refine Story with VIVA'
  const generatingLabel = vivaGenerateMode === 'rewrite' ? 'Rewriting with VIVA...' : 'Refining with VIVA...'

  const canRunViva = !!(vivaGenerateMode && currentContent.trim() && vivaInstructions.trim())

  // Compare visible when VIVA produced a revised draft
  const showCompareSection = !!(updateMethod === 'viva' && proposedText.trim() && hasChanges)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Card>
          <Stack gap="md">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500" />
                <h2 className="text-base font-semibold text-white">
                  {story.title || 'Untitled Story'}
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                {story.word_count ? `${story.word_count.toLocaleString()} words` : 'No content'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-[#2A2A2A]" />
                <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Current story</p>
                <div className="h-px flex-1 bg-[#2A2A2A]" />
              </div>
              {currentContent.trim() ? (
                <div className="rounded-xl border border-[#282828] bg-[#101010] px-4 py-3 max-h-[280px] overflow-y-auto">
                  <p className="text-sm text-neutral-200 leading-[1.75] whitespace-pre-wrap">
                    {currentContent}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic text-center py-3">
                  This story has no content yet.
                </p>
              )}
            </div>
          </Stack>
        </Card>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-200 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-300 hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1 — Method Choice */}
        <Card>
          {methodIsCollapsed && selectedMethodCard ? (
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
                {(() => { const SelIcon = selectedMethodCard.icon; return <SelIcon className="w-4 h-4 text-primary-500" /> })()}
                {selectedMethodCard.title}
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
                      onClick={() => {
                        setUpdateMethod(card.key)
                        if (card.key === 'manual') {
                          setManualStep('write')
                          if (!manualText.trim()) setManualText(currentContent)
                          setManualViewMode('edit')
                          setProofreadEdits([])
                          setEditSelections({})
                          setPolishText('')
                        }
                        if (card.key === 'viva') {
                          setVivaGenerateMode(null)
                          setShowGenModeCards(true)
                          setShowInstructionsSection(true)
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
                          <h3 className="text-sm font-semibold text-neutral-200">{card.title}</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed mt-1">{card.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        {/* Step 2 — Generation Mode (VIVA only) */}
        {updateMethod === 'viva' && (
          <Card>
            {genModeIsCollapsed && selectedGenMode ? (
              <button
                type="button"
                onClick={() => setShowGenModeCards(true)}
                className="w-full relative flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-colors"
              >
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Step 2 · Generation Mode</h4>
                <p className="text-sm font-medium text-white mt-1">{selectedGenMode.title}</p>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            ) : (
              <>
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 text-center mb-3">Step 2 · Generation Mode</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
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
                        <h5 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{mode.title}</h5>
                        <p className="text-xs text-neutral-400 mt-0.5">{mode.description}</p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        )}

        {/* Step 3 — Instructions (VIVA only) */}
        {updateMethod === 'viva' && vivaGenerateMode && (
          <Card>
            <div ref={instructionsSectionRef}>
              {!showInstructionsSection ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowInstructionsSection(true)
                    setTimeout(() => instructionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                  }}
                  className="w-full relative flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-colors"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Step 3 · Instructions</h4>
                  <p className="text-sm font-medium text-white mt-1">
                    {vivaInstructions.trim()
                      ? vivaInstructions.trim().slice(0, 80) + (vivaInstructions.trim().length > 80 ? '…' : '')
                      : 'No instructions provided'}
                  </p>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  </div>
                </button>
              ) : (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 text-center mb-3">Step 3 · Instructions</h4>
                  <p className="text-center text-sm text-neutral-400 mb-3 leading-relaxed">
                    {vivaGenerateMode === 'rewrite'
                      ? 'Tell VIVA how to rewrite this story from scratch. Describe the new direction, tone, or focus.'
                      : 'Tell VIVA how to refine this story. (Optional — VIVA can refine without notes too.)'}
                  </p>
                  <AutoResizeTextarea
                    value={vivaInstructions}
                    onChange={setVivaInstructions}
                    placeholder={vivaGenerateMode === 'rewrite'
                      ? 'e.g., Rewrite as a quiet evening narrative focused on creative work and family dinner...'
                      : 'e.g., Make the morning routine more detailed, add more sensory language about the ocean view, shorten the work section...'}
                    className="min-h-[150px] w-full !bg-[#101010] !border !border-neutral-800 focus-within:!border-accent-500 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                    minHeight={150}
                  />
                  <div className="flex justify-center gap-3 pt-6">
                    <Button
                      onClick={handleVivaGenerate}
                      disabled={isGenerating || !canRunViva}
                      variant="accent"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <><Spinner variant="secondary" size="sm" />{generatingLabel}</>
                      ) : currentRefinement.trim().length > 50 ? (
                        <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />{actionLabel}</>
                      )}
                    </Button>
                  </div>
                  <p className="text-center text-xs text-neutral-500 mt-3">
                    {currentRefinement.trim().length > 50
                      ? 'Your draft is ready below. Adjust your instructions and regenerate, or scroll down to review.'
                      : 'Your generated text will appear in the Compare section below for review.'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Manual Path */}
        {updateMethod === 'manual' && (
          <Card>
            {manualStep === 'write' && (
              <div>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Write Your Update</h4>
                  <p className="text-sm text-neutral-400 text-center max-w-md">
                    Edit your story directly. When you&apos;re done, VIVA will proofread it for vibrational grammar.
                  </p>
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                  {/* Current Active (read-only) */}
                  <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                    <div className="mb-2 flex items-center justify-between gap-3 min-h-[32px]">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Current Active</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                      </div>
                    </div>
                    <AutoResizeTextarea
                      value={currentContent}
                      onChange={() => {}}
                      readOnly
                      className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                      minHeight={200}
                    />
                  </div>

                  {/* Your Draft (editable) */}
                  <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Your Draft</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                        {manualViewMode === 'highlight' && normalizeText(manualText) === normalizeText(currentContent) && (
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
                      renderAddedDiff(currentContent, manualText)
                    ) : (
                      <AutoResizeTextarea
                        value={manualText}
                        onChange={setManualText}
                        placeholder="Type your updated story here..."
                        className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                        minHeight={200}
                      />
                    )}
                    {!manualText.trim() && (
                      <div className="mt-3 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManualText(currentContent)}
                        >
                          <Copy className="w-4 h-4 mr-2" />Copy Active to Draft
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <SaveButton
                    saveLabel="Save Story"
                    hasUnsavedChanges={normalizeText(manualText) !== normalizeText(currentContent)}
                    isSaving={isSaving}
                    onClick={() => handleSave(manualText)}
                    disabled={!manualText.trim() || isSaving || normalizeText(manualText) === normalizeText(currentContent)}
                  />
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
                </div>
              </div>
            )}

            {manualStep === 'proofread' && (
              <div>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Vibrational Grammar Check</h4>
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
                            editSelections[i] ? 'border-accent-500/30 bg-accent-500/5' : 'border-neutral-800 bg-neutral-900/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => setEditSelections(prev => ({ ...prev, [i]: !prev[i] }))}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                editSelections[i] ? 'border-accent-500 bg-accent-500 text-black' : 'border-neutral-600 bg-transparent'
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
                      <Button variant="outline" size="sm" onClick={() => setManualStep('write')}>Back to Editing</Button>
                      <Button variant="accent" size="sm" onClick={applyProofreadEdits}>
                        Apply Selected Edits
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 flex justify-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setManualStep('write')}>Back to Editing</Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
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
                  <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Review &amp; Save</h4>
                  <p className="text-sm text-neutral-400 text-center max-w-md">
                    Compare your draft with the polished version. Make any final tweaks, then save your story.
                  </p>
                </div>

                <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
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
                      renderAddedDiff(manualText, polishText)
                    ) : (
                      <AutoResizeTextarea
                        value={polishText}
                        onChange={setPolishText}
                        placeholder="Your polished story..."
                        className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                        minHeight={200}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setManualStep('proofread')}>Back to Edits</Button>
                  <SaveButton
                    saveLabel="Save Story"
                    hasUnsavedChanges={!!(polishText.trim() && normalizeText(polishText) !== normalizeText(currentContent))}
                    isSaving={isSaving}
                    onClick={async () => {
                      if (!polishText.trim()) return
                      setManualText(polishText)
                      setCurrentRefinement(polishText)
                      await handleSave(polishText)
                    }}
                    disabled={!polishText.trim() || isSaving}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 4 — Compare + Save (VIVA path) */}
        {showCompareSection && (
          <section ref={compareSectionRef as any}>
            <Card>
              <div className="mb-6 flex flex-col items-center gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  {updateMethod === 'viva' ? 'Step 4 · ' : ''}Compare
                </h4>
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
                    Current
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                  </span>
                  <div
                    role="switch"
                    aria-checked={showCompareCurrent}
                    onClick={() => setShowCompareCurrent(!showCompareCurrent)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                      showCompareCurrent ? 'bg-primary-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showCompareCurrent ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <div className="w-px h-4 bg-neutral-700 mx-1" />
                  <div
                    role="switch"
                    aria-checked={showCompareNew}
                    onClick={() => setShowCompareNew(!showCompareNew)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                      showCompareNew ? 'bg-accent-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showCompareNew ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-300">
                    Updated
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                  </span>
                </div>
              </div>

              <div className={`relative space-y-6 ${showCompareCurrent && showCompareNew ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
                <VIVALoadingOverlay
                  isVisible={isGenerating && !currentRefinement.trim()}
                  messages={[
                    'VIVA is reading your story...',
                    vivaGenerateMode === 'rewrite' ? 'Crafting a fresh narrative...' : 'Weaving in your instructions...',
                    'Polishing the language...',
                    'Almost ready...',
                  ]}
                  cycleDuration={3000}
                  size="md"
                  className="rounded-xl"
                />

                {/* Current Active (left) */}
                <div className={showCompareCurrent ? 'block' : 'hidden'}>
                  <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                    <div className="mb-2 flex items-center justify-between gap-3 min-h-[32px]">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Current</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10">Active</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(story.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <AutoResizeTextarea
                      value={currentContent}
                      onChange={() => {}}
                      readOnly
                      className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                      minHeight={200}
                    />
                  </div>
                </div>

                {/* Updated draft (right) */}
                <div className={showCompareNew ? 'block' : 'hidden'}>
                  <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Updated</h5>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#FFFF00] bg-[#FFFF00]/10">Draft</span>
                        {compareViewMode === 'highlight' && !hasChanges && (
                          <span className="text-[11px] text-neutral-500 italic">No changes to highlight</span>
                        )}
                      </div>
                      <div className="inline-flex rounded-md bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] p-0.5">
                        <button
                          type="button"
                          onClick={() => setCompareViewMode('edit')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                            compareViewMode === 'edit' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <Edit className="w-3 h-3 inline mr-1" />Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareViewMode('highlight')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                            compareViewMode === 'highlight' ? 'bg-zinc-900/85 text-white font-semibold' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />Highlight
                        </button>
                      </div>
                    </div>
                    {compareViewMode === 'highlight'
                      ? (hasChanges ? renderFullDiff(currentContent, proposedText) : (
                          <AutoResizeTextarea
                            value={proposedText}
                            onChange={() => {}}
                            readOnly
                            className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 !leading-[1.75]"
                            minHeight={200}
                          />
                        ))
                      : (
                        <AutoResizeTextarea
                          value={proposedText}
                          onChange={(val) => {
                            setCurrentRefinement(val)
                            setManualText(val)
                          }}
                          placeholder="Your updated story will appear here..."
                          className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3 !leading-[1.75]"
                          minHeight={200}
                        />
                      )}
                    {!isGenerating && previousRefinement && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() => {
                            setCurrentRefinement(previousRefinement)
                            setManualText(previousRefinement)
                            setPreviousRefinement(null)
                          }}
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

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevertEdits}
                  disabled={isSaving || !hasChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Revert Changes
                </Button>
                <SaveButton
                  saveLabel="Save Story"
                  hasUnsavedChanges={hasChanges}
                  isSaving={isSaving}
                  onClick={() => handleSave()}
                  disabled={!hasChanges || isSaving}
                />
              </div>
            </Card>
          </section>
        )}
      </Stack>

      <InsufficientTokensDialog
        isOpen={showInsufficientTokens}
        onClose={() => setShowInsufficientTokens(false)}
        tokensRemaining={tokenErrorInfo.tokensRemaining}
        actionName="updating this story"
      />
    </Container>
  )
}
