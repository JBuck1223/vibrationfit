'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Card, Spinner } from '@/lib/design-system/components'
import { WarningConfirmationDialog } from '@/lib/design-system/components/overlays'
import { Sparkles, ArrowRight, Plus, Info, ArrowLeft, RotateCcw, PlayCircle } from 'lucide-react'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function useGuidance() {
  const {
    activeVisionId, activeVisionVersion, activeVisionDate,
    draftId, draftParentId, draftParentVersion, draftCreatedAt, draftRefinedCount,
    profileNewerThanVision, profileVersionNumber,
  } = useLifeVisionStudio()

  const hasActiveVision = !!activeVisionId
  const hasDraft = !!draftId
  const draftIsFromActive = hasDraft && draftParentId === activeVisionId

  const vLabel = activeVisionVersion ? `Version ${activeVisionVersion}` : 'your active vision'
  const vDate = formatDate(activeVisionDate)
  const parentLabel = draftParentVersion ? `Version ${draftParentVersion}` : 'a previous version'
  const draftDate = formatDate(draftCreatedAt)
  const refinedOf14 = `${draftRefinedCount} of 14 categories`

  let paragraph: string
  let refineCardDescription: string
  let freshDescription: string
  let continueDescription: string
  let freshDraftDescription: string

  if (!hasActiveVision) {
    paragraph = "You don't have a Life Vision yet. Click Start Fresh to walk through each category with VIVA and create your first one."
    refineCardDescription = ''
    freshDescription = 'Build your first Life Vision from the ground up with VIVA guiding you through each category.'
    continueDescription = ''
    freshDraftDescription = ''
  } else if (hasDraft && draftIsFromActive) {
    paragraph = `You have a refinement in progress from ${vLabel}. Click Refine my Vision to pick up where you left off -- you've touched ${refinedOf14}.`
    refineCardDescription = `Continue with your current draft, or launch a fresh draft from ${vLabel}.`
    freshDescription = 'Set aside your current draft and build a completely new vision from your profile.'
    continueDescription = `Your draft was created from ${vLabel} on ${draftDate}. You've refined ${refinedOf14} so far.`
    freshDraftDescription = `Clone ${vLabel}${vDate ? ` (committed ${vDate})` : ''} and begin refining with a clean slate.`
  } else if (hasDraft && !draftIsFromActive) {
    paragraph = `You have a draft that was started from ${parentLabel}, not your current active vision (${vLabel}). Continue with your current draft, or launch a fresh draft from your active vision.`
    refineCardDescription = `Continue with your current draft (from ${parentLabel}), or launch a fresh draft from ${vLabel}.`
    freshDescription = 'Set aside your current draft and build a completely new vision from your profile.'
    continueDescription = `Your draft was created from ${parentLabel} on ${draftDate}. You've refined ${refinedOf14} so far.`
    freshDraftDescription = `Clone ${vLabel}${vDate ? ` (committed ${vDate})` : ''} and begin refining with a clean slate.`
  } else {
    paragraph = `${vLabel} is ready for its next evolution. Click Refine my Vision to elevate it with VIVA, or click Start Fresh to build a new one from your profile.`
    refineCardDescription = `Elevate ${vLabel}${vDate ? ` (committed ${vDate})` : ''} with VIVA through guided refinement.`
    freshDescription = 'Build a new Life Vision from the ground up with VIVA guiding you through each category.'
    continueDescription = ''
    freshDraftDescription = ''
  }

  let profileNote: string | null = null
  if (hasActiveVision && profileNewerThanVision) {
    const profileLabel = profileVersionNumber ? `Your profile (Version ${profileVersionNumber})` : 'Your profile'
    profileNote = `${profileLabel} has been updated since your active vision was committed. Starting fresh would generate a new vision with context from your latest profile.`
  }

  return {
    paragraph, profileNote, refineCardDescription, freshDescription,
    continueDescription, freshDraftDescription,
    hasActiveVision, hasDraft, draftRefinedCount,
  }
}

export default function LifeVisionCreatePage() {
  const router = useRouter()
  const { activeVisionId, draftId, loading, refreshVisions } = useLifeVisionStudio()
  const {
    paragraph, profileNote, refineCardDescription, freshDescription,
    continueDescription, freshDraftDescription,
    hasActiveVision, hasDraft, draftRefinedCount,
  } = useGuidance()
  const [navigating, setNavigating] = useState(false)
  const [showRefineOptions, setShowRefineOptions] = useState(false)
  const [showFreshDraftConfirm, setShowFreshDraftConfirm] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)

  React.useEffect(() => {
    refreshVisions()
  }, [refreshVisions])

  const handleRefineClick = () => {
    if (!hasDraft) {
      createFreshDraft()
      return
    }
    setShowRefineOptions(true)
  }

  const handleContinueDraft = () => {
    setNavigating(true)
    if (draftId) {
      router.push(`/life-vision/${draftId}/refine`)
    }
  }

  const handleFreshDraftClick = () => {
    setShowFreshDraftConfirm(true)
  }

  const createFreshDraft = async () => {
    if (!activeVisionId) return
    setCreatingDraft(true)
    setNavigating(true)
    try {
      if (draftId) {
        await fetch(`/api/vision/draft?draftId=${draftId}`, { method: 'DELETE' })
      }

      const res = await fetch('/api/vision/draft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: activeVisionId }),
      })

      if (!res.ok) throw new Error('Failed to create draft')
      const { draft } = await res.json()

      await refreshVisions()
      router.push(`/life-vision/${draft.id}/refine`)
    } catch {
      setCreatingDraft(false)
      setNavigating(false)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="rounded-2xl border border-[#BF00FF]/20 bg-gradient-to-br from-[#BF00FF]/[0.04] to-transparent p-5 md:p-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <Sparkles className="w-4 h-4 text-[#BF00FF]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#BF00FF]">
              VIVA Recommendations
            </h2>
          </div>
          <p className="text-neutral-300 leading-relaxed text-sm text-center">
            {paragraph}
          </p>
          {profileNote && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#39FF14]/20 bg-[#39FF14]/[0.04] px-4 py-3">
              <Info className="w-4 h-4 text-[#39FF14]/70 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-400 leading-relaxed">
                {profileNote}
              </p>
            </div>
          )}
        </div>

        {navigating && (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-400">
              {creatingDraft ? 'Creating fresh draft...' : 'Loading...'}
            </span>
          </div>
        )}

        {!showRefineOptions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasActiveVision && (
              <button onClick={handleRefineClick} disabled={navigating} className="block w-full text-left">
                <Card
                  variant="elevated"
                  hover
                  className="p-6 transition-all border-[#BF00FF]/30 bg-gradient-to-br from-[#BF00FF]/[0.06] to-transparent h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#BF00FF]/15">
                      <Sparkles className="w-6 h-6 text-[#BF00FF]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Refine my Vision</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {refineCardDescription}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </button>
            )}

            <Link href="/life-vision/new" className="block">
              <Card
                variant="elevated"
                hover
                className="p-6 transition-all border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent h-full"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#39FF14]/15">
                    <Plus className="w-6 h-6 text-[#39FF14]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">Start Fresh</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {freshDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowRefineOptions(false)}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleContinueDraft} disabled={navigating} className="block w-full text-left">
                <Card
                  variant="elevated"
                  hover
                  className="p-6 transition-all border-[#BF00FF]/30 bg-gradient-to-br from-[#BF00FF]/[0.06] to-transparent h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#BF00FF]/15">
                      <PlayCircle className="w-6 h-6 text-[#BF00FF]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Continue Where You Left Off</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {continueDescription}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </button>

              <button onClick={handleFreshDraftClick} disabled={navigating} className="block w-full text-left">
                <Card
                  variant="elevated"
                  hover
                  className="p-6 transition-all border-[#00FFFF]/30 bg-gradient-to-br from-[#00FFFF]/[0.06] to-transparent h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#00FFFF]/15">
                      <RotateCcw className="w-6 h-6 text-[#00FFFF]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Create a Fresh Draft</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {freshDraftDescription}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </button>
            </div>
          </div>
        )}
      </Stack>

      <WarningConfirmationDialog
        isOpen={showFreshDraftConfirm}
        onClose={() => setShowFreshDraftConfirm(false)}
        onConfirm={() => {
          setShowFreshDraftConfirm(false)
          createFreshDraft()
        }}
        type="draft"
        title="Replace Current Draft?"
        message={`This will delete your current draft${draftRefinedCount > 0 ? ` (${draftRefinedCount} categories refined)` : ''} and create a fresh one from your active vision. This cannot be undone.`}
        confirmText="Replace Draft"
        cancelText="Keep Current Draft"
        isProcessing={creatingDraft}
      />
    </Container>
  )
}
