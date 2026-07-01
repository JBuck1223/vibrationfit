'use client'

import { useEffect, useState } from 'react'
import { AlignmentGymHub } from '@/components/alignment-gym/AlignmentGymHub'
import { createClient } from '@/lib/supabase/client'
import { isAlignmentGymSessionsLocked } from '@/lib/intensive/alignment-gym-access'
import { Container, Spinner } from '@/lib/design-system/components'

export default function AlignmentGymPage() {
  const [sessionsLocked, setSessionsLocked] = useState<boolean | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSessionsLocked(false)
        return
      }
      setSessionsLocked(await isAlignmentGymSessionsLocked(supabase, user.id))
    }
    void load()
  }, [])

  if (sessionsLocked === null) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return <AlignmentGymHub statsUntilGraduation={sessionsLocked} />
}
