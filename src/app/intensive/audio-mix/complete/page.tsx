'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function AudioMixCompletePage() {
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
        .select('audios_generated, audios_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.audios_generated && checklist.audios_generated_at) {
        setCompletedAt(checklist.audios_generated_at)
      } else {
        router.push('/life-vision/audio/mix/new')
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
      stepNumber={9}
      stepTitle="Create Audio Mix"
      successMessage="Your custom audio mix is ready. Your vision is now blended with ambient sounds and healing frequencies for the ultimate experience."
      completedAt={completedAt}
      viewLabel="Listen to Audio"
      viewHref="/life-vision"
      nextStepTitle="Create Vision Board"
      nextStepHref="/vision-board/resources"
    />
  )
}
