'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntensiveStepComplete, Spinner, Container } from '@/lib/design-system/components'

export default function SettingsCompletePage() {
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

      // Step 1 completion is tracked via user_accounts having required fields
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, email, phone, updated_at')
        .eq('id', user.id)
        .single()

      if (accountData) {
        const hasRequired = accountData.first_name && accountData.last_name && 
                           accountData.email && accountData.phone
        if (hasRequired) {
          setCompletedAt(accountData.updated_at || new Date().toISOString())
        } else {
          // Not complete, redirect to step page
          router.push('/account/settings')
          return
        }
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
      stepNumber={1}
      stepTitle="Account Settings"
      successMessage="Your account settings are complete. Your name, email, and phone are now set up for your Activation Intensive journey."
      completedAt={completedAt}
      viewLabel="View Settings"
      viewHref="/account/settings"
      nextStepTitle="Baseline Intake"
      nextStepHref="/intensive/intake"
    />
  )
}
