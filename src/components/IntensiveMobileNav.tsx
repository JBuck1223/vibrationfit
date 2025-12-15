'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard,
  User,
  ClipboardCheck,
  Sparkles,
  CheckCircle2,
  Circle,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = {
  id: string
  title: string
  href: string
  icon: any
  completed: boolean
  locked: boolean
}

export function IntensiveMobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSteps()
  }, [pathname])

  const loadSteps = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: intensive } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!intensive) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('intensive_id', intensive.id)
        .maybeSingle()

      if (!checklist) return

      const stepsList: Step[] = [
        { 
          id: 'dashboard', 
          title: 'Home', 
          href: '/intensive/dashboard', 
          icon: LayoutDashboard,
          completed: false,
          locked: false 
        },
        { 
          id: 'profile', 
          title: 'Profile', 
          href: '/profile/active/edit', 
          icon: User,
          completed: !!checklist.profile_completed,
          locked: false 
        },
        { 
          id: 'assessment', 
          title: 'Test', 
          href: '/assessment', 
          icon: ClipboardCheck,
          completed: !!checklist.assessment_completed,
          locked: !checklist.profile_completed 
        },
        { 
          id: 'vision', 
          title: 'Vision', 
          href: '/vision/build', 
          icon: Sparkles,
          completed: !!checklist.vision_built,
          locked: !checklist.assessment_completed 
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

  if (loading || steps.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t-2 border-primary-500 md:hidden">
      <div className="flex items-center justify-around py-2">
        {steps.map((step) => {
          const Icon = step.icon
          const active = isActive(step.href)
          
          return (
            <button
              key={step.id}
              onClick={() => !step.locked && router.push(step.href)}
              disabled={step.locked}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                active 
                  ? 'text-primary-500' 
                  : step.locked
                    ? 'text-neutral-600 cursor-not-allowed'
                    : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {step.completed && !active && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-primary-500 bg-black rounded-full" />
                )}
                {step.locked && (
                  <Lock className="absolute -top-1 -right-1 w-3 h-3 text-neutral-600 bg-black rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium truncate w-full text-center">
                {step.title}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

