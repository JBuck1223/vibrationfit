'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spinner, PracticeCard, Container } from '@/lib/design-system'
import { UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VibeTribeFeedLayout } from '@/components/vibe-tribe/VibeTribeFeedLayout'
import { VibeTag, VIBE_TAGS } from '@/lib/vibe-tribe/types'

interface UserProfile {
  id: string
  full_name: string | null
  profile_picture_url: string | null
}

export default function VibeTribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { stats: practiceStats } = useAreaStats('vibe-tribe')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasPostedBefore, setHasPostedBefore] = useState(true) // Default to true to avoid flash

  // Get initial filter from URL
  const filterParam = searchParams.get('filter')
  const initialFilter: VibeTag | 'all' = filterParam && VIBE_TAGS.includes(filterParam as VibeTag)
    ? (filterParam as VibeTag)
    : 'all'

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)

      // Check if user has made any posts
      const { data: posts } = await supabase
        .from('vibe_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .limit(1)
      
      const userHasPosted = !!(posts && posts.length > 0)
      setHasPostedBefore(userHasPosted)

      // If user hasn't posted, redirect to onboarding
      if (!userHasPosted) {
        router.push('/vibe-tribe/new')
        return
      }

      // Get user account data including profile picture and name
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role, full_name, profile_picture_url')
        .eq('id', user.id)
        .single()
      
      setIsAdmin(account?.role === 'admin' || account?.role === 'super_admin')
      setUserProfile({
        id: user.id,
        full_name: account?.full_name || null,
        profile_picture_url: account?.profile_picture_url || null,
      })
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Container size="xl" className="pt-4 pb-2">
        <PracticeCard
          title="Vibe Tribe"
          icon={UsersRound}
          theme="purple"
          todayCompleted={practiceStats?.todayCompleted ?? false}
          currentStreak={practiceStats?.currentStreak ?? 0}
          countLast7={practiceStats?.countLast7 ?? 0}
          countLast30={practiceStats?.countLast30 ?? 0}
          countAllTime={practiceStats?.countAllTime ?? 0}
          streakFreezeAvailable={practiceStats?.streakFreezeAvailable ?? false}
          streakFreezeUsedThisWeek={practiceStats?.streakFreezeUsedThisWeek ?? false}
          ctaHref="/vibe-tribe"
          ctaLabel="Share with Vibe Tribe"
          ctaDoneLabel="Back to Vibe Tribe"
          ctaHelperText="Your community rises when you share."
          ctaDoneHelperText="Done for today. Your presence matters."
        />
      </Container>
      <VibeTribeFeedLayout 
        userId={user.id} 
        isAdmin={isAdmin} 
        initialFilter={initialFilter}
        userProfile={userProfile}
        hasPostedBefore={hasPostedBefore}
      />
    </>
  )
}
