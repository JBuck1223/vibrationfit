'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

export default function MapTargetRedirect() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    router.replace(`/map/update?expand=${id}`)
  }, [router, id])

  return (
    <Container size="xl">
      <div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div>
    </Container>
  )
}
