'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard,
  Settings,
  Sparkles,
  Music,
  ImageIcon,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  id: string
  title: string
  href: string
  icon: any
  completed: boolean
  active: boolean
}

export function IntensiveMobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ completed: 0, total: 14 })

  useEffect(() => {
    loadNavItems()
  }, [pathname])

  const loadNavItems = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check settings from user_accounts
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

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!checklist) return

      // Calculate progress
      const completedSteps = [
        hasSettings,
        !!checklist.intake_completed,
        !!checklist.profile_completed,
        !!checklist.assessment_completed,
        !!checklist.vision_built,
        !!checklist.vision_refined,
        !!checklist.audio_generated,
        !!checklist.audio_generated, // Step 8 shares with 7
        !!checklist.audios_generated,
        !!checklist.vision_board_completed,
        !!checklist.first_journal_entry,
        !!checklist.call_scheduled,
        !!checklist.activation_protocol_completed,
        !!checklist.unlock_completed,
      ].filter(Boolean).length

      setProgress({ completed: completedSteps, total: 14 })

      // Mobile nav shows 5 key items for quick access
      const items: NavItem[] = [
        { 
          id: 'dashboard', 
          title: 'Home', 
          href: '/intensive/dashboard', 
          icon: LayoutDashboard,
          completed: false,
          active: pathname === '/intensive/dashboard'
        },
        { 
          id: 'settings', 
          title: 'Setup', 
          href: '/account/settings', 
          icon: Settings,
          completed: hasSettings && !!checklist.intake_completed,
          active: pathname.startsWith('/account') || pathname === '/intensive/intake'
        },
        { 
          id: 'vision', 
          title: 'Vision', 
          href: '/life-vision', 
          icon: Sparkles,
          completed: !!checklist.vision_built && !!checklist.vision_refined,
          active: pathname.startsWith('/life-vision') || pathname.startsWith('/profile') || pathname.startsWith('/assessment')
        },
        { 
          id: 'audio', 
          title: 'Audio', 
          href: '/life-vision/audio/new', 
          icon: Music,
          completed: !!checklist.audio_generated && !!checklist.audios_generated,
          active: pathname.includes('/audio')
        },
        { 
          id: 'activate', 
          title: 'Activate', 
          href: '/vision-board', 
          icon: ImageIcon,
          completed: !!checklist.vision_board_completed && !!checklist.first_journal_entry,
          active: pathname.startsWith('/vision-board') || pathname.startsWith('/journal')
        },
      ]

      setNavItems(items)
    } finally {
      setLoading(false)
    }
  }

  if (loading || navItems.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t-2 border-primary-500 md:hidden">
      {/* Progress indicator */}
      <div className="h-1 bg-neutral-800">
        <div 
          className="h-full bg-primary-500 transition-all duration-500"
          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
        />
      </div>
      
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                item.active 
                  ? 'text-primary-500' 
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.completed && !item.active && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-primary-500 bg-neutral-900 rounded-full" />
                )}
                {!item.completed && item.id !== 'dashboard' && !item.active && (
                  <Circle className="absolute -top-1 -right-1 w-3 h-3 text-neutral-600 bg-neutral-900 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.title}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
