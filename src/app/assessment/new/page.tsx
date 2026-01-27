'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

export default function AssessmentNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve any query params (like ?intensive=true)
    const params = searchParams.toString()
    const redirectUrl = params ? `/assessment?${params}` : '/assessment'
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
