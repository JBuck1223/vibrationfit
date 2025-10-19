'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssessmentRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to landing page
    router.push('/assessment/landing')
  }, [router])

  return null
}