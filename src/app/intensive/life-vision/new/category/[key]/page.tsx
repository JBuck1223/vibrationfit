'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

export default function IntensiveCategoryKeyRedirect() {
  const router = useRouter()
  const params = useParams()
  const key = params.key as string
  useEffect(() => {
    router.replace(`/intensive/life-vision/create/${key}`)
  }, [router, key])
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
