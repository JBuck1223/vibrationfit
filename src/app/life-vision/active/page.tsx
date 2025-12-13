'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner, Container } from '@/lib/design-system/components'

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
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}

