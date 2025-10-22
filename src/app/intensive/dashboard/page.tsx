'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, 
  CheckCircle, 
  Circle,
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
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge,
  ProgressBar,
  Spinner
} from '@/lib/design-system/components'

interface IntensivePurchase {
  id: string
  user_id: string
  payment_plan: string
  activation_deadline: string
  completion_status: string
  completed_at: string | null
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
  call_scheduled_time: string | null
  
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
        router.push('/pricing-hormozi')
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

  const updateTimeRemaining = (deadline?: string) => {
    const deadlineStr = deadline || intensive?.activation_deadline || ''
    // Ensure deadline is treated as UTC to match database timestamps
    const deadlineDate = new Date(deadlineStr + (deadlineStr.includes('Z') ? '' : 'Z'))
    const now = new Date()
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeRemaining('Expired')
      setHoursRemaining(0)
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setHoursRemaining(hours)
    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
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
        href: '/profile/edit?intensive=true',
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
        href: '/assessment?intensive=true',
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
        href: '/vision/build?intensive=true',
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
        href: '/life-vision?intensive=true&action=audio',
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
        href: '/vision-board?intensive=true',
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
        href: '/journal?intensive=true',
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

  if (loading) {
    return (
      <>
        <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </Container>
      </>
    )
  }

  if (!intensive || !checklist) {
    return (
      <>
        <Container className="py-16">
          <Card className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Intensive</h2>
            <p className="text-neutral-400 mb-6">
              You don't have an active intensive purchase.
            </p>
            <Button onClick={() => router.push('/pricing-hormozi')}>
              View Intensive Options
            </Button>
          </Card>
        </Container>
      </>
    )
  }

  const steps = getSteps()
  const progress = getProgress()
  const nextStep = getNextStep()
  const currentPhase = getCurrentPhase()

  return (
    <>
      <Container size="xl" className="py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="premium" className="mb-4">
            <Clock className="w-4 h-4 inline mr-2" />
            Activation Intensive
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Your Activation Journey
          </h1>
          <p className="text-xl text-neutral-400">
            Current Phase: <span className="text-primary-500">{currentPhase}</span>
          </p>
        </div>

        {/* Countdown Timer */}
        <Card variant="elevated" className="mb-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Remaining
              </h3>
              <p className="text-3xl font-bold text-primary-500">{timeRemaining}</p>
              <p className="text-sm text-neutral-400 mt-2">
                Deadline: {new Date(intensive.activation_deadline).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-400 mb-2">Overall Progress</p>
              <p className="text-4xl font-bold text-secondary-500">{progress}%</p>
              <p className="text-sm text-neutral-400 mt-2">
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

          {hoursRemaining < 24 && hoursRemaining > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <strong>Less than 24 hours remaining!</strong> Complete your intensive to unlock your membership.
              </p>
            </div>
          )}
        </Card>

        {/* Next Action */}
        {nextStep && (
          <Card variant="elevated" className="mb-8 bg-gradient-to-br from-accent-500/10 to-purple-500/10 border-accent-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-accent-500 rounded-2xl flex items-center justify-center">
                  <nextStep.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <Badge variant="premium" className="mb-2">Next Step</Badge>
                  <h3 className="text-2xl font-bold mb-1">{nextStep.title}</h3>
                  <p className="text-neutral-400">{nextStep.description}</p>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => router.push(nextStep.href)}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{phase}</h2>
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
                        transition-all duration-300
                        ${step.locked ? 'opacity-50' : 'hover:-translate-y-1'}
                        ${step.completed ? 'border-primary-500/50 bg-primary-500/5' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${step.completed ? 'bg-primary-500' : step.locked ? 'bg-neutral-700' : 'bg-secondary-500'}
                          `}>
                            {step.completed ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <step.icon className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                              {step.title}
                              {step.locked && <Circle className="w-4 h-4 text-neutral-500" />}
                            </h3>
                            <p className="text-sm text-neutral-400">{step.description}</p>
                            {step.completedAt && (
                              <p className="text-xs text-primary-500 mt-1">
                                Completed {new Date(step.completedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {step.locked && (
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Lock className="w-5 h-5" />
                            <span className="text-sm">Locked</span>
                          </div>
                        )}
                        
                        {!step.locked && !step.completed && (
                          <Button 
                            variant="ghost"
                            onClick={() => router.push(step.href)}
                          >
                            Start
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                        
                        {step.completed && (
                          <CheckCircle className="w-6 h-6 text-primary-500" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <Card variant="elevated" className="mt-8 bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
            <div className="text-center py-8">
              <Rocket className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">🎉 Intensive Complete!</h2>
              <p className="text-xl mb-6">
                Congratulations! You've completed your Activation Intensive.
              </p>
              <p className="text-lg mb-8">
                Your membership is now active. Continue your journey in the dashboard.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

      </Container>
    </>
  )
}
