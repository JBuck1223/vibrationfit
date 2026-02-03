'use client'

import { BadgeWithProgress as BadgeWithProgressType, BADGE_CATEGORY_COLORS, BADGE_DEFINITIONS } from '@/lib/badges/types'
import { Lock } from 'lucide-react'

interface BadgeWithProgressProps {
  badge: BadgeWithProgressType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showProgress?: boolean
  onClick?: () => void
  locked?: boolean  // Hide icon until earned
  variant?: 'default' | 'engraved' | 'premium'  // default=3D raised, engraved=pressed in, premium=dark with color
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    container: 'w-16',
    ring: 48,
    strokeWidth: 3,
    iconSize: 'w-5 h-5',
    iconContainer: 'w-10 h-10',
    labelSize: 'text-[10px]',
    labelHeight: 26,  // Fixed height for 2 lines
    progressSize: 'text-[10px]',
  },
  md: {
    container: 'w-24',
    ring: 72,
    strokeWidth: 4,
    iconSize: 'w-7 h-7',
    iconContainer: 'w-14 h-14',
    labelSize: 'text-xs',
    labelHeight: 32,  // Fixed height for 2 lines
    progressSize: 'text-xs',
  },
  lg: {
    container: 'w-32',
    ring: 96,
    strokeWidth: 5,
    iconSize: 'w-10 h-10',
    iconContainer: 'w-20 h-20',
    labelSize: 'text-sm',
    labelHeight: 40,  // Fixed height for 2 lines
    progressSize: 'text-sm',
  },
}

export default function BadgeWithProgress({
  badge,
  size = 'md',
  showLabel = true,
  showProgress = true,
  onClick,
  locked = false,
  variant = 'default',
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
  
  // A badge is "complete" if either officially earned OR at 100% progress
  const isComplete = earned || progress.percentage >= 100
  
  // Determine visual state based on progress
  const hasProgress = progress.percentage > 0
  
  // Full opacity for badges with any progress, dimmed for no progress
  const iconOpacity = isComplete || hasProgress ? 1 : 0.35

  return (
    <div
      className={`flex flex-col items-center gap-1 ${config.container} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Badge with progress ring - fixed height container for alignment */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: config.ring, height: config.ring }}
      >
        {/* Progress ring SVG (only show for incomplete badges) */}
        {!isComplete && showProgress && (
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

        {/* Icon container - full size for complete, smaller for incomplete */}
        <div
          className={`
            absolute flex items-center justify-center rounded-full overflow-hidden
            transition-all duration-300
            ${onClick ? 'hover:scale-105' : ''}
          `}
          style={{
            // Complete badges fill the full ring space
            width: isComplete ? config.ring : parseInt(config.iconContainer.split('-')[1]) * 4,
            height: isComplete ? config.ring : parseInt(config.iconContainer.split('-')[1]) * 4,
            // Premium: dark gradient with silver outline
            // Engraved: polished silver badge with raised rim
            // Default: chrome metallic raised background
            background: isComplete
              ? variant === 'premium'
                ? 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #252525 100%)'
                : variant === 'engraved'
                  // Polished silver badge background with radial shine
                  ? 'radial-gradient(ellipse at 30% 20%, #d0d0d0 0%, #a8a8a8 25%, #888888 50%, #a0a0a0 75%, #909090 100%)'
                  : 'linear-gradient(145deg, #9a9a9a 0%, #6a6a6a 30%, #7d7d7d 70%, #8a8a8a 100%)'
              : '#262626',
            border: isComplete
              ? variant === 'premium'
                ? '3px solid transparent'
                : variant === 'engraved'
                  ? 'none'  // No border - let the polished surface speak
                  : '2px solid #a0a0a0'
              : '1px solid #404040',
            // Premium variant gets a gradient border effect via background-clip
            backgroundClip: isComplete && variant === 'premium' ? 'padding-box' : undefined,
            boxShadow: isComplete
              ? variant === 'premium'
                ? `0 0 0 3px #1a1a1a, 0 0 0 5px #707070, 0 0 0 6px #505050, 0 0 15px rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.4)`
                : variant === 'engraved'
                  // Badge-like: outer rim highlight, inner pressed area for icon
                  ? `0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 0 10px rgba(0,0,0,0.15)`
                  : 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)'
              : 'none',
          }}
        >
          <Icon
            className={`
              transition-all duration-300
              ${locked && !isComplete ? 'grayscale opacity-30' : (!isComplete ? 'grayscale' : '')}
            `}
            style={{ 
              // Larger icon for complete badges
              width: isComplete ? config.ring * 0.45 : parseInt(config.iconSize.split(' ')[0].split('-')[1]) * 4,
              height: isComplete ? config.ring * 0.45 : parseInt(config.iconSize.split(' ')[0].split('-')[1]) * 4,
              // Premium: category color with glow
              // Engraved: darker color pressed into polished silver surface
              // Default: silver raised/embossed
              color: isComplete
                ? variant === 'premium'
                  ? colors.primary
                  : variant === 'engraved'
                    ? '#505050'  // Dark engraved look
                    : '#a0a0a0'
                : '#555',
              opacity: locked && !isComplete ? 0.2 : (isComplete ? 1 : 0.4),
              // Premium: colored glow effect
              // Engraved: shadows that make icon look cut into the metal (light bottom-right catchlight, dark top-left depth)
              // Default: shadows that make icon look raised (light top-left, dark bottom-right)
              filter: isComplete
                ? variant === 'premium'
                  ? `drop-shadow(0 0 8px ${colors.primary}) drop-shadow(0 0 15px ${colors.primary}60) drop-shadow(2px 2px 2px rgba(0,0,0,0.8))`
                  : variant === 'engraved'
                    ? 'drop-shadow(1px 1px 0px rgba(255,255,255,0.6)) drop-shadow(-1px -1px 2px rgba(0,0,0,0.4))'
                    : 'drop-shadow(2px 2px 1px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 1px rgba(255,255,255,0.3)) drop-shadow(0 0 8px rgba(160,160,160,0.25))'
                : 'none',
            }}
          />
          
          {/* Lock overlay for locked badges */}
          {locked && !isComplete && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock 
                className="w-5 h-5 text-neutral-400"
                style={{
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Badge label - same color for all badges, forced 2 lines */}
      {showLabel && (
        <span
          className={`
            ${config.labelSize}
            font-medium text-center leading-tight
            transition-colors duration-300
          `}
          style={{
            color: '#a3a3a3',  // Same gray for all badges (complete and incomplete)
            height: config.labelHeight,  // Fixed height for 2 lines
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Split label into two lines - split at midpoint for even distribution */}
          {(() => {
            const words = label.split(' ')
            if (words.length === 1) return label
            // Split at midpoint (rounded up) so first line has equal or more words
            const midpoint = Math.ceil(words.length / 2)
            const line1 = words.slice(0, midpoint).join(' ')
            const line2 = words.slice(midpoint).join(' ')
            return (
              <>
                <span>{line1}</span>
                <span>{line2}</span>
              </>
            )
          })()}
        </span>
      )}

      {/* Progress text - show for ALL badges including complete */}
      {showProgress && (
        <span 
          className={`${config.progressSize} font-medium transition-colors duration-300`}
          style={{
            color: isComplete
              ? colors.primary  // Category color for complete
              : hasProgress 
                ? colors.primary 
                : '#a3a3a3',  // Light gray for no progress
          }}
        >
          {/* Cap current at target so it shows 3/3 not 30/3 */}
          {Math.min(progress.current, progress.target)} / {progress.target}
        </span>
      )}
    </div>
  )
}
