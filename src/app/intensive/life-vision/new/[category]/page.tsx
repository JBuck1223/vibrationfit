'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

export default function IntensiveNewCategoryRedirect() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string
  useEffect(() => {
    router.replace(`/intensive/life-vision/create/${category}`)
  }, [router, category])
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
