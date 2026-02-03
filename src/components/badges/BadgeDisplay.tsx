'use client'

import { useState, useEffect } from 'react'
import { Card, Spinner } from '@/lib/design-system/components'
import BadgeWithProgress from './BadgeWithProgress'
import {
  UserBadgeStatus,
  BadgeCategory,
  BADGE_CATEGORY_INFO,
  BADGE_CATEGORY_COLORS,
} from '@/lib/badges/types'
import { Users, Heart, Play, Sparkles } from 'lucide-react'

interface BadgeDisplayProps {
  /** User ID to display badges for */
  userId?: string
  /** Compact mode shows fewer details */
  compact?: boolean
  /** Hide categories with no progress */
  hideEmpty?: boolean
  /** Optional className */
  className?: string
  /** Lock badges until earned (hides icon/name until complete) */
  lockUntilEarned?: boolean
  /** Badge variant style: default (3D raised), engraved (pressed in), or premium (dark with color) */
  variant?: 'default' | 'engraved' | 'premium'
}

// Category icons matching tiles
const CATEGORY_ICONS: Record<BadgeCategory, typeof Users> = {
  sessions: Users,
  connections: Heart,
  activations: Play,
  creations: Sparkles,
}

export default function BadgeDisplay({
  userId,
  compact = false,
  hideEmpty = false,
  className = '',
  lockUntilEarned = false,
  variant = 'default',
}: BadgeDisplayProps) {
  const [badgeStatus, setBadgeStatus] = useState<UserBadgeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBadges() {
      try {
        setLoading(true)
        setError(null)
        
        const url = userId
          ? `/api/badges?userId=${userId}`
          : '/api/badges'
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch badges')
        }
        
        const data = await response.json()
        setBadgeStatus(data)
      } catch (err) {
        console.error('Error fetching badges:', err)
        setError(err instanceof Error ? err.message : 'Failed to load badges')
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId])

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <p className="text-red-400 text-sm text-center">{error}</p>
      </Card>
    )
  }

  if (!badgeStatus) {
    return null
  }

  const categories: BadgeCategory[] = ['creations', 'activations', 'connections', 'sessions']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Badges</h3>
        <span className="text-sm text-neutral-400">
          {badgeStatus.earnedCount} / {badgeStatus.totalCount} earned
        </span>
      </div>

      {/* Badges by category */}
      {categories.map(category => {
        const badges = badgeStatus.byCategory[category]
        const info = BADGE_CATEGORY_INFO[category]
        const colors = BADGE_CATEGORY_COLORS[category]
        const Icon = CATEGORY_ICONS[category]
        const earnedInCategory = badges.filter(b => b.earned).length

        // Optionally hide empty categories
        if (hideEmpty && earnedInCategory === 0 && badges.every(b => b.progress.current === 0)) {
          return null
        }

        return (
          <Card
            key={category}
            className={`p-4 ${colors.bg} border ${colors.border}`}
          >
            {/* Category header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                <Icon className="w-4 h-4" style={{ color: colors.primary }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">{info.label}</h4>
                <p className="text-xs text-neutral-500">{info.description}</p>
              </div>
              <span className="text-xs text-neutral-500">
                {earnedInCategory}/{badges.length}
              </span>
            </div>

            {/* Badge grid */}
            <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
              {badges.map(badge => (
                <BadgeWithProgress
                  key={badge.definition.type}
                  badge={badge}
                  size={compact ? 'sm' : 'md'}
                  showLabel={!compact}
                  showProgress={true}
                  locked={lockUntilEarned}
                  variant={variant}
                />
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
