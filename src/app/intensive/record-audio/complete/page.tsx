'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function RecordAudioCompletePage() {
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

      // Step 8 shares completion with Step 7 (audio_generated)
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('audio_generated, audio_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.audio_generated && checklist.audio_generated_at) {
        setCompletedAt(checklist.audio_generated_at)
      } else {
        router.push('/life-vision/audio/record/new')
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
      stepNumber={8}
      stepTitle="Record Your Voice"
      successMessage="Your voice recordings are complete. Your own voice adds the most powerful personal touch to your vision audio."
      completedAt={completedAt}
      viewLabel="Listen to Audio"
      viewHref="/life-vision"
      nextStepTitle="Create Audio Mix"
      nextStepHref="/life-vision/audio/mix/new"
    />
  )
}
