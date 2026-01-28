'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function ScheduleCallCompletePage() {
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
        .select('call_scheduled, call_scheduled_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.call_scheduled && checklist.call_scheduled_at) {
        setCompletedAt(checklist.call_scheduled_at)
      } else {
        router.push('/intensive/schedule-call')
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
      stepNumber={12}
      stepTitle="Book Calibration Call"
      successMessage="Your Calibration Call is scheduled. This 1:1 session will help you review your assets and finalize your Activation Protocol."
      completedAt={completedAt}
      viewLabel="View My Meetings"
      viewHref="/sessions"
      nextStepTitle="Activation Protocol"
      nextStepHref="/intensive/activation-protocol"
    />
  )
}
