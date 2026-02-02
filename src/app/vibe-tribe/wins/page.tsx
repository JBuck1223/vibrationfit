'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to hub with win filter
export default function WinsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/vibe-tribe?filter=win')
  }, [router])

  return null
}
