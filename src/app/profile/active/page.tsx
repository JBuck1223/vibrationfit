'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/lib/design-system/components'

/**
 * Redirect page that fetches the active profile and redirects to it
 * Used for navigation menu items that need to link to the active profile
 */
export default function ActiveProfileRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        // Fetch active profile from API
        const response = await fetch('/api/profile')
        
        if (!response.ok) {
          // If no profile found or error, redirect to profile list page
          router.push('/profile')
          return
        }

        const data = await response.json()
        
        if (data.profile?.id) {
          // Redirect to the active profile detail page
          router.push(`/profile/${data.profile.id}`)
        } else {
          // No active profile found, redirect to list page
          router.push('/profile')
        }
      } catch (error) {
        console.error('Error fetching active profile:', error)
        // On error, redirect to list page
        router.push('/profile')
      }
    }

    fetchAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Spinner variant="primary" size="lg" />
        <p className="text-neutral-400 mt-4">Loading your active profile...</p>
      </div>
    </div>
  )
}

