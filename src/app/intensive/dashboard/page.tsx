'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { completeIntensive } from '@/lib/intensive/utils-client'
import { checkUserHasPassword } from '@/lib/auth/check-password'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { IntensiveCompletionScreen } from '@/components/IntensiveCompletionScreen'
import { getStepInfo, getNextStep } from '@/lib/intensive/step-mapping'
import { toast } from 'sonner'
import { 
  Clock, 
  CheckCircle, 
  User,
  ClipboardCheck,
  Calendar,
  Sparkles,
  Wand2,
  Music,
  Mic,
  Sliders,
  ImageIcon,
  BookOpen,
  Video,
  Rocket,
  ArrowRight,
  AlertCircle,
  Lock,
  Eye,
  Settings,
  FileText,
  Unlock,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'

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
import { fetchAssessments } from '@/lib/services/assessmentService'

interface IntensivePurchase {
  id: string
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
  status: string
  started_at: string | null
  
  // Phase 1: Setup (Steps 1-2)
  // Step 1 (Settings) is checked via user_accounts table directly
  intake_completed: boolean
  intake_completed_at: string | null
  
  // Phase 2: Foundation (Steps 3-4)
  profile_completed: boolean
  profile_completed_at: string | null
  assessment_completed: boolean
  assessment_completed_at: string | null
  
  // Phase 3: Vision Creation (Steps 5-6)
  vision_built: boolean
  vision_built_at: string | null
  vision_refined: boolean
  vision_refined_at: string | null
  
  // Phase 4: Audio (Steps 7-9)
  audio_generated: boolean
  audio_generated_at: string | null
  voice_recording_skipped: boolean
  voice_recording_skipped_at: string | null
  audios_generated: boolean
  audios_generated_at: string | null
  
  // Phase 5: Activation (Steps 10-12)
  vision_board_completed: boolean
  vision_board_completed_at: string | null
  first_journal_entry: boolean
  first_journal_entry_at: string | null
  call_scheduled: boolean
  call_scheduled_at: string | null
  
  // Phase 6: Completion (Steps 13-14)
  activation_protocol_completed: boolean
  activation_protocol_completed_at: string | null
  unlock_completed: boolean
  unlock_completed_at: string | null
}

interface IntensiveStep {
  id: string
  stepNumber: number
  title: string
  description: string
  icon: any
  phase: string
  completed: boolean
  completedAt: string | null
  href: string
  viewHref: string // URL to view completed step
  locked: boolean
  canSkip?: boolean // Some steps can be skipped
  actionLabel?: string // e.g. "Start Assessment", "Continue Assessment"
  viewLabel?: string // e.g. "View Results"
}

function IntensiveDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const previewMode = searchParams.get('preview')
  const completedStep = searchParams.get('completed')
  const justStarted = searchParams.get('started')
  const [loading, setLoading] = useState(true)
  const [intensive, setIntensive] = useState<IntensivePurchase | null>(null)
  const [checklist, setChecklist] = useState<IntensiveChecklist | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [hoursRemaining, setHoursRemaining] = useState<number>(72)
  const [settingsComplete, setSettingsComplete] = useState(false) // Step 1 from user_accounts
  const [hasVoiceRecordings, setHasVoiceRecordings] = useState(false) // Step 8: actual user voice recordings
  const [assessmentInProgressId, setAssessmentInProgressId] = useState<string | null>(null)
  const [assessmentLatestCompletedId, setAssessmentLatestCompletedId] = useState<string | null>(null)
  const toastShownRef = useRef(false) // Prevent duplicate toasts

  useEffect(() => {
    loadIntensiveData()
  }, [])
  
  // Show toast notification when redirected after starting or completing a step
  useEffect(() => {
    if (toastShownRef.current) return
    
    const url = new URL(window.location.href)
    
    // Custom toast styling for intensive completion notifications
    const successToastStyle = {
      background: 'linear-gradient(135deg, #0a2a1a 0%, #1F1F1F 100%)',
      border: '2px solid #199D67',
      color: '#FFFFFF',
      borderRadius: '12px',
      padding: '16px',
    }
    
    // Handle "just started" toast
    if (justStarted) {
      toastShownRef.current = true
      toast.success('Activation Intensive started', {
        duration: 5000,
        icon: <CheckCircle className="w-5 h-5 text-[#39FF14]" />,
        style: successToastStyle,
      })
      url.searchParams.delete('started')
      window.history.replaceState({}, '', url.toString())
      return
    }
    
    // Handle step completion toast
    if (completedStep) {
      toastShownRef.current = true
      
      const stepInfo = getStepInfo(completedStep)
      const nextStepInfo = getNextStep()
      
      if (stepInfo) {
        const message = nextStepInfo 
          ? `Step ${stepInfo.stepNumber} of 14 complete – "${stepInfo.title}"\nYour next step, "${nextStepInfo.title}," is now unlocked.`
          : `Step ${stepInfo.stepNumber} of 14 complete – "${stepInfo.title}"`
        
        toast.success(message, {
          duration: 5000,
          icon: <CheckCircle className="w-5 h-5 text-[#39FF14]" />,
          style: successToastStyle,
        })
        
        url.searchParams.delete('completed')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [justStarted, completedStep])

  useEffect(() => {
    // Use checklist.started_at as source of truth for timer
    if (checklist?.started_at) {
      const timer = setInterval(() => {
        updateTimeRemaining()
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [checklist])

  const loadIntensiveData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Guard: ensure user has set a password before accessing intensive
      // Super admins bypass this check
      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)
      if (!isSuperAdmin) {
        const hasPassword = await checkUserHasPassword(supabase, user)
        if (!hasPassword) {
          window.location.href = '/auth/setup-password'
          return
        }
      }

      console.log('User ID:', user.id)

      // Check Step 1 (Settings) completion from user_accounts
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, email, phone, profile_picture_url')
        .eq('id', user.id)
        .single()

      if (accountData) {
        const hasFirstName = !!accountData.first_name?.trim()
        const hasLastName = !!accountData.last_name?.trim()
        const hasEmail = !!accountData.email?.trim()
        const hasPhone = !!accountData.phone?.trim()
        // Profile picture is optional but tracked
        setSettingsComplete(hasFirstName && hasLastName && hasEmail && hasPhone)
      }

      // Get active intensive checklist (source of truth)
      const { data: checklistData, error: checklistError } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('📋 Checklist data:', checklistData, 'Error:', checklistError)

      if (checklistError || !checklistData) {
        // Allow super_admin to access without enrollment
        if (isSuperAdmin) {
          // Check for preview mode: ?preview=complete shows completion screen
          const showComplete = previewMode === 'complete'
          const mockTimestamp = new Date().toISOString()
          
          // Set mock data for super_admin testing
          setSettingsComplete(true)
          setChecklist({
            id: 'super-admin-test',
            intensive_id: 'super-admin-test',
            user_id: user.id,
            status: 'in_progress',
            started_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
            intake_completed: showComplete ? true : true,
            intake_completed_at: showComplete ? mockTimestamp : null,
            profile_completed: showComplete ? true : true,
            profile_completed_at: showComplete ? mockTimestamp : null,
            assessment_completed: showComplete ? true : true,
            assessment_completed_at: showComplete ? mockTimestamp : null,
            vision_built: showComplete ? true : false,
            vision_built_at: showComplete ? mockTimestamp : null,
            vision_refined: showComplete ? true : false,
            vision_refined_at: showComplete ? mockTimestamp : null,
            audio_generated: showComplete ? true : false,
            audio_generated_at: showComplete ? mockTimestamp : null,
            audios_generated: showComplete ? true : false,
            audios_generated_at: showComplete ? mockTimestamp : null,
            vision_board_completed: showComplete ? true : false,
            vision_board_completed_at: showComplete ? mockTimestamp : null,
            first_journal_entry: showComplete ? true : false,
            first_journal_entry_at: showComplete ? mockTimestamp : null,
            call_scheduled: showComplete ? true : false,
            call_scheduled_at: showComplete ? mockTimestamp : null,
            activation_protocol_completed: showComplete ? true : false,
            activation_protocol_completed_at: showComplete ? mockTimestamp : null,
            unlock_completed: showComplete ? true : false,
            unlock_completed_at: showComplete ? mockTimestamp : null,
          } as IntensiveChecklist)
          setLoading(false)
          return
        }
        console.error('No active intensive found:', checklistError)
        router.push('/#pricing')
        return
      }

      setChecklist(checklistData)

      // Fetch assessment state for conditional step labels (Start / Continue / View Results)
      try {
        const { assessments } = await fetchAssessments()
        const inProgress = assessments?.find((a: { status: string }) => a.status === 'in_progress')
        const completedList = assessments?.filter((a: { status: string }) => a.status === 'completed') || []
        const sortedCompleted = [...completedList].sort((a, b) => {
          const tA = (a as unknown as { completed_at?: string }).completed_at ? new Date((a as unknown as { completed_at: string }).completed_at).getTime() : 0
          const tB = (b as unknown as { completed_at?: string }).completed_at ? new Date((b as unknown as { completed_at: string }).completed_at).getTime() : 0
          return tB - tA
        })
        setAssessmentInProgressId(inProgress?.id ?? null)
        setAssessmentLatestCompletedId(sortedCompleted[0]?.id ?? null)
      } catch (e) {
        console.error('Error fetching assessments for dashboard:', e)
      }

      // Get intensive purchase for reference
      const { data: intensiveData } = await supabase
        .from('order_items')
        .select('id, payment_plan, activation_deadline, started_at, completion_status, completed_at, created_at')
        .eq('id', checklistData.intensive_id)
        .single()

      console.log('💳 Purchase data:', intensiveData)

      if (intensiveData) {
        setIntensive(intensiveData)
      }

      // Check for actual user voice recordings (Step 8)
      // User recordings have voice_id = 'user_voice'
      const { count: voiceRecordingCount } = await supabase
        .from('audio_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('voice_id', 'user_voice')
        .eq('status', 'completed')
      
      setHasVoiceRecordings((voiceRecordingCount || 0) > 0)

      // Verify Vision Board completion (Step 10)
      // If vision_board_completed is false but user has items in all 12 categories, mark complete
      if (!checklistData.vision_board_completed) {
        const { data: visionBoardItems } = await supabase
          .from('vision_board_items')
          .select('categories')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (visionBoardItems && visionBoardItems.length > 0) {
          const coveredCategories = new Set<string>()
          visionBoardItems.forEach(item => {
            if (item.categories && Array.isArray(item.categories)) {
              item.categories.forEach((cat: string) => coveredCategories.add(cat))
            }
          })

          // 12 life categories (excluding forward and conclusion)
          const LIFE_CATEGORIES = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']
          const allCategoriesCovered = LIFE_CATEGORIES.every(cat => coveredCategories.has(cat))

          if (allCategoriesCovered) {
            console.log('🎨 [DASHBOARD] All 12 categories covered, marking vision_board_completed')
            const now = new Date().toISOString()
            await supabase
              .from('intensive_checklist')
              .update({
                vision_board_completed: true,
                vision_board_completed_at: now
              })
              .eq('id', checklistData.id)

            // Update local state
            checklistData.vision_board_completed = true
            checklistData.vision_board_completed_at = now
          }
        }
      }

      // Verify Journal completion (Step 11)
      // If first_journal_entry is false but user has at least one journal entry, mark complete
      if (!checklistData.first_journal_entry) {
        const { count: journalCount } = await supabase
          .from('journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if ((journalCount || 0) > 0) {
          console.log('📓 [DASHBOARD] Journal entry found, marking first_journal_entry')
          const now = new Date().toISOString()
          await supabase
            .from('intensive_checklist')
            .update({
              first_journal_entry: true,
              first_journal_entry_at: now
            })
            .eq('id', checklistData.id)

          // Update local state
          checklistData.first_journal_entry = true
          checklistData.first_journal_entry_at = now
        }
      }

      // Timer will be calculated from checklist.started_at
      // Pass the value directly since state hasn't updated yet
      updateTimeRemaining(checklistData?.started_at)
    } catch (error) {
      console.error('Error loading intensive data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 72 hours in milliseconds
  const INTENSIVE_DURATION_MS = 72 * 60 * 60 * 1000

  const updateTimeRemaining = (startedAtOverride?: string | null) => {
    // Source of truth: intensive_checklist.started_at
    const startedAt = startedAtOverride ?? checklist?.started_at
    if (!startedAt) {
      setTimeRemaining('')
      setHoursRemaining(72)
      return
    }

    // Ensure we parse the timestamp as UTC (Postgres returns timestamp without timezone)
    // If the string doesn't end with 'Z', append it to force UTC interpretation
    const utcStartedAt = startedAt.endsWith('Z') ? startedAt : startedAt + 'Z'
    const startTime = new Date(utcStartedAt).getTime()
    const endTime = startTime + INTENSIVE_DURATION_MS
    const now = Date.now()
    const diff = endTime - now

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
      // Phase 1: Setup (Steps 1-2)
      {
        id: 'settings',
        stepNumber: 1,
        title: 'Account Settings',
        description: 'Set up your name, email, phone, and profile picture',
        icon: Settings,
        phase: 'Setup',
        completed: settingsComplete,
        completedAt: null,
        href: '/account/settings',
        viewHref: '/account/settings',
        locked: false
      },
      {
        id: 'intake',
        stepNumber: 2,
        title: 'Baseline Intake',
        description: 'Complete your activation intake questionnaire',
        icon: FileText,
        phase: 'Setup',
        completed: checklist.intake_completed || false,
        completedAt: checklist.intake_completed_at,
        href: '/intensive/intake',
        viewHref: '/intensive/intake',
        locked: !settingsComplete
      },
      
      // Phase 2: Foundation (Steps 3-4)
      {
        id: 'profile',
        stepNumber: 3,
        title: 'Create Your Profile',
        description: 'Build your comprehensive life profile across all categories',
        icon: User,
        phase: 'Foundation',
        completed: checklist.profile_completed,
        completedAt: checklist.profile_completed_at,
        href: '/profile/new',
        viewHref: '/profile/new',
        locked: !(checklist.intake_completed || false)
      },
      {
        id: 'assessment',
        stepNumber: 4,
        title: 'Vibration Assessment',
        description: 'Discover your current vibration score and insights',
        icon: ClipboardCheck,
        phase: 'Foundation',
        completed: checklist.assessment_completed,
        completedAt: checklist.assessment_completed_at,
        href: checklist.assessment_completed && assessmentLatestCompletedId
          ? `/assessment/${assessmentLatestCompletedId}/results`
          : assessmentInProgressId
            ? `/assessment/${assessmentInProgressId}/in-progress`
            : '/assessment/new',
        viewHref: assessmentLatestCompletedId
          ? `/assessment/${assessmentLatestCompletedId}/results`
          : '/assessment/new',
        locked: !checklist.profile_completed,
        actionLabel: assessmentInProgressId ? 'Continue Assessment' : 'Start Assessment',
        viewLabel: 'View Results'
      },
      
      // Phase 3: Vision Creation (Steps 5-6)
      {
        id: 'build_vision',
        stepNumber: 5,
        title: 'Build Your Life Vision',
        description: 'Create your comprehensive vision across all 12 life categories',
        icon: Sparkles,
        phase: 'Vision Creation',
        completed: checklist.vision_built,
        completedAt: checklist.vision_built_at,
        href: '/life-vision/new',
        viewHref: '/life-vision',
        locked: !checklist.assessment_completed
      },
      {
        id: 'refine_vision',
        stepNumber: 6,
        title: 'Refine Your Vision',
        description: 'Enhance your vision with VIVA for deeper clarity',
        icon: Wand2,
        phase: 'Vision Creation',
        completed: checklist.vision_refined,
        completedAt: checklist.vision_refined_at,
        href: '/life-vision/refine/new',
        viewHref: '/life-vision',
        locked: !checklist.vision_built
      },
      
      // Phase 4: Audio (Steps 7-9)
      {
        id: 'generate_audio',
        stepNumber: 7,
        title: 'Generate Vision Audio',
        description: 'Create voice-only audio of your vision',
        icon: Music,
        phase: 'Audio',
        completed: checklist.audio_generated,
        completedAt: checklist.audio_generated_at,
        href: '/life-vision/audio/generate/new',
        viewHref: '/life-vision',
        locked: !checklist.vision_refined
      },
      {
        id: 'record_audio',
        stepNumber: 8,
        title: 'Record Your Voice',
        description: 'Optionally record sections in your own voice',
        icon: Mic,
        phase: 'Audio',
        completed: hasVoiceRecordings || checklist.voice_recording_skipped || checklist.audios_generated, // Complete if recorded OR explicitly skipped OR moved past (Step 9 complete)
        completedAt: hasVoiceRecordings ? checklist.audio_generated_at : checklist.voice_recording_skipped_at,
        href: '/life-vision/audio/record/new',
        viewHref: '/life-vision',
        locked: !checklist.audio_generated,
        canSkip: true
      },
      {
        id: 'mix_audio',
        stepNumber: 9,
        title: 'Create Audio Mix',
        description: 'Mix your vision audio with music and frequencies',
        icon: Sliders,
        phase: 'Audio',
        completed: checklist.audios_generated || false,
        completedAt: checklist.audios_generated_at,
        href: '/life-vision/audio/mix/new',
        viewHref: '/life-vision',
        locked: !(hasVoiceRecordings || checklist.voice_recording_skipped)
      },
      
      // Phase 5: Activation (Steps 10-12)
      {
        id: 'vision_board',
        stepNumber: 10,
        title: 'Create Vision Board',
        description: 'Build your visual board with one image per life category',
        icon: ImageIcon,
        phase: 'Activation',
        completed: checklist.vision_board_completed,
        completedAt: checklist.vision_board_completed_at,
        href: '/vision-board/resources',
        viewHref: '/vision-board',
        locked: !checklist.audios_generated // Requires Audio Mix (Step 9) to be complete
      },
      {
        id: 'journal',
        stepNumber: 11,
        title: 'First Journal Entry',
        description: 'Start your conscious creation journal practice',
        icon: BookOpen,
        phase: 'Activation',
        completed: checklist.first_journal_entry,
        completedAt: checklist.first_journal_entry_at,
        href: '/journal/resources',
        viewHref: '/journal',
        locked: !checklist.vision_board_completed
      },
      {
        id: 'schedule_call',
        stepNumber: 12,
        title: 'Book Calibration Call',
        description: 'Schedule your 1-on-1 vision calibration session',
        icon: Calendar,
        phase: 'Activation',
        completed: checklist.call_scheduled,
        completedAt: checklist.call_scheduled_at,
        href: '/intensive/schedule-call',
        viewHref: '/intensive/call-prep',
        locked: !checklist.first_journal_entry
      },
      
      // Phase 6: Completion (Steps 13-14)
      {
        id: 'activation_protocol',
        stepNumber: 13,
        title: 'My Activation Plan',
        description: 'Your personalized 28-day MAP',
        icon: Rocket,
        phase: 'Completion',
        completed: checklist.activation_protocol_completed,
        completedAt: checklist.activation_protocol_completed_at,
        href: '/map?intensive=true',
        viewHref: '/map',
        locked: !checklist.call_scheduled
      },
      {
        id: 'unlock',
        stepNumber: 14,
        title: 'Full Platform Unlock',
        description: 'Unlock the complete Vibration Fit platform',
        icon: Unlock,
        phase: 'Completion',
        completed: checklist.unlock_completed || false,
        completedAt: checklist.unlock_completed_at,
        href: '/intensive/intake/unlock',
        viewHref: '/dashboard',
        locked: !checklist.activation_protocol_completed
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
    if (!checklist?.started_at) return undefined
    
    // Ensure we parse the timestamp as UTC (Postgres returns timestamp without timezone)
    const utcStartedAt = checklist.started_at.endsWith('Z') ? checklist.started_at : checklist.started_at + 'Z'
    const started = new Date(utcStartedAt)
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

  const progress = getProgress()
  
  // STATE 2: 100% Complete - Show Celebration
  if (progress === 100) {
    return (
      <IntensiveCompletionScreen 
        onComplete={handleComplete}
        completionTimeHours={getCompletionTimeHours()}
        startedAt={checklist.started_at ?? undefined}
      />
    )
  }

  // STATE 3: In Progress - Show Dashboard
  const steps = getSteps()
  const nextStep = getNextStep()
  const currentPhase = getCurrentPhase()
  
  // Calculate current step number (first incomplete step or 14 if all complete)
  const currentStepNumber = nextStep ? nextStep.stepNumber : 14

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="72-Hour Activation Intensive"
          title="Your 14-Step Activation Path"
          subtitle="Follow each step in order. Complete all 14 to graduate and unlock your Advanced Audio Suite, Alignment Gym, and Vibe Tribe access."
        >
          {/* Phase pill */}
          <div className="flex justify-center">
            <Badge variant="premium" className="text-xs md:text-sm">
              Current Phase: {currentPhase} · Step {currentStepNumber} of 14
            </Badge>
          </div>
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
          <Card variant="elevated" className="!p-0 overflow-hidden border-accent-500/30">
            <div className="flex">
              {/* Colored left strip with centered number */}
              <div className="w-14 md:w-16 flex-shrink-0 flex items-center justify-center bg-accent-500">
                <span className="text-lg md:text-xl font-bold text-black">
                  {nextStep.stepNumber}
                </span>
              </div>
              
              {/* Content area */}
              <div className="flex-1 p-4 md:p-5 bg-gradient-to-br from-accent-500/5 to-purple-500/5 relative">
                {/* Mobile: Badge at top right */}
                <div className="absolute top-3 right-3 md:hidden">
                  <Badge variant="premium">Next Step</Badge>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                  <div className="flex-1 min-w-0 pr-24 md:pr-0">
                    <div className="md:flex md:items-center md:gap-2">
                      <h3 className="text-base md:text-lg font-semibold">{nextStep.title}</h3>
                      <span className="hidden md:block">
                        <Badge variant="premium">Next Step</Badge>
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-neutral-400 mt-1">{nextStep.description}</p>
                  </div>
                  
                  {/* Mobile button - full width at bottom */}
                  <div className="md:hidden mt-3">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => router.push(nextStep.href)}
                      className="w-full justify-center"
                    >
                      {nextStep.actionLabel ?? 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Desktop button */}
                  <div className="hidden md:block flex-shrink-0">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => router.push(nextStep.href)}
                    >
                      {nextStep.actionLabel ?? 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step Checklist by Phase */}
        <div className="space-y-8">
          {['Setup', 'Foundation', 'Vision Creation', 'Audio', 'Activation', 'Completion'].map(phase => {
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
                  {phaseSteps.map((step) => (
                    <Card 
                      key={step.id}
                      variant={step.completed ? 'default' : 'outlined'}
                      className={`
                        !p-0 overflow-hidden transition-all duration-300
                        ${step.locked ? 'opacity-50' : 'hover:-translate-y-1'}
                        ${step.completed ? 'border-primary-500/50' : ''}
                        ${!step.completed && !step.locked ? 'border-accent-500/30' : ''}
                      `}
                    >
                      <div className="flex">
                        {/* Colored left strip with centered number */}
                        <div className={`
                          w-14 md:w-16 flex-shrink-0 flex items-center justify-center
                          ${step.completed ? 'bg-primary-500' : step.locked ? 'bg-neutral-700' : 'bg-accent-500'}
                        `}>
                          <span className={`text-lg md:text-xl font-bold ${step.locked ? 'text-white' : 'text-black'}`}>
                            {step.stepNumber}
                          </span>
                        </div>
                        
                        {/* Content area */}
                        <div className={`
                          flex-1 p-4 md:p-5 md:flex md:items-center relative
                          ${step.completed ? 'bg-primary-500/5' : ''}
                          ${!step.completed && !step.locked ? 'bg-gradient-to-br from-accent-500/5 to-purple-500/5' : ''}
                        `}>
                          {/* Mobile-only top right icons (checkmark/lock) - absolutely positioned */}
                          <div className="absolute top-3 right-3 md:hidden flex items-center gap-2">
                            {step.locked && (
                              <div className="flex items-center gap-2 text-neutral-500">
                                <Lock className="w-4 h-4" />
                                <span className="text-xs">Locked</span>
                              </div>
                            )}
                            {step.completed && (
                              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                            {/* Title and description - centered on mobile */}
                            <div className={`flex-1 min-w-0 flex flex-col md:block ${step.locked ? 'justify-center min-h-[50px]' : ''}`}>
                              <div className="pr-20 md:pr-0">
                                <div className="md:flex md:items-center md:gap-2">
                                  <h3 className="text-base md:text-lg font-semibold">
                                    {step.title}
                                  </h3>
                                  {/* Desktop badge - inline with title */}
                                  {step.canSkip && !step.completed && (
                                    <span className="hidden md:block">
                                      <Badge variant="neutral" className="text-xs">Optional</Badge>
                                    </span>
                                  )}
                                </div>
                                {/* Mobile badge - below title */}
                                {step.canSkip && !step.completed && (
                                  <div className="block md:hidden mt-1">
                                    <Badge variant="neutral" className="text-xs">Optional</Badge>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-neutral-400 mt-1">{step.description}</p>
                              {step.completedAt && (
                                <p className="text-xs text-primary-500 mt-1">
                                  Completed {new Date(step.completedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            {/* Mobile-only bottom full-width button */}
                            {!step.locked && (
                              <div className="md:hidden mt-3">
                                {!step.completed && (
                                  <Button 
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push(step.href)}
                                    className="w-full justify-center"
                                  >
                                    Start
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                )}
                                {step.completed && (
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(step.viewHref)}
                                    className="w-full justify-center"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    {step.viewLabel ?? 'View'}
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {/* Tablet/Desktop buttons - vertically centered */}
                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                              {step.locked && (
                                <div className="flex items-center gap-2 text-neutral-500">
                                  <Lock className="w-5 h-5" />
                                  <span className="text-sm">Locked</span>
                                </div>
                              )}
                              {!step.locked && !step.completed && (
                                <Button 
                                  variant="primary"
                                  size="sm"
                                  onClick={() => router.push(step.href)}
                                >
                                  {step.actionLabel ?? 'Start'}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              )}
                              {step.completed && (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(step.viewHref)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    {step.viewLabel ?? 'View'}
                                  </Button>
                                  <CheckCircle className="w-6 h-6 text-primary-500 flex-shrink-0" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Support Card */}
        <Card className="p-4 md:p-6 border-secondary-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-secondary-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Found a Bug?</h3>
              <p className="text-xs text-neutral-400">Help us improve by reporting any issues you find.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/support">Report</Link>
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

// Wrap with Suspense for useSearchParams
export default function IntensiveDashboard() {
  return (
    <Suspense fallback={
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    }>
      <IntensiveDashboardContent />
    </Suspense>
  )
}
