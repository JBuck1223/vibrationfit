'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

export default function IntensiveNewVisionRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/intensive/life-vision/create')
  }, [router])
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
