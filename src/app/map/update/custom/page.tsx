'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

export default function MapUpdateCustomRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/map/update') }, [router])

  return (
    <Container size="xl">
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    </Container>
  )
}
