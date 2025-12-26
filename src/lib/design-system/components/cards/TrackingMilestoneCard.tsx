'use client'

import React from 'react'

interface TrackingMilestoneCardProps {
  label: string
  mobileLabel?: string
  value?: string | number
  theme?: 'primary' | 'secondary' | 'accent' | 'neutral'
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export const TrackingMilestoneCard: React.FC<TrackingMilestoneCardProps> = ({
  label,
  mobileLabel,
  value,
  theme = 'primary',
  action,
  icon,
  className = ''
}) => {
  const themeColors = {
    primary: 'border-[#199D67]/25 bg-[#199D67]/10',
    secondary: 'border-[#14B8A6]/25 bg-[#14B8A6]/10',
    accent: 'border-[#8B5CF6]/25 bg-[#8B5CF6]/10',
    neutral: 'border-[#666666]/25 bg-[#666666]/10'
  }

  const textColors = {
    primary: 'text-[#5EC49A]',
    secondary: 'text-[#2DD4BF]',
    accent: 'text-[#C4B5FD]',
    neutral: 'text-neutral-400'
  }

  return (
    <div className={`rounded-2xl border-2 p-4 md:p-6 lg:p-8 ${themeColors[theme]} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {mobileLabel ? (
            <>
              <p className={`text-xs uppercase tracking-wider ${textColors[theme]} md:hidden break-words leading-tight`}>
                {mobileLabel}
              </p>
              <p className={`text-xs uppercase tracking-[0.2em] ${textColors[theme]} hidden md:block break-words leading-tight`}>
                {label}
              </p>
            </>
          ) : (
            <p className={`text-xs uppercase tracking-wider md:tracking-[0.2em] ${textColors[theme]} break-words leading-tight`}>
              {label}
            </p>
          )}
          {value !== undefined && (
            <p className="text-2xl md:text-3xl font-bold text-white break-words">
              {value}
            </p>
          )}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        {icon && (
          <div className={`${textColors[theme]} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
