'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {  Container, Card, Button, Spinner } from '@/lib/design-system'
import { Gem } from 'lucide-react'

export default function RefinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActiveVision()
  }, [])

  const loadActiveVision = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get the latest (active) vision version - exclude drafts
      const { data: activeVisionData, error: visionError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_draft', false)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (visionError) {
        console.error('Error fetching vision:', visionError)
        setError('Failed to load your vision')
        setLoading(false)
        return
      }

      if (!activeVisionData) {
        // No active vision found - redirect to create new one
        router.push('/life-vision/new')
        return
      }

      // Found active vision - redirect to refinement page
      router.push(`/life-vision/${activeVisionData.id}/refine`)
    } catch (error) {
      console.error('Error loading active vision:', error)
      setError('Failed to load your vision')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Container size="xl" className="py-12">
          <Card className="p-8 text-center">
            <Spinner variant="primary" size="lg" className="mx-auto mb-4" />
            <p className="text-neutral-400">Loading your active vision...</p>
          </Card>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Container size="xl" className="py-12">
          <Card className="p-8 text-center">
            <Gem className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Unable to Load Vision</h1>
            <p className="text-neutral-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/life-vision')}
                variant="outline"
              >
                Back to Life Visions
              </Button>
              <Button
                onClick={() => router.push('/life-vision/new')}
                variant="primary"
              >
                Create New Vision
              </Button>
            </div>
          </Card>
        </Container>
      </>
    )
  }

  return null // Will redirect
}

