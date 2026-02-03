'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to hub with wobble filter
export default function WobblesPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/vibe-tribe?filter=wobble')
  }, [router])

  return null
}
