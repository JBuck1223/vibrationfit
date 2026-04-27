'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Card, Spinner, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Sparkles, ArrowRight, RotateCcw, PlayCircle } from 'lucide-react'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'
import { createClient } from '@/lib/supabase/client'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function useGuidance() {
  const {
    activeProfileId, activeProfileVersion, activeProfileDate,
    draftId, draftParentId, draftParentVersion, draftCreatedAt,
    versions,
  } = useProfileStudio()

  const hasActiveProfile = !!activeProfileId
  const hasDraft = !!draftId
  const nonDraftCount = versions.filter(v => !v.is_draft).length
  const draftIsFromActive = hasDraft && (draftParentId === activeProfileId || nonDraftCount <= 1)

  const activeRow = versions.find(v => v.is_active && !v.is_draft)
  const activeUpdatedAt = activeRow?.updated_at ?? null

  /** True when the active profile row was saved after this draft was created (draft edits do not bump active). */
  const activeChangedSinceDraft =
    hasDraft &&
    !!draftCreatedAt &&
    !!activeUpdatedAt &&
    new Date(activeUpdatedAt).getTime() > new Date(draftCreatedAt).getTime()

  const vLabel = activeProfileVersion ? `Version ${activeProfileVersion}` : 'your active profile'
  const vDate = formatDate(activeProfileDate)
  const parentLabel = draftParentVersion ? `Version ${draftParentVersion}` : 'a previous version'
  const draftDate = formatDate(draftCreatedAt)

  let paragraph: string
  let continueDescription: string
  let freshDraftDescription: string

  if (!hasActiveProfile) {
    paragraph = "You don't have a profile yet. Head to How It Works to create your first one."
    continueDescription = ''
    freshDraftDescription = ''
  } else if (hasDraft && draftIsFromActive && !activeChangedSinceDraft) {
    paragraph =
      'You have a draft in progress based on your active profile. No updates have been made to your active profile since this draft began, so we recommend you pick up where you left off by selecting Edit Draft below.'
    continueDescription = `This draft was created from your Active profile on ${draftDate || 'a recent date'}. Continue editing where you left off.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''}. Use this if you prefer a clean slate even though your active profile has not changed since the draft began.`
  } else if (hasDraft && draftIsFromActive && activeChangedSinceDraft) {
    paragraph =
      'You have a draft in progress based on your active profile. Your active profile has been updated since this draft began, so your draft may no longer match what is live. We recommend Clone and Restart below to work from your latest active profile.'
    continueDescription = `This draft was created from your Active profile on ${draftDate || 'a recent date'}. You can still open it, but it may be missing updates from your active profile.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''}, so you are working from the latest version of your live profile.`
  } else if (hasDraft && !draftIsFromActive) {
    paragraph = `You have a draft that was started from ${parentLabel}, not from your current active profile (${vLabel}). Continue that draft, or replace it with a fresh draft cloned from your active profile.`
    continueDescription = `This draft was created from ${parentLabel} on ${draftDate || 'a recent date'}. Continue editing where you left off.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''} to start from your current live profile instead of ${parentLabel}.`
  } else {
    paragraph = `${vLabel} is ready for its next evolution. Create a new version to capture your latest life updates.`
    continueDescription = ''
    freshDraftDescription = ''
  }

  return {
    paragraph, continueDescription, freshDraftDescription,
    hasActiveProfile, hasDraft,
    vLabel, vDate,
  }
}

export default function ProfileCreatePage() {
  const router = useRouter()
  const { activeProfileId, draftId, loading, refreshVersions } = useProfileStudio()
  const {
    paragraph, continueDescription, freshDraftDescription,
    hasActiveProfile, hasDraft,
    vLabel, vDate,
  } = useGuidance()
  const [navigating, setNavigating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  React.useEffect(() => {
    refreshVersions()
  }, [refreshVersions])

  const cloneActiveAndEdit = async () => {
    setNavigating(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setNavigating(false); return }

      const { data: source } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', activeProfileId!)
        .single()

      if (!source) { setNavigating(false); return }

      const { id, created_at, updated_at, version_number, parent_id: _parentId, ...rest } = source
      const { data: newDraft, error } = await supabase
        .from('user_profiles')
        .insert({ ...rest, user_id: user.id, is_draft: true, is_active: false, parent_id: id })
        .select()
        .single()

      if (error || !newDraft) {
        console.error('Error creating draft:', error)
        setNavigating(false)
        return
      }

      router.push(`/profile/${newDraft.id}/edit`)
    } catch {
      setNavigating(false)
    }
  }

  const handleContinueDraft = () => {
    setNavigating(true)
    if (draftId) {
      router.push(`/profile/${draftId}/edit`)
    }
  }

  const handleFreshDraft = async () => {
    setNavigating(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setNavigating(false); return }

      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      if (!activeProfileId) { setNavigating(false); return }

      const { data: source } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', activeProfileId)
        .single()

      if (!source) { setNavigating(false); return }

      const { id, created_at, updated_at, version_number, parent_id: _parentId, ...rest } = source
      const { data: newDraft, error } = await supabase
        .from('user_profiles')
        .insert({ ...rest, user_id: user.id, is_draft: true, is_active: false, parent_id: id })
        .select()
        .single()

      if (error || !newDraft) {
        console.error('Error creating fresh draft:', error)
        setNavigating(false)
        return
      }

      router.push(`/profile/${newDraft.id}/edit`)
    } catch {
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
        </div>

        {navigating && (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-400">Loading...</span>
          </div>
        )}

        {hasDraft ? (
          /* Draft exists: show "Continue" and "Fresh Draft" side by side */
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
                    <h3 className="text-base font-semibold text-white mb-1">Edit Draft</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {continueDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                </div>
              </Card>
            </button>

            <button onClick={() => setShowDeleteConfirm(true)} disabled={navigating} className="block w-full text-left">
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
                    <h3 className="text-base font-semibold text-white mb-1">Clone and Restart</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {freshDraftDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                </div>
              </Card>
            </button>
          </div>
        ) : hasActiveProfile ? (
          /* No draft, has active: single "Update my Profile" card */
          <button onClick={cloneActiveAndEdit} disabled={navigating} className="block w-full text-left max-w-lg mx-auto">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all border-[#BF00FF]/30 bg-gradient-to-br from-[#BF00FF]/[0.06] to-transparent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#BF00FF]/15">
                  <Sparkles className="w-6 h-6 text-[#BF00FF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Update my Profile</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Create a new version from {vLabel}{vDate ? ` (created ${vDate})` : ''} to capture your latest life updates.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </button>
        ) : (
          /* No profile at all: link to How It Works */
          <Link href="/profile/new" className="block max-w-lg mx-auto">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#39FF14]/15">
                  <Sparkles className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Create Your First Profile</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Build your first profile, defining your personal information and current state across all life areas.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        )}
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false)
            handleFreshDraft()
          }}
          title="Replace Current Draft?"
          message="Your existing draft will be permanently deleted and replaced with a fresh clone of your active profile. Any unsaved changes in the current draft will be lost."
          isDeleting={navigating}
          loadingText="Creating fresh draft..."
        />
      </Stack>
    </Container>
  )
}
