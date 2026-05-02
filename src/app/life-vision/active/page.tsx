'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner, Container } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

export default function ActiveVisionRedirectPage() {
  const router = useRouter()
  const { activeVisionId, loading } = useLifeVisionStudio()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (activeVisionId) {
      redirected.current = true
      router.replace(`/life-vision/${activeVisionId}`)
    } else {
      redirected.current = true
      router.replace('/life-vision/new')
    }
  }, [loading, activeVisionId, router])

  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
