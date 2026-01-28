'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function RefineVisionCompletePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    checkCompletion()
  }, [])

  const checkCompletion = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('vision_refined, vision_refined_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.vision_refined && checklist.vision_refined_at) {
        setCompletedAt(checklist.vision_refined_at)
      } else {
        router.push('/life-vision/refine/new')
        return
      }
    } catch (error) {
      console.error('Error checking completion:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!completedAt) {
    return null
  }

  return (
    <IntensiveStepComplete
      stepNumber={6}
      stepTitle="Refine Your Vision"
      successMessage="Your Life Vision has been refined with VIVA's guidance. Your vision is now more detailed and aligned with your authentic desires."
      completedAt={completedAt}
      viewLabel="View Life Vision"
      viewHref="/life-vision"
      nextStepTitle="Generate Vision Audio"
      nextStepHref="/life-vision/audio/generate/new"
    />
  )
}
