'use client'

import { useState, useEffect } from 'react'
import { Container, Spinner, Card, Stack } from '@/lib/design-system/components'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { useIntensiveStepCompleteModal } from '@/lib/intensive/use-step-complete-modal'
import { VibeTribeFeedLayout } from '@/components/vibe-tribe/VibeTribeFeedLayout'
import { createClient } from '@/lib/supabase/client'
import { Heart, MessageCircle } from 'lucide-react'

export default function IntensiveVibeEngagePage() {
  const { setCompletedAt } = useIntensiveStep()
  const { isOpen, stepId, completeAndShowModal, closeModal } = useIntensiveStepCompleteModal()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userProfile, setUserProfile] = useState<{ id: string; full_name: string | null; profile_picture_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasEngaged, setHasEngaged] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [completedAt, setLocalCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    if (completedAt) setCompletedAt(completedAt)
    return () => setCompletedAt(null)
  }, [completedAt, setCompletedAt])

  useEffect(() => {
    loadData()
  }, [])

  const checkEngagement = async (userId: string) => {
    const supabase = createClient()

    // Check comments on other users' posts
    const { data: comments } = await supabase
      .from('vibe_comments')
      .select('id, post_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(5)

    if (comments && comments.length > 0) {
      for (const comment of comments) {
        const { data: post } = await supabase
          .from('vibe_posts')
          .select('user_id')
          .eq('id', comment.post_id)
          .single()
        if (post && post.user_id !== userId) return true
      }
    }

    // Check hearts on other users' posts
    const { data: hearts } = await supabase
      .from('vibe_hearts')
      .select('id, post_id')
      .eq('user_id', userId)
      .not('post_id', 'is', null)
      .limit(5)

    if (hearts && hearts.length > 0) {
      for (const heart of hearts) {
        const { data: post } = await supabase
          .from('vibe_posts')
          .select('user_id')
          .eq('id', heart.post_id!)
          .single()
        if (post && post.user_id !== userId) return true
      }
    }

    return false
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      setUser(authUser)

      const [accountResult, checklistResult] = await Promise.all([
        supabase.from('user_accounts').select('full_name, profile_picture_url, role').eq('id', authUser.id).single(),
        supabase
          .from('intensive_checklist')
          .select('vibe_engagement, vibe_engagement_at')
          .eq('user_id', authUser.id)
          .in('status', ['pending', 'in_progress', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (accountResult.data) {
        setUserProfile({ id: authUser.id, full_name: accountResult.data.full_name, profile_picture_url: accountResult.data.profile_picture_url })
        setIsAdmin(accountResult.data.role === 'admin' || accountResult.data.role === 'super_admin')
      }

      if (checklistResult.data?.vibe_engagement) {
        setHasEngaged(true)
        setLocalCompletedAt(checklistResult.data.vibe_engagement_at)
      } else {
        const engaged = await checkEngagement(authUser.id)
        if (engaged) {
          setHasEngaged(true)
          await completeAndShowModal('vibe_engagement')
          setLocalCompletedAt(new Date().toISOString())
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || hasEngaged) return
    const interval = setInterval(async () => {
      const engaged = await checkEngagement(user.id)
      if (engaged) {
        setHasEngaged(true)
        await completeAndShowModal('vibe_engagement')
        setLocalCompletedAt(new Date().toISOString())
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [user, hasEngaged, completeAndShowModal])

  if (loading) {
    return <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center"><Spinner size="lg" /></Container>
  }

  return (
    <Container size="xl" className="pt-6">
      <Stack gap="lg">
        {!hasEngaged && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#BF00FF]/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-[#BF00FF]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">Engage in the Vibe Tribe</h3>
                  <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                    The Tribe works when we show up for each other — not only when we share our own
                    updates. Take a few minutes to witness someone else&apos;s win, wobble, or vision and
                    leave something real behind.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-4 py-3 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-neutral-500">
                  What counts for this step
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  A heart or a comment on <span className="text-white font-medium">another member&apos;s</span>{' '}
                  post — not your own. A short line of encouragement, appreciation, or reflection is
                  enough; presence matters more than length.
                </p>
                <ul className="text-sm text-neutral-400 space-y-1.5 pt-1">
                  <li className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-[#BF00FF] flex-shrink-0 mt-0.5" />
                    <span>Heart a post</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-[#BF00FF] flex-shrink-0 mt-0.5" />
                    <span>Or leave a comment — even one thoughtful sentence counts</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-neutral-600">
                Browse the feed below. This step completes automatically when you engage.
              </p>
            </Stack>
          </Card>
        )}

        {user && (
          <VibeTribeFeedLayout
            userId={user.id}
            isAdmin={isAdmin}
            userProfile={userProfile}
            hasPostedBefore={true}
          />
        )}
      </Stack>

      <IntensiveStepCompleteModal
        isOpen={isOpen}
        onClose={closeModal}
        stepId={stepId || 'vibe_engagement'}
      />
    </Container>
  )
}
