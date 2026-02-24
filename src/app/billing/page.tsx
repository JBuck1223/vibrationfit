'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

export default function BillingRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/account/billing')
  }, [router])

  return (
    <Container size="xl">
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    </Container>
  )
}
