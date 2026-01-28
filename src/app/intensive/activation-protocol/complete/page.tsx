'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function ActivationProtocolCompletePage() {
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
        .select('activation_protocol_completed, activation_protocol_completed_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.activation_protocol_completed && checklist.activation_protocol_completed_at) {
        setCompletedAt(checklist.activation_protocol_completed_at)
      } else {
        router.push('/intensive/activation-protocol')
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
      stepNumber={13}
      stepTitle="Activation Protocol"
      successMessage="Your Activation Protocol is set. You now have a personalized daily practice to keep you vibrationally aligned with your vision."
      completedAt={completedAt}
      viewLabel="View Protocol"
      viewHref="/intensive/activation-protocol"
      nextStepTitle="Full Platform Unlock"
      nextStepHref="/intensive/intake/unlock"
    />
  )
}
