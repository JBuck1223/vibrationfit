'use client'

import { Card } from '@/lib/design-system/components'
import { Users, Heart, Play, Sparkles, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export type MetricType = 'sessions' | 'connections' | 'activations' | 'creations'

interface RetentionMetricTileProps {
  type: MetricType
  headline: string
  subtext: string
  lifetimeLabel: string
  lifetimeValue: number | string
  /** Optional CTA text (e.g., "Next: Thursday 6pm") */
  ctaText?: string
  /** Optional CTA link */
  ctaHref?: string
  /** Show nudge message when metric is low */
  nudgeMessage?: string
  /** Read-only mode (no CTAs, used on public profile) */
  readonly?: boolean
}

const METRIC_CONFIG: Record<MetricType, {
  icon: typeof Users
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  sessions: {
    icon: Users,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    label: 'Sessions',
  },
  connections: {
    icon: Heart,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Connections',
  },
  activations: {
    icon: Play,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Activations',
  },
  creations: {
    icon: Sparkles,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Creations',
  },
}

export default function RetentionMetricTile({
  type,
  headline,
  subtext,
  lifetimeLabel,
  lifetimeValue,
  ctaText,
  ctaHref,
  nudgeMessage,
  readonly = false,
}: RetentionMetricTileProps) {
  const config = METRIC_CONFIG[type]
  const Icon = config.icon

  return (
    <Card className={`p-4 md:p-5 ${config.bgColor} border ${config.borderColor} transition-all hover:scale-[1.02]`}>
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      {/* Big headline metric */}
      <div className="mb-1">
        <span className="text-2xl md:text-3xl font-bold text-white">{headline}</span>
        <span className="text-sm text-neutral-400 ml-2">{subtext}</span>
      </div>

      {/* Lifetime stat */}
      <div className="text-xs text-neutral-500 mb-3">
        All-time: <span className="text-neutral-400">{lifetimeValue} {lifetimeLabel}</span>
      </div>

      {/* Nudge message (when metric is low) */}
      {nudgeMessage && !readonly && (
        <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2 mb-2">
          {nudgeMessage}
        </div>
      )}

      {/* CTA (only show if not readonly) */}
      {ctaText && !readonly && (
        <div className="mt-2 pt-2 border-t border-neutral-700/50">
          {ctaHref ? (
            <Link 
              href={ctaHref}
              className={`text-xs ${config.color} hover:underline flex items-center gap-1`}
            >
              <Calendar className="w-3 h-3" />
              {ctaText}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className={`text-xs ${config.color} flex items-center gap-1`}>
              <Calendar className="w-3 h-3" />
              {ctaText}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
