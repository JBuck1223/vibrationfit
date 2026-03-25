'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, Shield, Flame, type LucideIcon } from 'lucide-react'

export interface PracticeCardProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  theme?: 'green' | 'yellow' | 'purple' | 'teal' | 'neutral'

  todayCompleted: boolean
  currentStreak: number
  streakUnit?: 'days' | 'weeks'
  countLast7: number
  countLast30: number
  countAllTime: number

  recentDaysActive?: number
  recentDaysTotal?: number

  streakFreezeAvailable?: boolean
  streakFreezeUsedThisWeek?: boolean

  ctaHref: string
  ctaLabel: string
  ctaDoneLabel: string
  ctaHelperText?: string
  ctaDoneHelperText?: string

  allTimeLabel?: string
  allTimeIdentityMessage?: string

  compact?: boolean
  inline?: boolean
  hideCta?: boolean
  extraStats?: { label: string; value: number | string }[]
  className?: string
}

const themeConfig = {
  green: {
    container: 'border-green-500/20 bg-green-500/[0.04]',
    accent: 'text-green-400',
    accentMuted: 'text-green-400/60',
    todayDone: 'text-green-400',
    streakFire: 'text-green-400',
    ctaBg: 'bg-green-500/15 hover:bg-green-500/25 text-green-400',
    ctaDoneBg: 'bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400',
    freezeColor: 'text-blue-400/70',
    divider: 'border-green-500/10',
  },
  yellow: {
    container: 'border-yellow-500/20 bg-yellow-500/[0.04]',
    accent: 'text-yellow-400',
    accentMuted: 'text-yellow-400/60',
    todayDone: 'text-yellow-400',
    streakFire: 'text-yellow-400',
    ctaBg: 'bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400',
    ctaDoneBg: 'bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400',
    freezeColor: 'text-blue-400/70',
    divider: 'border-yellow-500/10',
  },
  purple: {
    container: 'border-purple-500/20 bg-purple-500/[0.04]',
    accent: 'text-purple-400',
    accentMuted: 'text-purple-400/60',
    todayDone: 'text-purple-400',
    streakFire: 'text-purple-400',
    ctaBg: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400',
    ctaDoneBg: 'bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400',
    freezeColor: 'text-blue-400/70',
    divider: 'border-purple-500/10',
  },
  teal: {
    container: 'border-teal-500/20 bg-teal-500/[0.04]',
    accent: 'text-teal-400',
    accentMuted: 'text-teal-400/60',
    todayDone: 'text-teal-400',
    streakFire: 'text-teal-400',
    ctaBg: 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-400',
    ctaDoneBg: 'bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400',
    freezeColor: 'text-blue-400/70',
    divider: 'border-teal-500/10',
  },
  neutral: {
    container: 'border-neutral-700/40 bg-neutral-800/30',
    accent: 'text-neutral-300',
    accentMuted: 'text-neutral-500',
    todayDone: 'text-green-400',
    streakFire: 'text-neutral-300',
    ctaBg: 'bg-white/[0.06] hover:bg-white/[0.10] text-neutral-300',
    ctaDoneBg: 'bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400',
    freezeColor: 'text-blue-400/70',
    divider: 'border-neutral-700/30',
  },
}

function formatStreak(
  streak: number,
  streakUnit: 'days' | 'weeks',
): string {
  if (streak === 0) return 'No streak'
  const unit = streakUnit === 'weeks' ? 'week' : 'day'
  const plural = streak === 1 ? unit : `${unit}s`
  return `${streak} ${plural}`
}

function getStreakMicrocopy(
  streak: number,
  todayDone: boolean,
  streakFreezeUsed: boolean,
): string {
  if (streakFreezeUsed) return 'Streak saved by Freeze'
  if (streak === 0) return ''

  if (todayDone) {
    if (streak >= 30) return 'This is who you are now.'
    if (streak >= 14) return 'This is becoming identity.'
    if (streak >= 7) return 'Your future self is grateful.'
    if (streak >= 3) return 'Momentum is building.'
    return 'Day one. Let\'s go.'
  }

  if (streak >= 7) return 'Keep it alive.'
  if (streak >= 3) return 'Keep building momentum.'
  return 'Show up today.'
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  theme = 'green',
  todayCompleted,
  currentStreak,
  streakUnit = 'days',
  countLast7,
  countLast30,
  countAllTime,
  recentDaysActive,
  recentDaysTotal,
  streakFreezeAvailable = false,
  streakFreezeUsedThisWeek = false,
  ctaHref,
  ctaLabel,
  ctaDoneLabel,
  ctaHelperText,
  ctaDoneHelperText,
  allTimeLabel = 'total',
  allTimeIdentityMessage,
  compact = false,
  inline = false,
  hideCta = false,
  extraStats,
  className = '',
}) => {
  const c = themeConfig[theme]

  const periodMax7 = streakUnit === 'weeks' ? 1 : 7
  const periodMax30 = streakUnit === 'weeks' ? 4 : 30

  const streakText = formatStreak(currentStreak, streakUnit)
  const streakMicro = getStreakMicrocopy(currentStreak, todayCompleted, streakFreezeUsedThisWeek)
  const showFreeze = streakFreezeAvailable || streakFreezeUsedThisWeek
  const helperText = todayCompleted ? ctaDoneHelperText : ctaHelperText
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

  return (
    <div className={`rounded-2xl border-2 ${c.container} px-4 py-3 ${className}`}>
      <div className={inline ? 'md:flex md:items-center md:gap-4' : ''}>
        {/* Title - centered on mobile */}
        <div className={`flex items-center justify-center md:justify-start gap-2 flex-shrink-0 ${inline ? 'mb-2 md:mb-0' : 'mb-2'}`}>
          <Icon className={`w-5 h-5 ${c.accent} flex-shrink-0`} />
          <span className="text-lg md:text-base font-semibold text-white">{title}</span>
        </div>

        {/* Streak */}
        <div className={`flex items-center justify-center md:justify-start gap-3 md:mt-0 flex-shrink-0 ${inline ? 'md:border-l md:border-neutral-700 md:pl-4' : ''}`}>
          {currentStreak >= 1 && (
            <Flame className={`w-4 h-4 ${c.streakFire}`} />
          )}
          <span className={`text-sm font-semibold ${currentStreak > 0 ? c.accent : 'text-neutral-600'}`}>
            {streakText}
          </span>
          {streakMicro && (
            <span className="hidden md:inline text-xs text-neutral-500 italic">{streakMicro}</span>
          )}
          {showFreeze && (
            <div className="relative group" ref={freezeRef}>
              <button
                type="button"
                onClick={() => setFreezeOpen(prev => !prev)}
                className="flex items-center"
              >
                <Shield
                  className={`w-4 h-4 cursor-help ${streakFreezeUsedThisWeek ? 'text-blue-500/40' : c.freezeColor}`}
                />
              </button>
              <div className={`absolute top-full mt-2 right-1/2 translate-x-1/2 md:translate-x-0 md:right-0 w-64 md:w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-4 md:p-3 shadow-xl transition-all duration-200 z-50 ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'}`}>
                <p className="text-sm font-semibold text-blue-400 mb-1">
                  {streakFreezeUsedThisWeek ? 'Streak Freeze Used' : 'Streak Freeze'}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {streakFreezeUsedThisWeek
                    ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                    : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Week / Month / All-time stats */}
        {compact ? (
          <div className={`grid mt-1.5 text-sm ${extraStats?.length ? `grid-cols-${3 + extraStats.length}` : 'grid-cols-3'}`}
            style={extraStats?.length ? { gridTemplateColumns: `repeat(${3 + extraStats.length}, minmax(0, 1fr))` } : undefined}
          >
            <div className="text-center md:text-left">
              <span className="text-neutral-500 block text-xs">Week:</span>
              <span className="text-white font-medium">{countLast7}/{periodMax7}</span>
            </div>
            <div className="border-l border-neutral-700 pl-3 text-center md:text-left">
              <span className="text-neutral-500 block text-xs">Month:</span>
              <span className="text-white font-medium">{countLast30}/{periodMax30}</span>
            </div>
            <div className="border-l border-neutral-700 pl-3 text-center md:text-left">
              <span className="text-neutral-500 block text-xs">All-time:</span>
              <span className="text-white font-medium">{countAllTime.toLocaleString()}</span>
            </div>
            {extraStats?.map((stat) => (
              <div key={stat.label} className="border-l border-neutral-700 pl-3 text-center md:text-left">
                <span className="text-neutral-500 block text-xs">{stat.label}:</span>
                <span className="text-white font-medium">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex items-center justify-center md:justify-start gap-3 text-sm flex-wrap ${inline ? 'mt-1.5 md:mt-0 md:border-l md:border-neutral-700 md:pl-4' : 'mt-1.5'}`}>
            <span className="text-neutral-500">
              Week: <span className="text-white font-medium">{countLast7}/{periodMax7}</span>
            </span>
            <span className="border-l border-neutral-700 pl-3 text-neutral-500">
              Month: <span className="text-white font-medium">{countLast30}/{periodMax30}</span>
            </span>
            <span className="border-l border-neutral-700 pl-3 text-neutral-500">
              All-time: <span className="text-white font-medium">{countAllTime.toLocaleString()}</span>
            </span>
            {extraStats?.map((stat) => (
              <span key={stat.label} className="border-l border-neutral-700 pl-3 text-neutral-500">
                {stat.label}: <span className="text-white font-medium">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {!hideCta && (
          <div className={`${inline ? 'mt-2.5 md:mt-0 md:ml-auto' : 'mt-2.5'} flex-shrink-0`}>
            <Link
              href={ctaHref}
              className={`
                block text-center rounded-full text-sm font-medium
                transition-all duration-200 py-2 px-5 ${inline ? 'whitespace-nowrap' : 'w-full'}
                ${todayCompleted ? c.ctaDoneBg : c.ctaBg}
              `}
            >
              {todayCompleted ? ctaDoneLabel : ctaLabel}
            </Link>
            {helperText && (
              <p className={`text-xs text-neutral-600 text-center mt-1 ${inline ? 'md:hidden' : ''}`}>{helperText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
