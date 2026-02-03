'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to hub with collaboration filter
export default function CollaborationPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/vibe-tribe?filter=collaboration')
  }, [router])

  return null
}
