'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/lib/design-system/components'
import { 
  LayoutDashboard,
  User,
  ClipboardCheck,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock
} from 'lucide-react'

type Step = {
  id: string
  title: string
  href: string
  icon: any
  completed: boolean
  locked: boolean
}

export function IntensiveSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
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
          title: 'Dashboard', 
          href: '/intensive/dashboard', 
          icon: LayoutDashboard,
          completed: false,
          locked: false 
        },
        { 
          id: 'profile', 
          title: 'Complete Profile', 
          href: '/profile/edit', 
          icon: User,
          completed: !!checklist.profile_completed,
          locked: false 
        },
        { 
          id: 'assessment', 
          title: 'Take Assessment', 
          href: '/assessment', 
          icon: ClipboardCheck,
          completed: !!checklist.assessment_completed,
          locked: !checklist.profile_completed 
        },
        { 
          id: 'vision', 
          title: 'Build Vision', 
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

  const SidebarContent = () => (
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
        <p className="text-xs md:text-sm text-neutral-400 mt-1">
          Complete all steps to unlock full platform
        </p>
      </div>

      {/* Steps */}
      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Loading...
          </div>
        ) : (
          steps.map((step) => (
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
                w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl
                transition-all duration-200 text-left
                ${isActive(step.href)
                  ? 'bg-primary-500/10 border-2 border-primary-500 text-white'
                  : step.locked
                    ? 'bg-neutral-800/50 border-2 border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-800 border-2 border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700'
                }
              `}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary-500" />
                ) : step.locked ? (
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Circle className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </div>

              {/* Icon */}
              <step.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />

              {/* Title */}
              <span className="text-xs md:text-sm font-medium flex-1 truncate">
                {step.title}
              </span>

              {/* Arrow */}
              {!step.locked && (
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100" />
              )}
            </button>
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            router.push('/profile')
            setMobileOpen(false)
          }}
          className="w-full text-xs md:text-sm"
        >
          <User className="w-4 h-4 mr-2" />
          My Profile
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
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-[280px] bg-[#1F1F1F] border-r-2 border-neutral-800 z-30">
        <SidebarContent />
      </aside>
    </>
  )
}

