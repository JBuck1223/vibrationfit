'use client'

import { BadgeWithProgress as BadgeWithProgressType, BADGE_CATEGORY_COLORS, BADGE_DEFINITIONS } from '@/lib/badges/types'

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
  const { label, category, type } = definition
  // Look up icon from BADGE_DEFINITIONS since functions can't be serialized from API
  const Icon = BADGE_DEFINITIONS[type].icon
  const colors = BADGE_CATEGORY_COLORS[category]
  const config = SIZE_CONFIG[size]
  
  // Calculate SVG circle properties
  const radius = (config.ring - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference
  
  // Determine visual state based on progress
  const hasProgress = progress.percentage > 0
  
  // Full opacity for badges with any progress, dimmed for no progress
  const iconOpacity = earned || hasProgress ? 1 : 0.35

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
            {/* Background ring - slightly more visible */}
            <circle
              cx={config.ring / 2}
              cy={config.ring / 2}
              r={radius}
              fill="none"
              stroke={hasProgress ? colors.primary : 'currentColor'}
              strokeWidth={config.strokeWidth}
              className={hasProgress ? 'opacity-20' : 'text-neutral-700'}
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

        {/* Icon container */}
        <div
          className={`
            relative flex items-center justify-center rounded-full overflow-hidden
            ${config.iconContainer}
            transition-all duration-300
            ${onClick ? 'hover:scale-105' : ''}
          `}
          style={{
            margin: earned ? 0 : (config.ring - parseInt(config.iconContainer.split('-')[1]) * 4) / 2,
            // Silver metallic background for badges with progress, category color for earned
            background: earned 
              ? `linear-gradient(135deg, ${colors.primary}25 0%, ${colors.primary}15 100%)`
              : hasProgress 
                ? 'linear-gradient(145deg, #9a9a9a 0%, #6a6a6a 30%, #7d7d7d 70%, #8a8a8a 100%)'
                : '#262626',
            border: earned 
              ? `2px solid ${colors.primary}50`
              : hasProgress 
                ? '2px solid #a0a0a0'
                : '1px solid #404040',
            boxShadow: hasProgress || earned
              ? 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)'
              : 'none',
          }}
        >
          <Icon
            className={`
              ${config.iconSize}
              transition-all duration-300
              ${!earned && !hasProgress ? 'grayscale' : ''}
            `}
            style={{ 
              color: earned || hasProgress ? colors.primary : '#555',
              opacity: iconOpacity,
              // 3D embossed effect
              filter: hasProgress || earned
                ? 'drop-shadow(1px 1px 0px rgba(0,0,0,0.4)) drop-shadow(-0.5px -0.5px 0px rgba(255,255,255,0.3))'
                : 'none',
            }}
          />
        </div>
      </div>

      {/* Badge label */}
      {showLabel && (
        <span
          className={`
            ${config.labelSize}
            font-medium text-center leading-tight
            transition-colors duration-300
          `}
          style={{
            color: earned ? '#fff' : hasProgress ? '#d4d4d4' : '#737373'
          }}
        >
          {label}
        </span>
      )}

      {/* Progress text */}
      {showProgress && !earned && (
        <span 
          className={`${config.progressSize} font-medium transition-colors duration-300`}
          style={{
            color: hasProgress ? colors.primary : '#737373'
          }}
        >
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
