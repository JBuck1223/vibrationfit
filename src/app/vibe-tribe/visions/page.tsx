'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to hub with vision filter
export default function VisionsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/vibe-tribe?filter=vision')
  }, [router])

  return null
}
