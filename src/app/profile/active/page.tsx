'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner, Container } from '@/lib/design-system/components'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'

export default function ActiveProfileRedirectPage() {
  const router = useRouter()
  const { activeProfileId, versions, loading } = useProfileStudio()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (activeProfileId) {
      redirected.current = true
      router.replace(`/profile/${activeProfileId}`)
    } else if (versions[0]?.id) {
      redirected.current = true
      router.replace(`/profile/${versions[0].id}`)
    } else {
      redirected.current = true
      router.replace('/profile/create')
    }
  }, [loading, activeProfileId, versions, router])

  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
