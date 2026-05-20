'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IntensiveAssessmentResultsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/intensive/dashboard') }, [router])
  return null
}
