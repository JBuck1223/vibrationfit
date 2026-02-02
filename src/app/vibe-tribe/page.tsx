'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, PageHero, Spinner } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VibeTribeHub } from '@/components/vibe-tribe'
import { VibeTag, VIBE_TAGS } from '@/lib/vibe-tribe/types'

export default function VibeTribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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

      // Check if admin
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setIsAdmin(account?.role === 'admin' || account?.role === 'super_admin')
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
          eyebrow="THE LIFE I CHOOSE"
          title="Vibe Tribe"
          subtitle="Connect, share, and grow together with the VibrationFit community"
        />

        {/* Hub - Main action center */}
        {user && (
          <VibeTribeHub 
            userId={user.id} 
            isAdmin={isAdmin} 
            initialFilter={initialFilter}
          />
        )}
      </Stack>
    </Container>
  )
}
