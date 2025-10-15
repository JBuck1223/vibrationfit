'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Badge, ProgressBar } from '@/lib/design-system/components'
import { Clock, X, ArrowRight } from 'lucide-react'

type Step = {
  id: string
  title: string
  href: string
  completed: boolean
  locked: boolean
}

export function IntensiveBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [deadline, setDeadline] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    load()
    // refresh on route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Timer effect
  useEffect(() => {
    if (!deadline) return

    const updateTimer = () => {
      const now = new Date().getTime()
      // Ensure deadline is treated as UTC to match database timestamps
      const deadlineTime = new Date(deadline + (deadline.includes('Z') ? '' : 'Z')).getTime()
      const difference = deadlineTime - now

      if (difference <= 0) {
        setTimeRemaining('Expired')
        setIsExpired(true)
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
      setIsExpired(false)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  const load = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: intensive } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!intensive) { setLoading(false); return }
      setDeadline(intensive.activation_deadline)

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('intensive_id', intensive.id)
        .maybeSingle()

      if (!checklist) { setLoading(false); return }

      const s: Step[] = [
        { id: 'profile', title: 'Profile', href: '/profile/edit?intensive=true', completed: !!checklist.profile_completed, locked: false },
        { id: 'assessment', title: 'Assessment', href: '/assessment?intensive=true', completed: !!checklist.assessment_completed, locked: !checklist.profile_completed },
        { id: 'call', title: 'Book Call', href: '/intensive/schedule-call', completed: !!checklist.call_scheduled, locked: !checklist.assessment_completed },
        { id: 'build', title: 'Build Vision', href: '/vision/build?intensive=true', completed: !!checklist.vision_built, locked: !checklist.call_scheduled },
        { id: 'refine', title: 'Refine', href: '/intensive/refine-vision', completed: !!checklist.vision_refined, locked: !checklist.vision_built },
        { id: 'audio', title: 'Audio', href: '/life-vision?intensive=true&action=audio', completed: !!checklist.audio_generated, locked: !checklist.vision_refined },
        { id: 'board', title: 'Vision Board', href: '/vision-board?intensive=true', completed: !!checklist.vision_board_completed, locked: !checklist.vision_refined },
        { id: 'journal', title: 'Journal', href: '/journal/new?intensive=true', completed: !!checklist.first_journal_entry, locked: !checklist.vision_board_completed },
        { id: 'call_prep', title: 'Call Prep', href: '/intensive/call-prep', completed: !!checklist.calibration_call_completed, locked: !checklist.first_journal_entry },
        { id: 'activate', title: 'Activate', href: '/intensive/activation-protocol', completed: !!checklist.activation_protocol_completed, locked: !checklist.calibration_call_completed },
      ]

      const done = s.filter(x => x.completed).length
      const pct = Math.round((done / s.length) * 100)
      setSteps(s)
      setProgress(pct)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = useMemo(() => steps.find(s => !s.completed && !s.locked), [steps])

  if (!visible || loading || steps.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-primary-900/80 to-primary-800/80 border-b border-primary-600/30 backdrop-blur-sm">
      <div className="w-full px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="premium" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              <Clock className="w-4 h-4 mr-1" /> Activation Intensive
            </Badge>
            {timeRemaining && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className={`text-sm font-mono ${isExpired ? 'text-red-400' : 'text-neutral-300'}`}>
                  {isExpired ? 'Time Expired!' : timeRemaining}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 md:px-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">Progress</span>
                <span className="text-sm font-semibold text-primary-400">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-primary-500 to-primary-400" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-neutral-400 mt-1">{progress}% complete</div>
          </div>

          <div className="flex items-center gap-3">
            {nextStep ? (
              <Button
                variant="primary"
                onClick={() => router.push(nextStep.href)}
                className="whitespace-nowrap"
              >
                Continue: {nextStep.title}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push('/intensive/dashboard')}>
                View Dashboard
              </Button>
            )}

            <button
              aria-label="Dismiss Intensive Bar"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
              onClick={() => setVisible(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


