'use client'

import Link from 'next/link'
import { Card, Button } from '@/lib/design-system'
import { CheckCircle, Circle, MapPin, Video, MessageCircle, Dumbbell, Music, FileText, BookOpen, Award, GraduationCap } from 'lucide-react'
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
  },
  {
    key: 'firstAdvancedAudioMix',
    title: 'Create Your First Advanced Audio Mix',
    description: 'Add frequency enhancements to any of your vision audios to test the power of healing frequencies.',
    ctaLabel: 'Open Audio Studio',
    ctaHref: '/life-vision/active',
    icon: Music,
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
  return (
    <Card className="relative overflow-hidden p-0 border-2 border-[#39FF14]/30">
      <div className="absolute inset-0 opacity-5 bg-[#39FF14]" aria-hidden />
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <GraduationCap className="w-10 h-10 text-[#39FF14] mb-3" aria-hidden />
          <h2 className="text-xl font-bold text-white mb-1">Getting Started as a Graduate</h2>
          <p className="text-neutral-400 text-sm max-w-md">
            Do these in your first 7 days to lock in your new rhythm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
          <ul className="space-y-4">
            {ITEMS.slice(0, 4).map((item, index) => {
              const done = progress[item.key]
              const Icon = item.icon
              return (
                <li key={item.key} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-[#39FF14]" aria-hidden />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-600" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${done ? 'text-neutral-400' : 'text-white'}`}>
                      {index + 1}. {item.title}
                    </p>
                    <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                    {!done && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={item.ctaHref} className="inline-flex items-center gap-2">
                            <Icon className="w-4 h-4" />
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
                  </div>
                </li>
              )
            })}
          </ul>
          <ul className="space-y-4 md:mt-0 mt-4">
            {ITEMS.slice(4, 7).map((item, index) => {
              const done = progress[item.key]
              const Icon = item.icon
              const displayIndex = index + 5
              return (
                <li key={item.key} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-[#39FF14]" aria-hidden />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-600" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${done ? 'text-neutral-400' : 'text-white'}`}>
                      {displayIndex}. {item.title}
                    </p>
                    <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                    {!done && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={item.ctaHref} className="inline-flex items-center gap-2">
                            <Icon className="w-4 h-4" />
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
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Card>
  )
}
