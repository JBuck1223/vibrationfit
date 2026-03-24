'use client'

import React from 'react'
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
  if (streak >= 3) return 'Don\'t break the chain.'
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
  className = '',
}) => {
  const c = themeConfig[theme]

  const periodMax7 = streakUnit === 'weeks' ? 1 : 7
  const periodMax30 = streakUnit === 'weeks' ? 4 : 30

  const streakText = formatStreak(currentStreak, streakUnit)
  const streakMicro = getStreakMicrocopy(currentStreak, todayCompleted, streakFreezeUsedThisWeek)
  const showFreeze = streakFreezeAvailable || streakFreezeUsedThisWeek
  const helperText = todayCompleted ? ctaDoneHelperText : ctaHelperText

  return (
    <div className={`rounded-2xl border-2 ${c.container} px-4 py-3 ${className}`}>
      {/* Row 1: Icon + Title ... Today status ... Streak */}
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 ${c.accent} flex-shrink-0`} />
        <span className="text-sm font-semibold text-white truncate">{title}</span>

        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {/* Today */}
          <div className="flex items-center gap-1">
            {todayCompleted ? (
              <CheckCircle className={`w-3.5 h-3.5 ${c.todayDone}`} />
            ) : (
              <Circle className="w-3.5 h-3.5 text-neutral-600" />
            )}
            <span className={`text-xs font-medium ${todayCompleted ? c.todayDone : 'text-neutral-500'}`}>
              {todayCompleted ? 'Done' : 'Today'}
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1">
            {currentStreak >= 2 && (
              <Flame className={`w-3.5 h-3.5 ${c.streakFire}`} />
            )}
            <span className={`text-xs font-semibold ${currentStreak > 0 ? c.accent : 'text-neutral-600'}`}>
              {streakText}
            </span>
          </div>

          {/* Streak Freeze icon + tooltip */}
          {showFreeze && (
            <div className="relative group">
              <Shield
                className={`w-3.5 h-3.5 cursor-help ${streakFreezeUsedThisWeek ? 'text-blue-500/40' : c.freezeColor}`}
              />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-xs font-semibold text-blue-400 mb-1">
                  {streakFreezeUsedThisWeek ? 'Streak Freeze Used' : 'Streak Freeze'}
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {streakFreezeUsedThisWeek
                    ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                    : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 1.5: Streak microcopy (tiny, right-aligned) */}
      {streakMicro && (
        <p className="text-[11px] text-neutral-500 italic text-right mt-0.5">{streakMicro}</p>
      )}

      {/* Row 2: Week / Month / All-time stats */}
      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
        <span className="text-neutral-500">
          Week <span className="text-neutral-400 font-medium">{countLast7}/{periodMax7}</span>
        </span>
        <span className={`${c.divider} border-l pl-3 text-neutral-500`}>
          Month <span className="text-neutral-400 font-medium">{countLast30}/{periodMax30}</span>
        </span>
        <span className={`${c.divider} border-l pl-3 text-neutral-500`}>
          All-time <span className="text-neutral-400 font-medium">{countAllTime.toLocaleString()}</span>
        </span>
      </div>

      {/* Row 3: CTA + helper text */}
      <Link
        href={ctaHref}
        className={`
          block w-full text-center rounded-full text-xs font-medium
          transition-all duration-200 mt-2 py-1.5 px-3
          ${todayCompleted ? c.ctaDoneBg : c.ctaBg}
        `}
      >
        {todayCompleted ? ctaDoneLabel : ctaLabel}
      </Link>
      {helperText && (
        <p className="text-[10px] text-neutral-600 text-center mt-1">{helperText}</p>
      )}
    </div>
  )
}
