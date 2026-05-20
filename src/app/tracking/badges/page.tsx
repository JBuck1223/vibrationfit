'use client'

import { useEffect, useState } from 'react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { BadgeDisplay } from '@/components/badges'
import { createClient } from '@/lib/supabase/client'

export default function TrackingBadgesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="md" />
        </div>
      </Container>
    )
  }

  if (!userId) return null

  return (
    <Container size="xl">
      <Stack gap="md">
        <BadgeDisplay
          userId={userId}
          compact={false}
          hideEmpty={false}
          lockUntilEarned={true}
          variant="engraved"
        />
      </Stack>
    </Container>
  )
}
