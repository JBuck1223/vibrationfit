'use client'

import { useState } from 'react'
import {
  BadgeType,
  BADGE_DEFINITIONS,
  BADGE_CATEGORY_COLORS,
} from '@/lib/badges/types'

interface BadgeIconProps {
  /** Badge type to display */
  badgeType: BadgeType
  /** Size of the icon */
  size?: 'xs' | 'sm' | 'md'
  /** Show tooltip on hover */
  showTooltip?: boolean
  /** Additional className */
  className?: string
}

const SIZE_CONFIG = {
  xs: {
    container: 'w-4 h-4',
    icon: 'w-2.5 h-2.5',
  },
  sm: {
    container: 'w-5 h-5',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'w-6 h-6',
    icon: 'w-4 h-4',
  },
}

export default function BadgeIcon({
  badgeType,
  size = 'sm',
  showTooltip = true,
  className = '',
}: BadgeIconProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  
  const definition = BADGE_DEFINITIONS[badgeType]
  if (!definition) return null
  
  const { icon: Icon, label, category } = definition
  const colors = BADGE_CATEGORY_COLORS[category]
  const config = SIZE_CONFIG[size]

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {/* Badge icon */}
      <div
        className={`
          ${config.container}
          flex items-center justify-center rounded-full
          ${colors.bg}
          border ${colors.border}
        `}
      >
        <Icon
          className={config.icon}
          style={{ color: colors.primary }}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2 py-1 rounded-md
            bg-neutral-800 border border-neutral-700
            text-xs text-white whitespace-nowrap
            z-50 shadow-lg
          "
        >
          {label}
          {/* Tooltip arrow */}
          <div
            className="
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent border-t-neutral-800
            "
          />
        </div>
      )}
    </div>
  )
}

/**
 * Component to display multiple badge icons inline
 */
interface BadgeIconsProps {
  /** Array of badge types to display */
  badgeTypes: BadgeType[]
  /** Maximum badges to show before "+N" */
  maxShow?: number
  /** Size of icons */
  size?: 'xs' | 'sm' | 'md'
  /** Additional className */
  className?: string
}

export function BadgeIcons({
  badgeTypes,
  maxShow = 3,
  size = 'sm',
  className = '',
}: BadgeIconsProps) {
  if (badgeTypes.length === 0) return null

  const visibleBadges = badgeTypes.slice(0, maxShow)
  const hiddenCount = badgeTypes.length - maxShow

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {visibleBadges.map(type => (
        <BadgeIcon key={type} badgeType={type} size={size} />
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs text-neutral-500 ml-0.5">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}
