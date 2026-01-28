'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startIntensive } from '@/lib/intensive/utils-client'
import { 
  Container, 
  Stack,
  PageHero,
  Card, 
  Button, 
  Spinner,
  Inline,
  Text
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { 
  Settings, 
  FileText,
  User, 
  ClipboardCheck, 
  Sparkles, 
  Wand2, 
  Music, 
  Mic,
  Sliders,
  ImageIcon, 
  BookOpen, 
  Calendar, 
  Rocket,
  Unlock,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'

// Placeholder video URL - replace with actual intro video
const INTENSIVE_START_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function IntensiveStartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [alreadyStarted, setAlreadyStarted] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)

  useEffect(() => {
    checkIntensiveStatus()
  }, [])

  const checkIntensiveStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for active intensive
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, intensive_id, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (!checklist) {
        // No intensive purchased
        router.push('/#pricing')
        return
      }

      // Check if intensive has already started (checklist is source of truth)
      const { data: fullChecklist } = await supabase
        .from('intensive_checklist')
        .select('id, started_at')
        .eq('id', checklist.id)
        .single()

      if (fullChecklist?.started_at) {
        // Already started - show completed state
        setAlreadyStarted(true)
        setStartedAt(fullChecklist.started_at)
      }

      setChecklistId(checklist.id)
    } catch (error) {
      console.error('Error checking intensive status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    if (!checklistId) return
    
    setStarting(true)
    try {
      const result = await startIntensive(checklistId)
      
      if (result.success) {
        // Refresh the page to show completed state
        window.location.reload()
      } else {
        alert('Failed to start intensive: ' + result.error)
      }
    } catch (error) {
      console.error('Error starting intensive:', error)
      alert('Failed to start intensive. Please try again.')
    } finally {
      setStarting(false)
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


  // 14-step journey phases
  const phases = [
    {
      name: 'Setup',
      icon: Settings,
      color: 'text-neutral-400',
      steps: [
        { num: 1, title: 'Account Settings', icon: Settings },
        { num: 2, title: 'Baseline Intake', icon: FileText },
      ]
    },
    {
      name: 'Foundation',
      icon: User,
      color: 'text-[#5EC49A]',
      steps: [
        { num: 3, title: 'Create Profile', icon: User },
        { num: 4, title: 'Vibration Assessment', icon: ClipboardCheck },
      ]
    },
    {
      name: 'Vision Creation',
      icon: Sparkles,
      color: 'text-[#2DD4BF]',
      steps: [
        { num: 5, title: 'Build Life Vision', icon: Sparkles },
        { num: 6, title: 'Refine with VIVA', icon: Wand2 },
      ]
    },
    {
      name: 'Audio',
      icon: Music,
      color: 'text-[#8B5CF6]',
      steps: [
        { num: 7, title: 'Generate Audio', icon: Music },
        { num: 8, title: 'Record Voice (Optional)', icon: Mic },
        { num: 9, title: 'Create Audio Mix', icon: Sliders },
      ]
    },
    {
      name: 'Activation',
      icon: ImageIcon,
      color: 'text-[#FFB701]',
      steps: [
        { num: 10, title: 'Vision Board', icon: ImageIcon },
        { num: 11, title: 'Journal Entry', icon: BookOpen },
        { num: 12, title: 'Book Calibration Call', icon: Calendar },
      ]
    },
    {
      name: 'Completion',
      icon: Rocket,
      color: 'text-primary-500',
      steps: [
        { num: 13, title: 'Activation Protocol', icon: Rocket },
        { num: 14, title: 'Unlock Platform', icon: Unlock },
      ]
    }
  ]

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner - Shows when intensive has already been started */}
        {alreadyStarted && startedAt && (
          <IntensiveCompletionBanner
            stepTitle="Start Intensive"
            completedAt={startedAt}
            showReviewText={false}
          />
        )}

        {/* Hero - Always shows original welcome content */}
        <PageHero
          eyebrow="72-HOUR ACTIVATION INTENSIVE"
          title="Welcome to Your Transformation"
          subtitle="Your 14-step journey to creating and activating the life you truly desire begins now."
        >
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={INTENSIVE_START_VIDEO}
              context="single"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2 items-center">
            {alreadyStarted ? (
              <Button 
                variant="primary"
                size="lg"
                onClick={() => router.push('/intensive/dashboard')}
                className="w-full sm:w-auto px-8"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            ) : (
              <Button 
                variant="primary"
                size="lg"
                onClick={handleStart}
                disabled={starting}
                className="w-full sm:w-auto px-8"
              >
                {starting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Start My Activation Intensive
                  </>
                )}
              </Button>
            )}
          </div>
        </PageHero>

        {/* Your Journey - 14 Steps Overview */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Your 14-Step Journey
            </Text>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phases.map((phase) => (
                <div key={phase.name} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-3">
                    <phase.icon className={`w-5 h-5 ${phase.color}`} />
                    <span className="font-semibold text-white">{phase.name}</span>
                  </div>
                  <div className="space-y-2">
                    {phase.steps.map((step) => (
                      <div key={step.num} className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">{step.num}</span>
                        <step.icon className="w-3.5 h-3.5" />
                        <span>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Stack>
        </Card>

        {/* What You'll Create */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Create
            </Text>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary-500 mb-2">12</div>
                <div className="text-xs md:text-sm text-neutral-400">Life Categories<br/>in Your Vision</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-secondary-500 mb-2">3+</div>
                <div className="text-xs md:text-sm text-neutral-400">Personalized<br/>Audio Tracks</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-accent-500 mb-2">1</div>
                <div className="text-xs md:text-sm text-neutral-400">Complete<br/>Vision Board</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-[#FFB701] mb-2">1</div>
                <div className="text-xs md:text-sm text-neutral-400">Calibration<br/>Call</div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* How It Works */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How It Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Clock className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    72-Hour Focus Window
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  When you click "Start", your 72-hour timer begins. Most people complete in this window, 
                  but take the time you need. The timer is for motivation, not pressure.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <CheckCircle className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Step-by-Step Unlocking
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Each step unlocks the next. Complete them in order to build a solid foundation 
                  for your transformation. VIVA will guide you every step of the way.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Unlock className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Full Platform Access
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Once you complete all 14 steps, the full VibrationFit platform unlocks. 
                  Continue growing with unlimited access to all features.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Start CTA */}
        <Card variant="outlined" className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
          <Stack gap="md" className="text-center py-4">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
              Ready to Begin?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Your transformation starts with a single click. When you're ready to commit to your 72-hour journey, press the button below to begin.
            </p>
            <div className="flex flex-col gap-3 items-center">
              {alreadyStarted ? (
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/intensive/dashboard')}
                  className="w-full sm:w-auto px-8"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={handleStart}
                    disabled={starting}
                    className="w-full sm:w-auto px-8"
                  >
                    {starting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Start My Activation Intensive
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-neutral-500 max-w-md">
                    Your 72-hour timer begins when you click above.
                  </p>
                </>
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
