'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Rocket, CheckCircle, Music, ImageIcon, BookOpen, Calendar } from 'lucide-react'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { IntensiveStepCompleteBanner } from '@/components/IntensiveStepCompleteBanner'
import { ReadOnlySection } from '@/components/IntensiveStepCompletedBanner'
import { IntensiveStepHeader } from '@/components/IntensiveStepHeader'
import { IntensiveStepCompletionContent } from '@/components/IntensiveStepCompletionContent'

import { 
  Container, 
  Card, 
  Button,
  Badge,
  Spinner,
  Stack,
  PageHero
} from '@/lib/design-system/components'

export default function ActivationProtocolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  
  // Completion states
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (intensiveData) {
        setIntensiveId(intensiveData.id)
        
        // Check if already completed
        const { data: checklistData } = await supabase
          .from('intensive_checklist')
          .select('activation_protocol_completed, activation_protocol_completed_at')
          .eq('intensive_id', intensiveData.id)
          .single()
        
        if (checklistData?.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklistData.activation_protocol_completed_at)
        }
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const supabase = createClient()
      
      const completedTime = new Date().toISOString()
      
      // Mark activation protocol complete
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: completedTime,
          unlock_completed: true,
          unlock_completed_at: completedTime
        })
        .eq('intensive_id', intensiveId)

      // Mark intensive as complete
      await supabase
        .from('intensive_purchases')
        .update({
          completion_status: 'completed',
          completed_at: completedTime
        })
        .eq('id', intensiveId)

      // TODO: Activate their membership tier here
      // This would trigger the continuity billing to start

      // Show completion banner instead of redirecting
      setJustCompleted(true)
      setCompletedAt(completedTime)
    } catch (error) {
      console.error('Error completing intensive:', error)
      alert('Failed to complete intensive. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <Container size="lg" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // SCENARIO B: User is revisiting - protocol already completed
  if (isAlreadyCompleted && !justCompleted && completedAt) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <IntensiveStepHeader stepNumber={13} stepTitle="Activation Protocol">
            <IntensiveStepCompletionContent 
              stepTitle="Activation Protocol"
              completedAt={completedAt}
            />
          </IntensiveStepHeader>
          
          <ReadOnlySection
            title="Your Activation Protocol"
            helperText="You've completed the intensive! Your full platform access is now active."
          >
            <Card className="p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
              <div className="text-center">
                <Rocket className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Full Platform Unlocked!</h3>
                <p className="text-neutral-300 mb-6">
                  Continue your daily practice with the resources below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button variant="ghost" size="sm" onClick={() => router.push('/life-vision')} className="justify-center">
                    <Music className="w-4 h-4 mr-2" />
                    Vision Audio
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/vision-board')} className="justify-center">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Vision Board
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/journal')} className="justify-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Journal
                  </Button>
                </div>
              </div>
            </Card>
          </ReadOnlySection>
        </Stack>
      </Container>
    )
  }

  // SCENARIO A: User just completed - show celebration and forward momentum
  if (justCompleted) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <IntensiveStepCompleteBanner
            currentStepName="Activation Protocol"
            nextStepName="Your Dashboard"
            nextStepHref="/dashboard"
            position="top"
          />
          
          <Card variant="elevated" className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-primary-500/50">
            <div className="text-center py-8">
              <Rocket className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Activation Complete!</h2>
              <p className="text-lg text-neutral-300 mb-6">
                Congratulations! You&apos;ve completed your 72-Hour Activation Intensive.
                <br />
                Your full VibrationFit membership is now active.
              </p>
              <CheckCircle className="w-8 h-8 text-primary-500 mx-auto" />
            </div>
          </Card>
          
          <IntensiveStepCompleteBanner
            currentStepName="Activation Protocol"
            nextStepName="Your Dashboard"
            nextStepHref="/dashboard"
            position="bottom"
          />
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <PageHero
          title="Your Activation Protocol"
          subtitle="Daily rituals to bring your vision to life"
        >
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.push('/intensive/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-xs md:text-sm">Back to Dashboard</span>
          </Button>
          <Badge variant="premium" className="text-xs md:text-sm">
            <Rocket className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Step 13 of 14 - Final Step!
          </Badge>
        </PageHero>

        {/* Hero Card */}
      <Card variant="elevated" className="mb-6 md:mb-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
        <div className="text-center">
          <Rocket className="w-12 h-12 md:w-16 md:h-16 text-primary-500 mx-auto mb-3 md:mb-4" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-4">Congratulations! 🎉</h2>
          <p className="text-sm md:text-base lg:text-xl text-neutral-300">
            You&apos;ve completed all the foundation steps. Now it&apos;s time to activate!
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          
        {/* Daily Rituals */}
        <Card>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6">Your Daily Practice</h2>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Morning Audio (15 min)</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                Listen to your vision audio first thing in the morning. This programs your subconscious mind and sets your vibration for the day.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Vision Board Review (5 min)</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                View your vision board and feel the emotions of already living your vision. This activates the law of attraction.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Evening Journal (10 min)</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                Write about your day, progress, insights, and synchronicities. Track your journey above the Green Line.
              </p>
            </div>
          </div>
        </Card>

        {/* Weekly & Monthly */}
        <Card>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6">Ongoing Practices</h2>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Weekly Check-In</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                Every Sunday, review your progress, celebrate wins, and adjust your approach. Use VIVA for guidance.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Monthly Vision Refresh</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                Update your vision as you evolve. Add new images to your board, refine your audio, capture new insights.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-energy-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">Conscious Creations</h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 ml-10 md:ml-13">
                Use the platform to track your conscious creations - tangible manifestations of your vision coming to life.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resources */}
      <Card className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Your Activation Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/life-vision')} className="justify-start text-xs md:text-sm">
            <Music className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
            Your Vision Audio
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/vision-board')} className="justify-start text-xs md:text-sm">
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
            Your Vision Board
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/journal')} className="justify-start text-xs md:text-sm">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
            Your Journal
          </Button>
        </div>
      </Card>

      {/* Complete Button */}
      <Card className="text-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
        <div className="py-6 md:py-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Ready to Launch? 🚀</h2>
          <p className="text-sm md:text-base lg:text-xl mb-6 md:mb-8">
            Complete your intensive and activate your full membership!
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleComplete}
            disabled={completing}
            className="bg-white text-black hover:bg-gray-100 text-sm md:text-base w-full sm:w-auto"
          >
            {completing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Completing...
              </>
            ) : (
              <>
                Complete Intensive & Activate
                <Rocket className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
      </Stack>
    </Container>
  )
}

