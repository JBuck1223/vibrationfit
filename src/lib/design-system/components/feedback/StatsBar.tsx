'use client'

import React from 'react'

interface StatItem {
  label: string
  value: string | number
}

interface StatsBarProps {
  stats: StatItem[]
  theme?: 'green' | 'yellow' | 'purple' | 'teal' | 'neutral'
  className?: string
}

const themeConfig = {
  green: {
    container: 'border-green-500/20 bg-green-500/5',
    label: 'text-green-400/70',
    divider: 'border-green-500/10',
  },
  yellow: {
    container: 'border-yellow-500/20 bg-yellow-500/5',
    label: 'text-yellow-400/70',
    divider: 'border-yellow-500/10',
  },
  purple: {
    container: 'border-purple-500/20 bg-purple-500/5',
    label: 'text-purple-400/70',
    divider: 'border-purple-500/10',
  },
  teal: {
    container: 'border-teal-500/20 bg-teal-500/5',
    label: 'text-teal-400/70',
    divider: 'border-teal-500/10',
  },
  neutral: {
    container: 'border-neutral-700/40 bg-neutral-800/30',
    label: 'text-neutral-500',
    divider: 'border-neutral-700/30',
  },
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  theme = 'green',
  className = '',
}) => {
  const config = themeConfig[theme]

  return (
    <div
      className={`rounded-2xl border-2 ${config.container} ${className}`}
    >
      {/* Desktop: single row */}
      <div className="hidden sm:flex sm:items-center sm:divide-x sm:divide-solid" style={{ borderColor: 'inherit' }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex-1 px-4 py-3 text-center ${i > 0 ? config.divider : ''}`}
            style={i > 0 ? { borderLeftWidth: '1px' } : undefined}
          >
            <p className={`text-[11px] uppercase tracking-wider ${config.label} mb-0.5`}>
              {stat.label}
            </p>
            <p className="text-lg font-bold text-white leading-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 sm:hidden">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={[
              'px-4 py-3 text-center',
              i % 2 !== 0 ? `border-l ${config.divider}` : '',
              i >= 2 ? `border-t ${config.divider}` : '',
            ].join(' ')}
          >
            <p className={`text-[11px] uppercase tracking-wider ${config.label} mb-0.5`}>
              {stat.label}
            </p>
            <p className="text-lg font-bold text-white leading-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
