'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startIntensive, completeIntensive } from '@/lib/intensive/utils-client'
import { IntensiveWelcomeScreen } from '@/components/IntensiveWelcomeScreen'
import { IntensiveCompletionScreen } from '@/components/IntensiveCompletionScreen'
import { 
  Clock, 
  CheckCircle, 
  User,
  ClipboardCheck,
  Calendar,
  Sparkles,
  Wand2,
  Music,
  ImageIcon,
  BookOpen,
  Video,
  Rocket,
  ArrowRight,
  AlertCircle,
  Lock
} from 'lucide-react'

import { 
  Container, 
  Card, 
  Button, 
  Badge,
  ProgressBar,
  Spinner,
  Stack,
  PageHero
} from '@/lib/design-system/components'

interface IntensivePurchase {
  id: string
  user_id: string
  payment_plan: string
  activation_deadline: string | null
  started_at: string | null
  completion_status: string
  completed_at: string | null
  created_at: string
}

interface IntensiveChecklist {
  id: string
  intensive_id: string
  user_id: string
  
  // Phase 1: Foundation
  profile_completed: boolean
  profile_completed_at: string | null
  assessment_completed: boolean
  assessment_completed_at: string | null
  call_scheduled: boolean
  call_scheduled_at: string | null
  
  // Phase 2: Vision Creation
  vision_built: boolean
  vision_built_at: string | null
  vision_refined: boolean
  vision_refined_at: string | null
  
  // Phase 3: Activation Tools
  audio_generated: boolean
  audio_generated_at: string | null
  vision_board_completed: boolean
  vision_board_completed_at: string | null
  first_journal_entry: boolean
  first_journal_entry_at: string | null
  
  // Phase 4: Calibration & Launch
  calibration_call_completed: boolean
  calibration_call_completed_at: string | null
  activation_protocol_completed: boolean
  activation_protocol_completed_at: string | null
}

interface IntensiveStep {
  id: string
  title: string
  description: string
  icon: any
  phase: string
  completed: boolean
  completedAt: string | null
  href: string
  locked: boolean
}

export default function IntensiveDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [intensive, setIntensive] = useState<IntensivePurchase | null>(null)
  const [checklist, setChecklist] = useState<IntensiveChecklist | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [hoursRemaining, setHoursRemaining] = useState<number>(72)

  useEffect(() => {
    loadIntensiveData()
  }, [])

  useEffect(() => {
    if (intensive?.activation_deadline) {
      const timer = setInterval(() => {
        updateTimeRemaining()
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [intensive])

  const loadIntensiveData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get active intensive purchase
      const { data: intensiveData, error: intensiveError } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (intensiveError || !intensiveData) {
        console.error('No active intensive found:', intensiveError)
        router.push('/#pricing')
        return
      }

      setIntensive(intensiveData)

      // Get or create checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (checklistError) {
        console.error('Error loading checklist:', checklistError)
      } else {
        setChecklist(checklistData)
      }

      updateTimeRemaining(intensiveData.activation_deadline)
    } catch (error) {
      console.error('Error loading intensive data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = (deadline?: string | null) => {
    if (!deadline) {
      setTimeRemaining('')
      setHoursRemaining(72)
      return
    }

    const deadlineStr = deadline || intensive?.activation_deadline || ''
    const deadlineDate = new Date(deadlineStr + (deadlineStr.includes('Z') ? '' : 'Z'))
    const now = new Date()
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeRemaining('') // Timer expired, just hide it
      setHoursRemaining(0)
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setHoursRemaining(hours)
    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
  }

  const handleStart = async () => {
    if (!intensive) return
    
    const result = await startIntensive(intensive.id)
    if (result.success) {
      // Reload data to get updated intensive with started_at and deadline
      await loadIntensiveData()
    } else {
      alert('Failed to start intensive: ' + result.error)
    }
  }

  const handleComplete = async () => {
    if (!intensive) return
    
    const result = await completeIntensive(intensive.id)
    if (result.success) {
      // Redirect to main dashboard
      router.push('/dashboard')
    } else {
      alert('Failed to complete intensive: ' + result.error)
    }
  }

  const getSteps = (): IntensiveStep[] => {
    if (!checklist) return []

    return [
      // Phase 1: Foundation
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Set up your personal info, goals, and values',
        icon: User,
        phase: 'Foundation',
        completed: checklist.profile_completed,
        completedAt: checklist.profile_completed_at,
        href: '/profile/active/edit',
        locked: false
      },
      {
        id: 'assessment',
        title: 'Take Vibration Assessment',
        description: 'Discover your current vibration score and insights',
        icon: ClipboardCheck,
        phase: 'Foundation',
        completed: checklist.assessment_completed,
        completedAt: checklist.assessment_completed_at,
        href: '/assessment',
        locked: !checklist.profile_completed
      },
      {
        id: 'schedule_call',
        title: 'Book Your Calibration Call',
        description: 'Schedule your 1-on-1 vision calibration session',
        icon: Calendar,
        phase: 'Foundation',
        completed: checklist.call_scheduled,
        completedAt: checklist.call_scheduled_at,
        href: '/intensive/schedule-call',
        locked: !checklist.assessment_completed
      },
      
      // Phase 2: Vision Creation
      {
        id: 'build_vision',
        title: 'Build Your Life Vision',
        description: 'Work with VIVA to create your comprehensive life vision',
        icon: Sparkles,
        phase: 'Vision Creation',
        completed: checklist.vision_built,
        completedAt: checklist.vision_built_at,
        href: '/vision/build',
        locked: !checklist.call_scheduled
      },
      {
        id: 'refine_vision',
        title: 'Refine Your Vision',
        description: 'Enhance your vision with specific details and clarity',
        icon: Wand2,
        phase: 'Vision Creation',
        completed: checklist.vision_refined,
        completedAt: checklist.vision_refined_at,
        href: '/intensive/refine-vision',
        locked: !checklist.vision_built
      },
      
      // Phase 3: Activation Tools
      {
        id: 'generate_audio',
        title: 'Generate Vision Audio',
        description: 'Create your personalized manifestation audio',
        icon: Music,
        phase: 'Activation Tools',
        completed: checklist.audio_generated,
        completedAt: checklist.audio_generated_at,
        href: '/life-vision?action=audio',
        locked: !checklist.vision_refined
      },
      {
        id: 'vision_board',
        title: 'Create Vision Board',
        description: 'Build your visual representation (one image per life area)',
        icon: ImageIcon,
        phase: 'Activation Tools',
        completed: checklist.vision_board_completed,
        completedAt: checklist.vision_board_completed_at,
        href: '/vision-board',
        locked: !checklist.vision_refined
      },
      {
        id: 'journal',
        title: 'First Journal Entry',
        description: 'Reflect on your vision activation experience',
        icon: BookOpen,
        phase: 'Activation Tools',
        completed: checklist.first_journal_entry,
        completedAt: checklist.first_journal_entry_at,
        href: '/journal',
        locked: !checklist.vision_board_completed
      },
      
      // Phase 4: Calibration & Launch
      {
        id: 'calibration_call',
        title: 'Attend Calibration Call',
        description: 'Meet with your coach to review and activate',
        icon: Video,
        phase: 'Calibration & Launch',
        completed: checklist.calibration_call_completed,
        completedAt: checklist.calibration_call_completed_at,
        href: '/intensive/call-prep',
        locked: !checklist.first_journal_entry
      },
      {
        id: 'activation',
        title: 'Complete Activation Protocol',
        description: 'Set up your daily practice and next steps',
        icon: Rocket,
        phase: 'Calibration & Launch',
        completed: checklist.activation_protocol_completed,
        completedAt: checklist.activation_protocol_completed_at,
        href: '/intensive/activation-protocol',
        locked: !checklist.calibration_call_completed
      }
    ]
  }

  const getProgress = () => {
    const steps = getSteps()
    const completed = steps.filter(s => s.completed).length
    return Math.round((completed / steps.length) * 100)
  }

  const getNextStep = () => {
    const steps = getSteps()
    return steps.find(s => !s.completed && !s.locked)
  }

  const getCurrentPhase = () => {
    const nextStep = getNextStep()
    if (!nextStep) return 'Completed'
    return nextStep.phase
  }

  // Calculate completion time if applicable
  const getCompletionTimeHours = () => {
    if (!intensive?.started_at || !checklist) return undefined
    
    const started = new Date(intensive.started_at)
    const now = new Date()
    const hours = (now.getTime() - started.getTime()) / (1000 * 60 * 60)
    return hours
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!intensive || !checklist) {
    return (
      <Container>
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">No Active Intensive</h2>
          <p className="text-neutral-400 mb-6 text-sm md:text-base">
            You don&apos;t have an active intensive purchase.
          </p>
          <Button size="sm" onClick={() => router.push('/#pricing')}>
            View Intensive Options
          </Button>
        </Card>
      </Container>
    )
  }

  // STATE 1: Not Started Yet
  if (!intensive.started_at) {
    return <IntensiveWelcomeScreen onStart={handleStart} />
  }

  const progress = getProgress()
  
  // STATE 2: 100% Complete - Show Celebration
  if (progress === 100) {
    return (
      <IntensiveCompletionScreen 
        onComplete={handleComplete}
        completionTimeHours={getCompletionTimeHours()}
        startedAt={intensive.started_at}
      />
    )
  }

  // STATE 3: In Progress - Show Dashboard
  const steps = getSteps()
  const nextStep = getNextStep()
  const currentPhase = getCurrentPhase()

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Your Activation Journey"
          subtitle={`Current Phase: ${currentPhase}`}
        >
          <Badge variant="premium">
            <Clock className="w-4 h-4 inline mr-2" />
            Activation Intensive
          </Badge>
        </PageHero>

        {/* Countdown Timer */}
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              {timeRemaining && hoursRemaining > 0 ? (
                <>
                  <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                    Time Remaining
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-primary-500">{timeRemaining}</p>
                  <p className="text-xs md:text-sm text-neutral-400 mt-2">
                    Most people activate in 72 hours
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base md:text-lg font-semibold mb-2">
                    Keep Going!
                  </h3>
                  <p className="text-sm md:text-base text-neutral-400">
                    You&apos;re making great progress. Complete your remaining steps to unlock the platform.
                  </p>
                </>
              )}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs md:text-sm text-neutral-400 mb-2">Overall Progress</p>
              <p className="text-3xl md:text-4xl font-bold text-secondary-500">{progress}%</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-2">
                {steps.filter(s => s.completed).length} of {steps.length} steps
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <ProgressBar 
              value={progress} 
              variant="primary"
              className="h-3"
            />
          </div>
        </Card>

        {/* Next Action */}
        {nextStep && (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-accent-500/10 to-purple-500/10 border-accent-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <nextStep.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <Badge variant="premium" className="mb-2">Next Step</Badge>
                  <h3 className="text-xl md:text-2xl font-bold mb-1">{nextStep.title}</h3>
                  <p className="text-sm md:text-base text-neutral-400">{nextStep.description}</p>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => router.push(nextStep.href)}
                className="w-full sm:w-auto"
              >
                Continue
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step Checklist by Phase */}
        <div className="space-y-8">
          {['Foundation', 'Vision Creation', 'Activation Tools', 'Calibration & Launch'].map(phase => {
            const phaseSteps = steps.filter(s => s.phase === phase)
            const phaseCompleted = phaseSteps.filter(s => s.completed).length
            const phaseProgress = Math.round((phaseCompleted / phaseSteps.length) * 100)

            return (
              <div key={phase}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">{phase}</h2>
                  <Badge variant={phaseProgress === 100 ? 'success' : 'info'}>
                    {phaseCompleted}/{phaseSteps.length} Complete
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {phaseSteps.map((step, index) => (
                    <Card 
                      key={step.id}
                      variant={step.completed ? 'default' : 'outlined'}
                      className={`
                        p-4 md:p-6 transition-all duration-300
                        ${step.locked ? 'opacity-50' : 'hover:-translate-y-1'}
                        ${step.completed ? 'border-primary-500/50 bg-primary-500/5' : ''}
                      `}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className={`
                            w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                            ${step.completed ? 'bg-primary-500' : step.locked ? 'bg-neutral-700' : 'bg-secondary-500'}
                          `}>
                            {step.completed ? (
                              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            ) : (
                              <step.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-semibold mb-1 flex items-center gap-2">
                              {step.title}
                              {step.locked && <Lock className="w-3 h-3 md:w-4 md:h-4 text-neutral-500" />}
                            </h3>
                            <p className="text-xs md:text-sm text-neutral-400">{step.description}</p>
                            {step.completedAt && (
                              <p className="text-xs text-primary-500 mt-1">
                                Completed {new Date(step.completedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {step.locked && (
                            <div className="flex items-center gap-2 text-neutral-500">
                              <Lock className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="text-xs md:text-sm">Locked</span>
                            </div>
                          )}
                          
                          {!step.locked && !step.completed && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(step.href)}
                              className="w-full sm:w-auto"
                            >
                              Start
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                          
                          {step.completed && (
                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
