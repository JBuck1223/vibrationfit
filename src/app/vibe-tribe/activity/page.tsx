'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Spinner } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VibeTribeNav, ActivityFeed } from '@/components/vibe-tribe'

export default function ActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="VIBE TRIBE"
          title="My Activity"
          subtitle="See your posts, hearts received, and community engagement"
        />

        {/* Navigation */}
        <VibeTribeNav />

        {/* Activity Feed */}
        <ActivityFeed />
      </Stack>
    </Container>
  )
}
