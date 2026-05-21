'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

/** Legacy /map/week route — main MAP uses in-app view state, not query params. */
export default function MapWeekRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/map')
  }, [router])

  return (
    <Container size="xl">
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    </Container>
  )
}
