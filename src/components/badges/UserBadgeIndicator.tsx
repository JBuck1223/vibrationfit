'use client'

import { useState, useEffect } from 'react'
import BadgeIcon from './BadgeIcon'
import { BadgeType } from '@/lib/badges/types'

interface UserBadgeIndicatorProps {
  /** User ID to check badges for */
  userId: string
  /** Only show specific badge types */
  showOnly?: BadgeType[]
  /** Size of badge icons */
  size?: 'xs' | 'sm' | 'md'
  /** Additional className */
  className?: string
}

// Cache for user badges to avoid repeated API calls
const badgeCache = new Map<string, BadgeType[]>()

/**
 * Shows earned badges next to a user's name.
 * Primarily used to show vibe_anchor badge in Vibe Tribe.
 * 
 * Caches badge data to minimize API calls.
 */
export default function UserBadgeIndicator({
  userId,
  showOnly = ['vibe_anchor'], // Default to showing vibe_anchor (leader badge)
  size = 'xs',
  className = '',
}: UserBadgeIndicatorProps) {
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBadges() {
      // Check cache first
      if (badgeCache.has(userId)) {
        setBadges(badgeCache.get(userId) || [])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/badges?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          const earnedTypes = data.badges
            ?.filter((b: { earned: boolean }) => b.earned)
            ?.map((b: { definition: { type: BadgeType } }) => b.definition.type) || []
          
          // Cache the results
          badgeCache.set(userId, earnedTypes)
          setBadges(earnedTypes)
        }
      } catch (error) {
        console.error('Error fetching user badges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId])

  if (loading) return null

  // Filter to only show specific badges
  const visibleBadges = badges.filter(b => showOnly.includes(b))
  
  if (visibleBadges.length === 0) return null

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {visibleBadges.map(badgeType => (
        <BadgeIcon
          key={badgeType}
          badgeType={badgeType}
          size={size}
          showTooltip
        />
      ))}
    </span>
  )
}

/**
 * Clear the badge cache (useful when badges are updated)
 */
export function clearBadgeCache(userId?: string) {
  if (userId) {
    badgeCache.delete(userId)
  } else {
    badgeCache.clear()
  }
}
