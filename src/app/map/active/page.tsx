'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'

export default function ActiveMapRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch('/api/map/status')
        if (res.ok) {
          const data = await res.json()
          if (data.activeMapId) {
            router.replace(`/map/${data.activeMapId}`)
            return
          }
        }
      } catch {
        // Fall through to /map
      }
      router.replace('/map')
    }
    redirect()
  }, [router])

  return (
    <Container size="xl">
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    </Container>
  )
}
