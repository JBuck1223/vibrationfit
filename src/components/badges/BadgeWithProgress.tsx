'use client'

import { BadgeWithProgress as BadgeWithProgressType, BADGE_CATEGORY_COLORS } from '@/lib/badges/types'

interface BadgeWithProgressProps {
  badge: BadgeWithProgressType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showProgress?: boolean
  onClick?: () => void
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    container: 'w-16',
    ring: 48,
    strokeWidth: 3,
    iconSize: 'w-5 h-5',
    iconContainer: 'w-10 h-10',
    labelSize: 'text-xs',
    progressSize: 'text-[10px]',
  },
  md: {
    container: 'w-24',
    ring: 72,
    strokeWidth: 4,
    iconSize: 'w-7 h-7',
    iconContainer: 'w-14 h-14',
    labelSize: 'text-sm',
    progressSize: 'text-xs',
  },
  lg: {
    container: 'w-32',
    ring: 96,
    strokeWidth: 5,
    iconSize: 'w-10 h-10',
    iconContainer: 'w-20 h-20',
    labelSize: 'text-base',
    progressSize: 'text-sm',
  },
}

export default function BadgeWithProgress({
  badge,
  size = 'md',
  showLabel = true,
  showProgress = true,
  onClick,
}: BadgeWithProgressProps) {
  const { definition, earned, progress } = badge
  const { icon: Icon, label, category } = definition
  const colors = BADGE_CATEGORY_COLORS[category]
  const config = SIZE_CONFIG[size]
  
  // Calculate SVG circle properties
  const radius = (config.ring - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference

  return (
    <div
      className={`flex flex-col items-center gap-1 ${config.container} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Badge with progress ring */}
      <div className="relative">
        {/* Progress ring SVG (only show for unearned badges) */}
        {!earned && showProgress && (
          <svg
            className="absolute inset-0 -rotate-90"
            width={config.ring}
            height={config.ring}
          >
            {/* Background ring */}
            <circle
              cx={config.ring / 2}
              cy={config.ring / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              className="text-neutral-700"
            />
            {/* Progress ring */}
            <circle
              cx={config.ring / 2}
              cy={config.ring / 2}
              r={radius}
              fill="none"
              stroke={colors.primary}
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
        )}

        {/* Earned glow effect */}
        {earned && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{ backgroundColor: colors.primary }}
          />
        )}

        {/* Icon container */}
        <div
          className={`
            relative flex items-center justify-center rounded-full
            ${config.iconContainer}
            ${earned ? colors.bg : 'bg-neutral-800'}
            ${earned ? `border-2 ${colors.border}` : 'border border-neutral-700'}
            transition-all duration-300
            ${onClick ? 'hover:scale-105' : ''}
            ${earned ? 'shadow-lg' : ''}
          `}
          style={{
            margin: earned ? 0 : (config.ring - parseInt(config.iconContainer.split('-')[1]) * 4) / 2,
          }}
        >
          <Icon
            className={`
              ${config.iconSize}
              ${earned ? '' : 'opacity-40 grayscale'}
              transition-all duration-300
            `}
            style={{ color: earned ? colors.primary : '#666' }}
          />
        </div>
      </div>

      {/* Badge label */}
      {showLabel && (
        <span
          className={`
            ${config.labelSize}
            font-medium text-center leading-tight
            ${earned ? 'text-white' : 'text-neutral-500'}
          `}
        >
          {label}
        </span>
      )}

      {/* Progress text */}
      {showProgress && !earned && (
        <span className={`${config.progressSize} text-neutral-500`}>
          {progress.current} / {progress.target}
        </span>
      )}

      {/* Earned date */}
      {earned && badge.earnedAt && (
        <span className={`${config.progressSize} text-neutral-500`}>
          {formatEarnedDate(badge.earnedAt)}
        </span>
      )}
    </div>
  )
}

function formatEarnedDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
