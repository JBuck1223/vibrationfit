'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'
import { Suspense } from 'react'

function RedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const date = searchParams.get('date')
    router.replace('/map?view=week' + (date ? `&date=${date}` : ''))
  }, [router, searchParams])
  return (
    <Container size="xl">
      <div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div>
    </Container>
  )
}

export default function MapWeekRedirect() {
  return (
    <Suspense fallback={<Container size="xl"><div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div></Container>}>
      <RedirectInner />
    </Suspense>
  )
}
