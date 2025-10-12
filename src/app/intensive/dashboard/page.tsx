'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Sparkles,
  Calendar,
  Headphones,
  Target,
  Zap
} from 'lucide-react'

import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge, 
  ProgressBar 
} from '@/lib/design-system/components'

interface IntensiveData {
  id: string
  user_id: string
  completion_status: 'pending' | 'in_progress' | 'completed' | 'refunded'
  activation_deadline: string
  payment_plan: 'full' | '2pay' | '3pay'
  created_at: string
  started_at: string | null
  completed_at: string | null
}

interface ChecklistData {
  id: string
  intensive_id: string
  
  // Hour 0-1: Instant Start
  intake_completed: boolean
  intake_completed_at: string | null
  
  // Hour 1-24: Draft + Build
  vision_drafted: boolean
  vision_drafted_at: string | null
  builder_completed: boolean
  builder_completed_at: string | null
  
  // Hour 24-36: Record + Calibrate
  calibration_scheduled: boolean
  calibration_scheduled_at: string | null
  calibration_attended: boolean
  calibration_attended_at: string | null
  audios_generated: boolean
  audios_generated_at: string | null
  
  // Hour 36-72: Activate
  activation_protocol_started: boolean
  activation_started_at: string | null
  
  // 7-Day Tracking
  streak_day_1: boolean
  streak_day_2: boolean
  streak_day_3: boolean
  streak_day_4: boolean
  streak_day_5: boolean
  streak_day_6: boolean
  streak_day_7: boolean
  
  created_at: string
}

export default function IntensiveDashboard() {
  const [intensive, setIntensive] = useState<IntensiveData | null>(null)
  const [checklist, setChecklist] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadIntensiveData()
  }, [])

  useEffect(() => {
    if (intensive?.activation_deadline) {
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [intensive])

  const loadIntensiveData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get intensive purchase
      const { data: intensiveData, error: intensiveError } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'in_progress')
        .single()

      if (intensiveError || !intensiveData) {
        console.error('No active intensive found:', intensiveError)
        router.push('/pricing-hormozi')
        return
      }

      setIntensive(intensiveData)

      // Get checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (checklistError) {
        console.error('Checklist error:', checklistError)
      } else {
        setChecklist(checklistData)
      }

    } catch (error) {
      console.error('Error loading intensive data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = () => {
    if (!intensive?.activation_deadline) return

    const deadline = new Date(intensive.activation_deadline)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeRemaining('Time\'s up!')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
  }

  const calculateProgress = () => {
    if (!checklist) return 0

    const totalSteps = 7 // Main completion steps
    let completedSteps = 0

    if (checklist.intake_completed) completedSteps++
    if (checklist.vision_drafted) completedSteps++
    if (checklist.builder_completed) completedSteps++
    if (checklist.calibration_scheduled) completedSteps++
    if (checklist.calibration_attended) completedSteps++
    if (checklist.audios_generated) completedSteps++
    if (checklist.activation_protocol_started) completedSteps++

    return Math.round((completedSteps / totalSteps) * 100)
  }

  const getCurrentPhase = () => {
    if (!checklist) return 'Starting'

    if (!checklist.intake_completed) return 'Hour 0-1: Instant Start'
    if (!checklist.vision_drafted || !checklist.builder_completed) return 'Hour 1-24: Draft + Build'
    if (!checklist.calibration_attended || !checklist.audios_generated) return 'Hour 24-36: Record + Calibrate'
    if (!checklist.activation_protocol_started) return 'Hour 36-72: Activate'
    
    return 'Activated!'
  }

  const getNextAction = () => {
    if (!checklist) return { text: 'Start Your Journey', href: '/intensive/intake' }

    if (!checklist.intake_completed) {
      return { text: 'Complete Intake Form', href: '/intensive/intake' }
    }
    if (!checklist.vision_drafted || !checklist.builder_completed) {
      return { text: 'Build Your Vision', href: '/intensive/builder' }
    }
    if (!checklist.calibration_scheduled) {
      return { text: 'Schedule Calibration', href: '/intensive/calibration' }
    }
    if (!checklist.activation_protocol_started) {
      return { text: 'Start Activation', href: '/intensive/activate' }
    }

    return { text: 'View Progress', href: '/dashboard' }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container size="xl" className="py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-neutral-400 mt-4">Loading your intensive...</p>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (!intensive) {
    return (
      <PageLayout>
        <Container size="xl" className="py-16">
          <Card className="max-w-2xl mx-auto p-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">No Active Intensive</h1>
            <p className="text-neutral-400 mb-8">
              You don't have an active 72-hour intensive. Ready to start your transformation?
            </p>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => router.push('/pricing-hormozi')}
            >
              Start Your 72-Hour Intensive
            </Button>
          </Card>
        </Container>
      </PageLayout>
    )
  }

  const progress = calculateProgress()
  const nextAction = getNextAction()
  const currentPhase = getCurrentPhase()

  return (
    <PageLayout>
      <Container size="xl" className="py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="premium" className="mb-4">
            <Clock className="w-4 h-4 inline mr-2" />
            72-Hour Vision Activation
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Your Intensive Dashboard
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
            Transform your reality in 72 hours. Follow the steps below to activate your vision.
          </p>
        </div>

        {/* Time Remaining */}
        <Card className="max-w-4xl mx-auto p-8 mb-8 border-2 border-primary-500 bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Time Remaining</h2>
            <div className="text-4xl font-bold text-primary-500 mb-4">{timeRemaining}</div>
            <div className="text-neutral-400">
              Deadline: {new Date(intensive.activation_deadline).toLocaleString()}
            </div>
          </div>
        </Card>

        {/* Progress Overview */}
        <Card className="max-w-4xl mx-auto p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Progress Overview</h2>
              <p className="text-neutral-400">Current Phase: {currentPhase}</p>
            </div>
            <Badge variant={progress === 100 ? "success" : "info"}>
              {progress}% Complete
            </Badge>
          </div>
          
          <ProgressBar value={progress} variant="primary" className="mb-6" />
          
          <div className="text-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => router.push(nextAction.href)}
              className="w-full md:w-auto"
            >
              {nextAction.text}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Phase Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          
          {/* Phase 1: Instant Start */}
          <Card className={`p-6 ${checklist?.intake_completed ? 'border-primary-500 bg-primary-500/10' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              {checklist?.intake_completed ? (
                <CheckCircle className="w-6 h-6 text-primary-500" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-500" />
              )}
              <h3 className="font-bold text-white">Hour 0-1</h3>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Instant Start</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Complete intake form and get your AI-generated vision draft
            </p>
            <Button 
              variant={checklist?.intake_completed ? "ghost" : "primary"}
              size="sm"
              onClick={() => router.push('/intensive/intake')}
              disabled={checklist?.intake_completed}
              className="w-full"
            >
              {checklist?.intake_completed ? 'Completed' : 'Start Intake'}
            </Button>
          </Card>

          {/* Phase 2: Draft + Build */}
          <Card className={`p-6 ${checklist?.builder_completed ? 'border-primary-500 bg-primary-500/10' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              {checklist?.builder_completed ? (
                <CheckCircle className="w-6 h-6 text-primary-500" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-500" />
              )}
              <h3 className="font-bold text-white">Hour 1-24</h3>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Draft + Build</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Finalize your vision and create your vision board
            </p>
            <Button 
              variant={checklist?.builder_completed ? "ghost" : "primary"}
              size="sm"
              onClick={() => router.push('/intensive/builder')}
              disabled={!checklist?.intake_completed || checklist?.builder_completed}
              className="w-full"
            >
              {checklist?.builder_completed ? 'Completed' : 'Build Vision'}
            </Button>
          </Card>

          {/* Phase 3: Record + Calibrate */}
          <Card className={`p-6 ${checklist?.calibration_attended ? 'border-primary-500 bg-primary-500/10' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              {checklist?.calibration_attended ? (
                <CheckCircle className="w-6 h-6 text-primary-500" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-500" />
              )}
              <h3 className="font-bold text-white">Hour 24-36</h3>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Record + Calibrate</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Schedule and attend calibration call for personalized audios
            </p>
            <Button 
              variant={checklist?.calibration_attended ? "ghost" : "primary"}
              size="sm"
              onClick={() => router.push('/intensive/calibration')}
              disabled={!checklist?.builder_completed || checklist?.calibration_attended}
              className="w-full"
            >
              {checklist?.calibration_attended ? 'Completed' : 'Schedule Call'}
            </Button>
          </Card>

          {/* Phase 4: Activate */}
          <Card className={`p-6 ${checklist?.activation_protocol_started ? 'border-primary-500 bg-primary-500/10' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              {checklist?.activation_protocol_started ? (
                <CheckCircle className="w-6 h-6 text-primary-500" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-500" />
              )}
              <h3 className="font-bold text-white">Hour 36-72</h3>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Activate</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Start your 7-day activation protocol and begin living your vision
            </p>
            <Button 
              variant={checklist?.activation_protocol_started ? "ghost" : "primary"}
              size="sm"
              onClick={() => router.push('/intensive/activate')}
              disabled={!checklist?.calibration_attended || checklist?.activation_protocol_started}
              className="w-full"
            >
              {checklist?.activation_protocol_started ? 'Activated' : 'Activate'}
            </Button>
          </Card>

        </div>

        {/* Guarantee Reminder */}
        <Card className="max-w-4xl mx-auto p-8 mt-8 border-2 border-primary-500 bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">72-Hour Activation Guarantee</h2>
            <p className="text-neutral-300 mb-6">
              Complete the checklist (intake, builder, calibration, activation protocol) and if your activation isn't live within 72 hours, get a full refund OR apply it as a credit to Vision Pro Annual.
            </p>
            <div className="text-sm text-neutral-400">
              Plus: 14-day unconditional money-back guarantee
            </div>
          </div>
        </Card>

      </Container>
    </PageLayout>
  )
}
