'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/lib/design-system/components'
import { 
  LayoutDashboard,
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
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  Settings,
  FileText,
  Unlock,
  Timer,
  Info,
  Clock
} from 'lucide-react'

type Step = {
  id: string
  stepNumber: number
  title: string
  href: string
  icon: any
  phase: string
  completed: boolean
  locked: boolean
  optional?: boolean
}

type Phase = {
  name: string
  steps: Step[]
}

// 72 hours in milliseconds
const INTENSIVE_DURATION_MS = 72 * 60 * 60 * 1000

export function IntensiveSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsComplete, setSettingsComplete] = useState(false)
  const [intensiveStarted, setIntensiveStarted] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  
  // Refs to preserve scroll position during timer updates
  const navRef = useRef<HTMLElement>(null)
  const scrollPositionRef = useRef(0)

  // Save scroll position before re-render
  useEffect(() => {
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop
    }
  })

  // Restore scroll position after re-render
  useEffect(() => {
    if (navRef.current && scrollPositionRef.current > 0) {
      navRef.current.scrollTop = scrollPositionRef.current
    }
  })

  useEffect(() => {
    loadSteps()
  }, [pathname])

  // Countdown timer effect
  useEffect(() => {
    if (!startedAt) {
      setCountdown(null)
      return
    }

    const calculateCountdown = () => {
      // Ensure we parse the timestamp as UTC (Postgres returns timestamp without timezone)
      // If the string doesn't end with 'Z', append it to force UTC interpretation
      const utcStartedAt = startedAt.endsWith('Z') ? startedAt : startedAt + 'Z'
      const startTime = new Date(utcStartedAt).getTime()
      const endTime = startTime + INTENSIVE_DURATION_MS
      const now = Date.now()
      const remaining = endTime - now

      if (remaining <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

      setCountdown({ hours, minutes, seconds })
    }

    // Calculate immediately
    calculateCountdown()

    // Update every second
    const interval = setInterval(calculateCountdown, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  const loadSteps = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check settings completion from user_accounts (Step 1)
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .single()

      const hasSettings = !!(accountData && 
        accountData.first_name?.trim() && 
        accountData.last_name?.trim() && 
        accountData.email?.trim() && 
        accountData.phone?.trim())
      
      setSettingsComplete(hasSettings)

      // Get intensive checklist (source of truth for all tracking)
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!checklist) return

      // Check if intensive has been started (checklist is source of truth)
      setIntensiveStarted(!!checklist.started_at)
      setStartedAt(checklist.started_at || null)

      // Check for actual user voice recordings (Step 8)
      const { count: voiceRecordingCount } = await supabase
        .from('audio_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('voice_id', 'user_voice')
        .eq('status', 'completed')
      
      const hasVoiceRecordings = (voiceRecordingCount || 0) > 0

      // Verify Vision Board completion (Step 10)
      // If vision_board_completed is false but user has items in all 12 categories, mark complete
      if (!checklist.vision_board_completed) {
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
            console.log('🎨 [SIDEBAR] All 12 categories covered, marking vision_board_completed')
            const now = new Date().toISOString()
            await supabase
              .from('intensive_checklist')
              .update({
                vision_board_completed: true,
                vision_board_completed_at: now
              })
              .eq('id', checklist.id)

            // Update local checklist object for step rendering
            checklist.vision_board_completed = true
          }
        }
      }

      // Verify Journal completion (Step 11)
      // If first_journal_entry is false but user has at least one journal entry, mark complete
      if (!checklist.first_journal_entry) {
        const { count: journalCount } = await supabase
          .from('journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if ((journalCount || 0) > 0) {
          console.log('📓 [SIDEBAR] Journal entry found, marking first_journal_entry')
          const now = new Date().toISOString()
          await supabase
            .from('intensive_checklist')
            .update({
              first_journal_entry: true,
              first_journal_entry_at: now
            })
            .eq('id', checklist.id)

          // Update local checklist object for step rendering
          checklist.first_journal_entry = true
        }
      }

      const stepsList: Step[] = [
        // Phase 0: Start
        { 
          id: 'start', 
          stepNumber: 0,
          title: 'Start Intensive', 
          href: '/intensive/start', 
          icon: Rocket,
          phase: 'Start',
          completed: !!checklist.started_at,
          locked: false // Always accessible
        },
        // Phase 1: Setup
        { 
          id: 'settings', 
          stepNumber: 1,
          title: 'Settings', 
          href: '/account/settings', 
          icon: Settings,
          phase: 'Setup',
          completed: hasSettings,
          locked: !checklist.started_at // Locked until intensive is started
        },
        { 
          id: 'intake', 
          stepNumber: 2,
          title: 'Baseline Intake', 
          href: '/intensive/intake', 
          icon: FileText,
          phase: 'Setup',
          completed: !!checklist.intake_completed,
          locked: !hasSettings 
        },

        // Phase 2: Foundation
        { 
          id: 'profile', 
          stepNumber: 3,
          title: 'Profile', 
          href: '/profile/new', 
          icon: User,
          phase: 'Foundation',
          completed: !!checklist.profile_completed,
          locked: !checklist.intake_completed 
        },
        { 
          id: 'assessment', 
          stepNumber: 4,
          title: 'Assessment', 
          href: '/assessment/new',
          icon: ClipboardCheck,
          phase: 'Foundation',
          completed: !!checklist.assessment_completed,
          locked: !checklist.profile_completed 
        },

        // Phase 3: Vision Creation
        { 
          id: 'vision', 
          stepNumber: 5,
          title: 'Life Vision', 
          href: '/life-vision/new', 
          icon: Sparkles,
          phase: 'Vision',
          completed: !!checklist.vision_built,
          locked: !checklist.assessment_completed 
        },
        { 
          id: 'refine', 
          stepNumber: 6,
          title: 'Refine Vision', 
          href: '/life-vision/refine/new', 
          icon: Wand2,
          phase: 'Vision',
          completed: !!checklist.vision_refined,
          locked: !checklist.vision_built 
        },

        // Phase 4: Audio
        { 
          id: 'generate_audio', 
          stepNumber: 7,
          title: 'Generate Audio', 
          href: '/life-vision/audio/generate/new', 
          icon: Music,
          phase: 'Audio',
          completed: !!checklist.audio_generated,
          locked: !checklist.vision_refined 
        },
        { 
          id: 'record_audio', 
          stepNumber: 8,
          title: 'Record Voice', 
          href: '/life-vision/audio/record/new', 
          icon: Mic,
          phase: 'Audio',
          completed: hasVoiceRecordings || !!checklist.voice_recording_skipped, // Complete if recorded OR skipped
          locked: !checklist.audio_generated,
          optional: true
        },
        { 
          id: 'mix_audio', 
          stepNumber: 9,
          title: 'Audio Mix', 
          href: '/life-vision/audio/mix/new', 
          icon: Sliders,
          phase: 'Audio',
          completed: !!checklist.audios_generated,
          locked: !checklist.audio_generated 
        },

        // Phase 5: Activation
        { 
          id: 'vision_board', 
          stepNumber: 10,
          title: 'Vision Board', 
          href: '/vision-board/resources', 
          icon: ImageIcon,
          phase: 'Activation',
          completed: !!checklist.vision_board_completed,
          locked: !checklist.audios_generated // Requires Audio Mix (Step 9) to be complete
        },
        { 
          id: 'journal', 
          stepNumber: 11,
          title: 'Journal', 
          href: '/journal/resources', 
          icon: BookOpen,
          phase: 'Activation',
          completed: !!checklist.first_journal_entry,
          locked: !checklist.vision_board_completed 
        },
        { 
          id: 'call', 
          stepNumber: 12,
          title: 'Book Call', 
          href: '/intensive/schedule-call', 
          icon: Calendar,
          phase: 'Activation',
          completed: !!checklist.call_scheduled,
          locked: !checklist.first_journal_entry 
        },

        // Phase 6: Completion
        { 
          id: 'activation', 
          stepNumber: 13,
          title: 'My Activation Plan', 
          href: '/map?intensive=true', 
          icon: Rocket,
          phase: 'Completion',
          completed: !!checklist.activation_protocol_completed,
          locked: !checklist.call_scheduled 
        },
        { 
          id: 'unlock', 
          stepNumber: 14,
          title: 'Unlock Platform', 
          href: '/intensive/intake/unlock', 
          icon: Unlock,
          phase: 'Completion',
          completed: !!checklist.unlock_completed,
          locked: !checklist.activation_protocol_completed 
        },
      ]

      setSteps(stepsList)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/intensive/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Group steps by phase
  const phases: Phase[] = [
    { name: 'Start', steps: steps.filter(s => s.phase === 'Start') },
    { name: 'Setup', steps: steps.filter(s => s.phase === 'Setup') },
    { name: 'Foundation', steps: steps.filter(s => s.phase === 'Foundation') },
    { name: 'Vision', steps: steps.filter(s => s.phase === 'Vision') },
    { name: 'Audio', steps: steps.filter(s => s.phase === 'Audio') },
    { name: 'Activation', steps: steps.filter(s => s.phase === 'Activation') },
    { name: 'Completion', steps: steps.filter(s => s.phase === 'Completion') },
  ]

  // Calculate progress
  const completedCount = steps.filter(s => s.completed).length
  const totalCount = steps.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Using a variable instead of a component to prevent remounting on timer updates
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b-2 border-primary-500">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-primary-400">
            Activation Intensive
          </h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-400 font-medium">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Timer Card - Show active countdown OR completed state */}
        {intensiveStarted && (
          <>
            {/* ACTIVE STATE - Timer still running */}
            {countdown && (countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0) && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary-500/30 to-secondary-500/20 border-2 border-primary-500/50">
                {/* Label */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-primary-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
                    72-Hour Focus Window
                  </span>
                </div>
                
                {/* Time remaining label */}
                <div className="text-center mb-1">
                  <span className="text-[9px] text-white uppercase tracking-wide">
                    Time remaining
                  </span>
                </div>
                
                {/* Timer display */}
                <div className="flex items-center justify-center gap-1">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-white">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-neutral-200 uppercase font-medium">hrs</span>
                  </div>
                  <span className="text-xl font-bold text-neutral-400">:</span>
                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-white">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-neutral-200 uppercase font-medium">min</span>
                  </div>
                  <span className="text-xl font-bold text-neutral-400">:</span>
                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-white">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-neutral-200 uppercase font-medium">sec</span>
                  </div>
                </div>
                
                {/* Subtext */}
                <p className="text-[10px] text-white text-center mt-2">
                  This is a focus window, not a deadline.
                </p>
              </div>
            )}

            {/* COMPLETED STATE - Show when timer has expired */}
            {countdown && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border-2 border-blue-400/30">
                {/* Label */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    72-Hour Focus Window
                  </span>
                </div>
                
                {/* Main text */}
                <div className="text-center mb-2">
                  <span className="text-lg font-semibold text-blue-300">
                    Focus window complete
                  </span>
                </div>
                
                {/* Subtext */}
                <p className="text-[10px] text-white text-center leading-relaxed">
                  You're still in the Intensive. Keep going until you complete all 14 steps.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dashboard Link */}
      <div className="px-3 md:px-4 pt-3">
        <button
          onClick={() => {
            router.push('/intensive/dashboard')
            setMobileOpen(false)
          }}
          className={`
            w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl
            transition-all duration-200 text-left
            ${pathname === '/intensive/dashboard'
              ? 'bg-primary-500/10 border-2 border-primary-500 text-white'
              : 'bg-neutral-800 border-2 border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700'
            }
          `}
        >
          <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium">Dashboard</span>
        </button>
      </div>

      {/* Steps grouped by phase */}
      <nav ref={navRef} className="flex-1 p-3 md:p-4 space-y-4 overflow-y-auto overscroll-contain" style={{ overflowAnchor: 'none' }}>
        {loading ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Loading...
          </div>
        ) : (
          phases.map((phase) => (
            <div key={phase.name}>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 px-1">
                {phase.name}
              </div>
              <div className="space-y-1">
                {phase.steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (!step.locked) {
                        router.push(step.href)
                        setMobileOpen(false)
                      }
                    }}
                    disabled={step.locked}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      transition-all duration-200 text-left group
                      ${isActive(step.href)
                        ? 'bg-primary-500/10 border border-primary-500/50 text-white'
                        : step.locked
                          ? 'bg-neutral-800/30 border border-neutral-800 text-neutral-600 cursor-not-allowed pointer-events-none'
                          : 'bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-700/50 hover:text-neutral-200'
                      }
                    `}
                  >
                    {/* Step number */}
                    <span className={`
                      text-[10px] font-mono w-4 flex-shrink-0
                      ${step.completed ? 'text-primary-500' : step.locked ? 'text-neutral-700' : 'text-neutral-600'}
                    `}>
                      {step.stepNumber}
                    </span>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" />
                      ) : step.locked ? (
                        <Lock className="w-3.5 h-3.5 text-neutral-700" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>

                    {/* Icon */}
                    <step.icon className={`w-3.5 h-3.5 flex-shrink-0 ${step.optional ? 'opacity-60' : ''}`} />

                    {/* Title */}
                    <span className={`text-xs font-medium flex-1 truncate ${step.optional ? 'italic' : ''}`}>
                      {step.title}
                      {step.optional && <span className="text-[10px] ml-1 text-neutral-500">(opt)</span>}
                    </span>

                    {/* Arrow on hover */}
                    {!step.locked && (
                      <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            router.push('/support')
            setMobileOpen(false)
          }}
          className="w-full text-xs"
        >
          Support
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-neutral-800 p-2 rounded-lg border-2 border-neutral-700 hover:border-neutral-600"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-[#1F1F1F] border-r-2 border-neutral-800 z-50
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-[280px] bg-[#1F1F1F] border-r-2 border-neutral-800 z-30">
        {sidebarContent}
      </aside>
    </>
  )
}
