'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Stack } from '@/lib/design-system/components'
import { Rocket, TrendingUp, CheckCircle, Target, Headphones, Image, BookOpen, Calendar, Sparkles, PartyPopper, Stars, Zap } from 'lucide-react'
import { completeIntensive } from '@/lib/intensive/utils-client'

/**
 * Intensive Unlock Complete Page - The Grand Finale!
 * 
 * This is the celebration page shown when the user completes all 14 steps
 * of the Activation Intensive. Features confetti, achievements, and
 * a button to enter their full dashboard.
 */

export default function UnlockCompletePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

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
        .select('id, unlock_completed, unlock_completed_at, started_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist?.unlock_completed && checklist.unlock_completed_at) {
        setCompletedAt(checklist.unlock_completed_at)
        setChecklistId(checklist.id)
        setStartedAt(checklist.started_at)
      } else {
        router.push('/intensive/intake/unlock')
        return
      }
    } catch (error) {
      console.error('Error checking completion:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate completion time in hours
  const getCompletionTimeHours = (): number | null => {
    if (!startedAt || !completedAt) return null
    const started = new Date(startedAt)
    const completed = new Date(completedAt)
    return (completed.getTime() - started.getTime()) / (1000 * 60 * 60)
  }

  const completionTimeHours = getCompletionTimeHours()
  const finishedOnTime = completionTimeHours && completionTimeHours <= 72

  const handleEnterDashboard = async () => {
    if (!checklistId) {
      router.push('/dashboard')
      return
    }

    setCompleting(true)
    try {
      await completeIntensive(checklistId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing intensive:', error)
      // Still redirect even if there's an error
      router.push('/dashboard')
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
    <Container size="xl">
      <Stack gap="lg">
        <Card 
          variant="elevated" 
          className="p-4 md:p-8 lg:p-12 text-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30"
        >
          {/* Celebration Animation */}
          <div className="flex justify-center gap-4 mb-6">
            <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <Stars className="w-10 h-10 md:w-12 md:h-12 text-primary-500 animate-bounce" style={{ animationDelay: '100ms' }} />
            <Zap className="w-10 h-10 md:w-12 md:h-12 text-accent-500 animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>

          {/* Main Icon */}
          <Rocket className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-primary-500" />
          
          {/* Heading */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Activation Intensive Complete!
          </h1>
          
          {/* Completion Time */}
          <p className="text-base md:text-xl lg:text-2xl text-neutral-300 mb-8">
            {completionTimeHours ? (
              finishedOnTime ? (
                <>You activated your vision in <span className="text-primary-500 font-bold">{Math.round(completionTimeHours)} hours</span>!</>
              ) : (
                <>You completed your activation journey!</>
              )
            ) : (
              <>You&apos;ve completed your activation journey!</>
            )}
          </p>

          {/* Achievement Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            <Card variant="outlined" className="p-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <div className="text-lg font-semibold mb-1">14 Steps</div>
              <div className="text-sm text-neutral-400">All Complete</div>
            </Card>
            
            <Card variant="outlined" className="p-4">
              <Target className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
              <div className="text-lg font-semibold mb-1">Vision Created</div>
              <div className="text-sm text-neutral-400">12 Categories</div>
            </Card>
            
            <Card variant="outlined" className="p-4">
              <Headphones className="w-8 h-8 mx-auto mb-2 text-accent-500" />
              <div className="text-lg font-semibold mb-1">Audio Ready</div>
              <div className="text-sm text-neutral-400">AM/PM Tracks</div>
            </Card>
            
            <Card variant="outlined" className="p-4">
              <Image className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-lg font-semibold mb-1">Vision Board</div>
              <div className="text-sm text-neutral-400">12 Images</div>
            </Card>
          </div>

          {/* Additional Achievements */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            <Card variant="outlined" className="p-4">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
              <div className="text-sm font-semibold">Journal Started</div>
            </Card>
            
            <Card variant="outlined" className="p-4">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm font-semibold">Call Scheduled</div>
            </Card>
            
            <Card variant="outlined" className="p-4">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-sm font-semibold">Protocol Active</div>
            </Card>
          </div>

          {/* Unlocked Benefits */}
          <div className="mb-8 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-white mb-4">You&apos;ve Unlocked:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm">Advanced Audio Suite</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm">Vibe Tribe Community</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm">The Alignment Gym</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm">Graduate Coaching Pass</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8 max-w-2xl mx-auto">
            <p className="text-lg text-neutral-300 mb-4">
              You&apos;re now ready to live in your vision. Your full VibrationFit platform access is unlocked.
            </p>
            <p className="text-base text-neutral-400">
              Continue your journey with daily practice, vision boards, audio tracks, and journaling.
            </p>
          </div>

          {/* CTA */}
          <Button 
            variant="primary"
            size="lg"
            onClick={handleEnterDashboard}
            disabled={completing}
            className="text-xl px-12 py-6"
          >
            {completing ? 'Unlocking...' : 'Enter Your Dashboard →'}
          </Button>

          {/* Footer Message */}
          <div className="mt-8 pt-8 border-t border-neutral-700">
            <div className="flex items-center justify-center gap-2 text-primary-500">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">You&apos;re Above the Green Line</span>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
