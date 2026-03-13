'use client'

import Link from 'next/link'
import { Card, Button, Badge } from '@/lib/design-system'
import { CheckCircle, Circle, MapPin, Video, MessageCircle, Dumbbell, Music, FileText, BookOpen, Award, GraduationCap, Unlock, Compass } from 'lucide-react'
import type { GraduateChecklistProgress } from '@/lib/graduate-checklist'

interface GraduateChecklistCardProps {
  progress: GraduateChecklistProgress
}

const ITEMS: Array<{
  key: keyof GraduateChecklistProgress
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  ctaLabel2?: string
  ctaHref2?: string
  icon: React.ComponentType<{ className?: string }>
  graduateUnlock?: boolean
}> = [
  {
    key: 'firstDailyActivation',
    title: 'Run Your First Daily Activation',
    description: 'Open your MAP and complete today\'s Morning + Night activation.',
    ctaLabel: 'Go to MAP',
    ctaHref: '/map',
    icon: MapPin,
  },
  {
    key: 'calibrationCallAttended',
    title: 'Attend Your Calibration Call',
    description: 'Show up live, review your journey, and dial in your 28-Day MAP.',
    ctaLabel: 'View / Join Call',
    ctaHref: '/intensive/call-prep',
    icon: Video,
    graduateUnlock: true,
  },
  {
    key: 'firstVibeTribePost',
    title: 'Make Your First Post in Vibe Tribe',
    description: 'Introduce yourself and share your vision with the community.',
    ctaLabel: 'Post in Vibe Tribe',
    ctaHref: '/vibe-tribe',
    icon: MessageCircle,
  },
  {
    key: 'firstAlignmentGymSession',
    title: 'Attend Your First Alignment Gym Session',
    description: 'Join live or watch a replay and take notes on your main takeaways.',
    ctaLabel: 'Go to Alignment Gym',
    ctaHref: '/alignment-gym',
    icon: Dumbbell,
    graduateUnlock: true,
  },
  {
    key: 'firstAdvancedAudioMix',
    title: 'Create Your First Advanced Audio Mix',
    description: 'Add frequency enhancements to any of your vision audios to test the power of healing frequencies.',
    ctaLabel: 'Open Audio Studio',
    ctaHref: '/life-vision/active',
    icon: Music,
    graduateUnlock: true,
  },
  {
    key: 'dailyPaperAndJournal',
    title: 'Complete a Daily Paper + Second Journal Entry',
    description: 'Fill out your first Daily Paper and capture one new Journal entry as evidence.',
    ctaLabel: 'Open Daily Paper',
    ctaHref: '/daily-paper',
    ctaLabel2: 'Open Journal',
    ctaHref2: '/journal',
    icon: FileText,
  },
  {
    key: 'earningBadges',
    title: 'Keep Earning Badges',
    description: 'Continue to Create, Activate, Connect, and attend Sessions to unlock your 3, 7, 14, 21, and 28-Day badges.',
    ctaLabel: 'View My Badges',
    ctaHref: '/snapshot/me',
    icon: Award,
  },
]

export function GraduateChecklistCard({ progress }: GraduateChecklistCardProps) {
  const completedCount = ITEMS.filter(item => progress[item.key]).length

  return (
    <Card className="relative overflow-hidden p-4 md:p-6 lg:p-8 border-2 border-[#39FF14]/30 bg-[#0A0F0A]">
      <div className="absolute inset-0 opacity-[0.03] bg-[#39FF14]" aria-hidden />
      <div className="relative z-10 space-y-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <GraduationCap className="w-10 h-10 text-[#39FF14] mb-3" aria-hidden />
        <h2 className="text-xl font-bold text-white mb-1">Getting Started as a Graduate</h2>
        <p className="text-neutral-400 text-sm max-w-md">
          Do these in your first 7 days to lock in your new rhythm.
        </p>
        <p className="text-xs text-[#39FF14] mt-2">
          {completedCount} of {ITEMS.length} complete
        </p>
        <Button variant="outline" size="sm" asChild className="mt-3">
          <Link href="/intensive/journey" className="inline-flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            View Your Intensive Journey
          </Link>
        </Button>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 gap-3">
        {ITEMS.map((item, index) => {
          const done = progress[item.key]
          const Icon = item.icon
          const stepNumber = index + 1

          return (
            <Card
              key={item.key}
              variant="outlined"
              className={`
                !p-0 overflow-hidden transition-all duration-300 bg-[#141414]
                ${done ? 'border-primary-500/40' : 'border-neutral-600/50 hover:-translate-y-0.5'}
              `}
            >
              <div className="flex">
                {/* Number strip */}
                <div className={`
                  w-14 md:w-16 flex-shrink-0 flex items-center justify-center
                  ${done ? 'bg-primary-500' : 'bg-neutral-700'}
                `}>
                  <span className={`text-xl md:text-2xl font-bold ${done ? 'text-black' : 'text-white'}`}>
                    {stepNumber}
                  </span>
                </div>

                {/* Content */}
                <div className={`
                  flex-1 p-4 md:p-5 relative flex flex-col md:flex-row md:items-center gap-3 md:gap-4
                  ${done ? 'bg-primary-500/5' : ''}
                `}>
                  {/* Mobile status icon — top right */}
                  <div className="absolute top-3 right-3 md:hidden">
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-primary-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-10 md:pr-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm md:text-base font-semibold ${done ? 'text-neutral-400' : 'text-white'}`}>
                        {item.title}
                      </h3>
                      {item.graduateUnlock && (
                        <Badge variant="premium" className="text-[10px] gap-1">
                          <Unlock className="w-3 h-3" />
                          Graduate Unlock
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-neutral-500 mt-0.5">{item.description}</p>
                  </div>

                  {/* CTA buttons — only when incomplete */}
                  {!done && (
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" asChild className="w-[14rem] justify-center">
                        <Link href={item.ctaHref} className="inline-flex items-center gap-2">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {item.ctaLabel}
                        </Link>
                      </Button>
                      {item.ctaLabel2 && item.ctaHref2 && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={item.ctaHref2} className="inline-flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {item.ctaLabel2}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Desktop status icon — inline right */}
                  <div className="hidden md:flex items-center flex-shrink-0">
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-primary-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      </div>
    </Card>
  )
}
