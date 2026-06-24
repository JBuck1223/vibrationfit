'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Card, Spinner, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Sparkles, ChevronRight, RotateCcw, PlayCircle, FilePlus } from 'lucide-react'
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
  let startFreshDescription: string

  if (!hasActiveProfile) {
    paragraph = "You don't have a profile yet. Head to How It Works to create your first one."
    continueDescription = ''
    freshDraftDescription = ''
    startFreshDescription = ''
  } else if (hasDraft && draftIsFromActive && !activeChangedSinceDraft) {
    paragraph =
      'You have a draft in progress based on your active profile. No updates have been made to your active profile since this draft began, so we recommend you pick up where you left off by selecting Edit Draft below.'
    continueDescription = `This draft was created from your Active profile on ${draftDate || 'a recent date'}. Continue editing where you left off.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''}.`
    startFreshDescription = 'Discard this draft and start over. All your life details will be kept, but your Current State reflections will be cleared.'
  } else if (hasDraft && draftIsFromActive && activeChangedSinceDraft) {
    paragraph =
      'You have a draft in progress based on your active profile. Your active profile has been updated since this draft began, so your draft may no longer match what is live. We recommend Clone and Restart below to work from your latest active profile.'
    continueDescription = `This draft was created from your Active profile on ${draftDate || 'a recent date'}. You can still open it, but it may be missing updates from your active profile.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''}.`
    startFreshDescription = 'Discard this draft and start over. All your life details will be kept, but your Current State reflections will be cleared.'
  } else if (hasDraft && !draftIsFromActive) {
    paragraph = `You have a draft that was started from ${parentLabel}, not from your current active profile (${vLabel}). Continue that draft, or replace it with a fresh draft cloned from your active profile.`
    continueDescription = `This draft was created from ${parentLabel} on ${draftDate || 'a recent date'}. Continue editing where you left off.`
    freshDraftDescription = `Discard this draft and create a new one cloned from your Active profile${vDate ? ` (last updated ${vDate})` : ''}.`
    startFreshDescription = 'Discard this draft and start over. All your life details will be kept, but your Current State reflections will be cleared.'
  } else {
    paragraph = `${vLabel} is ready for its next evolution. Create a new version to capture your latest life updates, or start fresh.`
    continueDescription = ''
    freshDraftDescription = ''
    startFreshDescription = 'Keep all your life details but clear your Current State reflections so you can rewrite them from scratch.'
  }

  return {
    paragraph, continueDescription, freshDraftDescription, startFreshDescription,
    hasActiveProfile, hasDraft,
    vLabel, vDate,
  }
}

export default function ProfileCreatePage() {
  const router = useRouter()
  const { activeProfileId, draftId, loading, refreshVersions } = useProfileStudio()
  const {
    paragraph, continueDescription, freshDraftDescription, startFreshDescription,
    hasActiveProfile, hasDraft,
    vLabel, vDate,
  } = useGuidance()
  const [navigating, setNavigating] = useState(false)
  const [pendingAction, setPendingAction] = useState<'clone' | 'fresh' | null>(null)

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

      await refreshVersions()
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

      await refreshVersions()
      router.push(`/profile/${newDraft.id}/edit`)
    } catch {
      setNavigating(false)
    }
  }

  const handleStartFresh = async () => {
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

      // Clone everything but clear state narratives and recordings
      const { id, created_at, updated_at, version_number, parent_id: _parentId, ...rest } = source
      const cleared: Record<string, unknown> = {
        state_fun: null,
        state_health: null,
        state_travel: null,
        state_love: null,
        state_family: null,
        state_social: null,
        state_home: null,
        state_work: null,
        state_money: null,
        state_stuff: null,
        state_giving: null,
        state_spirituality: null,
        story_recordings: [],
        version_notes: null,
        progress_photos: null,
      }

      const { data: newDraft, error } = await supabase
        .from('user_profiles')
        .insert({ ...rest, ...cleared, user_id: user.id, is_draft: true, is_active: false, parent_id: id })
        .select()
        .single()

      if (error || !newDraft) {
        console.error('Error creating fresh draft:', error)
        setNavigating(false)
        return
      }

      await refreshVersions()
      router.push(`/profile/${newDraft.id}/edit`)
    } catch {
      setNavigating(false)
    }
  }

  const confirmPendingAction = () => {
    setPendingAction(null)
    if (pendingAction === 'clone') handleFreshDraft()
    else if (pendingAction === 'fresh') handleStartFresh()
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const optionCardClass =
    'flex w-full min-h-[5.5rem] items-start gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 md:p-4 lg:p-4 hover:border-neutral-500 active:scale-[0.99]'

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Update profile</h1>
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <button
              type="button"
              onClick={handleContinueDraft}
              disabled={navigating}
              className="group block min-w-0 touch-manipulation w-full text-left disabled:opacity-60"
            >
              <Card
                variant="glass"
                className={`${optionCardClass} hover:bg-[#BF00FF]/[0.11]`}
              >
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15">
                  <PlayCircle className="h-5 w-5 text-[#BF00FF]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Edit Draft</h3>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                    {continueDescription}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>

            <button
              type="button"
              onClick={() => setPendingAction('clone')}
              disabled={navigating}
              className="group block min-w-0 touch-manipulation w-full text-left disabled:opacity-60"
            >
              <Card variant="glass" className={`${optionCardClass} hover:bg-cyan-500/[0.11]`}>
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                  <RotateCcw className="h-5 w-5 text-cyan-400" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Clone and Restart</h3>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                    {freshDraftDescription}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>

            <button
              type="button"
              onClick={() => setPendingAction('fresh')}
              disabled={navigating}
              className="group block min-w-0 touch-manipulation w-full text-left disabled:opacity-60"
            >
              <Card variant="glass" className={`${optionCardClass} hover:bg-[#39FF14]/[0.11]`}>
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
                  <FilePlus className="h-5 w-5 text-[#39FF14]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Start Fresh</h3>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                    {startFreshDescription}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>
          </div>
        ) : hasActiveProfile ? (
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={cloneActiveAndEdit}
              disabled={navigating}
              className="group block min-w-0 touch-manipulation w-full text-left disabled:opacity-60"
            >
              <Card variant="glass" className={`${optionCardClass} hover:bg-[#BF00FF]/[0.11]`}>
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15">
                  <Sparkles className="h-5 w-5 text-[#BF00FF]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Update my Profile</h3>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                    Create a new version from {vLabel}
                    {vDate ? ` (created ${vDate})` : ''} to capture your latest life updates.
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>

            <button
              type="button"
              onClick={handleStartFresh}
              disabled={navigating}
              className="group block min-w-0 touch-manipulation w-full text-left disabled:opacity-60"
            >
              <Card variant="glass" className={`${optionCardClass} hover:bg-[#39FF14]/[0.11]`}>
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
                  <FilePlus className="h-5 w-5 text-[#39FF14]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Start Fresh</h3>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                    {startFreshDescription}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>
          </div>
        ) : (
          <Link href="/profile/new" className="group mx-auto block min-w-0 max-w-lg touch-manipulation">
            <Card variant="glass" className={`${optionCardClass} hover:bg-[#39FF14]/[0.11]`}>
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
                <Sparkles className="h-5 w-5 text-[#39FF14]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <h3 className="text-sm font-semibold leading-snug text-white">Create Your First Profile</h3>
                <p className="mt-0.5 line-clamp-3 text-xs leading-snug text-neutral-500 sm:line-clamp-4">
                  Build your first profile, defining your personal information and current state across all life areas.
                </p>
              </div>
              <ChevronRight
                className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                aria-hidden
              />
            </Card>
          </Link>
        )}
        <DeleteConfirmationDialog
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
          title="Replace Current Draft?"
          message={
            pendingAction === 'fresh'
              ? 'Your existing draft will be permanently deleted. A new draft will be created with all your life details intact, but your Current State reflections will be cleared so you can rewrite them.'
              : 'Your existing draft will be permanently deleted and replaced with a fresh clone of your active profile. Any unsaved changes in the current draft will be lost.'
          }
          isDeleting={navigating}
          loadingText={pendingAction === 'fresh' ? 'Creating fresh profile...' : 'Creating fresh draft...'}
        />
      </Stack>
    </Container>
  )
}
