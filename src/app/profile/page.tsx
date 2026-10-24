'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/app-shell/ShellPageSkeleton'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'

export default function ProfileListPage() {
  const router = useRouter()
  const { versions, loading, activeProfileId } = useProfileStudio()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (activeProfileId) {
      redirected.current = true
      router.replace(`/profile/${activeProfileId}`)
      return
    }

    redirected.current = true
    const firstVersion = versions[0]
    router.replace(firstVersion?.id ? `/profile/${firstVersion.id}` : '/profile/create')
  }, [loading, activeProfileId, versions, router])

  return (
    <PageLoading />
  )
}
