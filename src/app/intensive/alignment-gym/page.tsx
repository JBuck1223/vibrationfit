'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Container, Button, Spinner, Card } from '@/lib/design-system/components'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import {
  AlignmentGymHub,
  type AlignmentGymTourAnchor,
} from '@/components/alignment-gym/AlignmentGymHub'
import { AlignmentGymIntensiveTour } from '@/components/intensive/AlignmentGymIntensiveTour'
import { createClient } from '@/lib/supabase/client'

export default function IntensiveAlignmentGymPage() {
  const router = useRouter()
  const { setCompletedAt } = useIntensiveStep()
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedAt, setLocalCompletedAt] = useState<string | null>(null)
  const [activeTourAnchor, setActiveTourAnchor] = useState<AlignmentGymTourAnchor | null>(null)

  useEffect(() => {
    if (completedAt) setCompletedAt(completedAt)
    return () => setCompletedAt(null)
  }, [completedAt, setCompletedAt])

  useEffect(() => {
    loadChecklist()
  }, [])

  const loadChecklist = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('intensive_checklist')
        .select('alignment_gym_toured, alignment_gym_toured_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.alignment_gym_toured) {
        setIsCompleted(true)
        setLocalCompletedAt(data.alignment_gym_toured_at)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const tourInProgress = !isCompleted

  return (
    <div className="relative pt-6">
      {isCompleted && (
        <Container size="xl" className="pb-0">
          <Card variant="outlined" className="mb-6 bg-primary-500/5 border-primary-500/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-primary-400">Alignment Gym tour complete</p>
                  <p className="text-xs text-neutral-400">Next up: build your Alignment Plan.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => router.push('/intensive/map')}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </Container>
      )}

      <AlignmentGymHub
        activeTourAnchor={activeTourAnchor}
        forceWhatIsOpen={activeTourAnchor === 'what-is'}
        skipMapAutoVerify={tourInProgress}
      />

      <AlignmentGymIntensiveTour
        alreadyCompleted={isCompleted}
        onActiveAnchorChange={setActiveTourAnchor}
      />
    </div>
  )
}
