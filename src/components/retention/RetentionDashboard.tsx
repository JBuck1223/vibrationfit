'use client'

import { useState, useEffect } from 'react'
import { Card, Spinner } from '@/lib/design-system/components'
import RetentionMetricTile from './RetentionMetricTile'
import type { RetentionMetrics } from '@/lib/retention/types'

interface RetentionDashboardProps {
  /** User ID to fetch metrics for (defaults to current user) */
  userId?: string
  /** Read-only mode for public profiles */
  readonly?: boolean
  /** Optional className for the grid container */
  className?: string
}

export default function RetentionDashboard({
  userId,
  readonly = false,
  className = '',
}: RetentionDashboardProps) {
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)
        
        const url = userId 
          ? `/api/retention-metrics?userId=${userId}`
          : '/api/retention-metrics'
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch retention metrics')
        }
        
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching retention metrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userId])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 md:p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-neutral-700 rounded-lg" />
              <div className="w-20 h-4 bg-neutral-700 rounded" />
            </div>
            <div className="w-32 h-8 bg-neutral-700 rounded mb-2" />
            <div className="w-24 h-3 bg-neutral-700 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <p className="text-red-400 text-sm">{error}</p>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  // Format the next session CTA
  const getSessionCta = () => {
    if (!metrics.sessions.nextEvent) return undefined
    const date = new Date(metrics.sessions.nextEvent.scheduledAt)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `Next: ${dayName} ${time}`
  }

  // Format the last creation CTA
  const getCreationContext = () => {
    if (!metrics.creations.lastCreation) return undefined
    const date = new Date(metrics.creations.lastCreation.createdAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    const typeLabels: Record<string, string> = {
      vision: 'Vision',
      audio: 'Audio',
      board: 'Board item',
      journal: 'Journal',
    }
    
    const typeLabel = typeLabels[metrics.creations.lastCreation.type] || 'Item'
    const timeLabel = diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays}d ago`
    
    return `Last: ${typeLabel} ${timeLabel}`
  }

  // Format the last connection context
  const getConnectionContext = () => {
    if (!metrics.connections.lastPost) return undefined
    const tag = metrics.connections.lastPost.vibeTag
    const snippet = metrics.connections.lastPost.snippet
    return `Last: [${tag}] "${snippet}"`
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Sessions Tile */}
      <RetentionMetricTile
        type="sessions"
        headline={`${metrics.sessions.recent} / ${metrics.sessions.target} weeks`}
        subtext=""
        lifetimeLabel="Alignment Gyms"
        lifetimeValue={metrics.sessions.lifetime}
        ctaText={getSessionCta()}
        ctaHref="/alignment-gym"
        readonly={readonly}
      />

      {/* Connections Tile */}
      <RetentionMetricTile
        type="connections"
        headline={`${metrics.connections.recent} this week`}
        subtext=""
        lifetimeLabel="interactions"
        lifetimeValue={metrics.connections.lifetime}
        ctaText={getConnectionContext()}
        ctaHref="/vibe-tribe"
        nudgeMessage={metrics.connections.needsNudge ? "Share one win or wobble with the Vibe Tribe today." : undefined}
        readonly={readonly}
      />

      {/* Activations Tile */}
      <RetentionMetricTile
        type="activations"
        headline={`${metrics.activations.recent} / ${metrics.activations.target} days`}
        subtext=""
        lifetimeLabel="activation days"
        lifetimeValue={metrics.activations.lifetime}
        readonly={readonly}
      />

      {/* Creations Tile */}
      <RetentionMetricTile
        type="creations"
        headline={`${metrics.creations.recent} in last 30 days`}
        subtext=""
        lifetimeLabel="assets created"
        lifetimeValue={metrics.creations.lifetime}
        ctaText={getCreationContext()}
        readonly={readonly}
      />
    </div>
  )
}
