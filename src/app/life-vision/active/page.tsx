'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

/**
 * Redirect page that fetches the active vision and redirects to it
 * Used for navigation menu items that need to link to the active vision
 */
export default function ActiveVisionRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        // Fetch active vision from API
        const response = await fetch('/api/vision')
        
        if (!response.ok) {
          // If no vision found or error, redirect to vision list page
          router.push('/life-vision')
          return
        }

        const data = await response.json()
        
        if (data.vision?.id) {
          // Redirect to the active vision detail page
          router.push(`/life-vision/${data.vision.id}`)
        } else {
          // No active vision found, redirect to list page
          router.push('/life-vision')
        }
      } catch (error) {
        console.error('Error fetching active vision:', error)
        // On error, redirect to list page
        router.push('/life-vision')
      }
    }

    fetchAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Spinner variant="primary" size="lg" />
        <p className="text-neutral-400 mt-4">Loading your active vision...</p>
      </div>
    </div>
  )
}

