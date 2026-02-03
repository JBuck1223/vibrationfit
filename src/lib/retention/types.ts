/**
 * Retention Metrics Types
 * 
 * These types define the shape of retention metrics calculated real-time
 * from existing database tables. The 4 metrics measure:
 * 1. Sessions - Alignment Gym attendance
 * 2. Connections - Vibe Tribe interactions
 * 3. Activations - Daily use (audio plays, vision views)
 * 4. Creations - Asset building activity
 */

export interface SessionMetrics {
  /** Number of sessions attended in last 4 weeks */
  recent: number
  /** Target weeks to measure (always 4) */
  target: number
  /** All-time sessions attended */
  lifetime: number
  /** Next upcoming session if any */
  nextEvent?: {
    title: string
    scheduledAt: string
  }
}

export interface ConnectionMetrics {
  /** Interactions this week (posts + comments + hearts) */
  recent: number
  /** All-time interactions */
  lifetime: number
  /** Most recent post */
  lastPost?: {
    vibeTag: string
    snippet: string
    createdAt: string
  }
  /** True if user has 0 interactions this week */
  needsNudge: boolean
}

export interface ActivationMetrics {
  /** Distinct days with activity in last 30 days */
  recent: number
  /** Target days to measure (always 30) */
  target: number
  /** All-time activation days */
  lifetime: number
  /** Total audio plays (used as proxy for engagement) */
  totalAudioPlays: number
}

export interface CreationMetrics {
  /** Creations in last 30 days */
  recent: number
  /** All-time assets created */
  lifetime: number
  /** Most recent creation */
  lastCreation?: {
    type: 'vision' | 'audio' | 'board' | 'journal'
    title: string
    createdAt: string
  }
}

export interface RetentionMetrics {
  sessions: SessionMetrics
  connections: ConnectionMetrics
  activations: ActivationMetrics
  creations: CreationMetrics
  /** When these metrics were calculated */
  calculatedAt: string
}

/**
 * Tile display configuration for each metric
 */
export interface MetricTileConfig {
  title: string
  icon: string
  color: string
  nudgeMessage?: string
}

export const METRIC_TILE_CONFIGS: Record<keyof Omit<RetentionMetrics, 'calculatedAt'>, MetricTileConfig> = {
  sessions: {
    title: 'Sessions',
    icon: 'Users',
    color: 'teal',
  },
  connections: {
    title: 'Connections',
    icon: 'Heart',
    color: 'purple',
    nudgeMessage: 'Share one win or wobble with the Vibe Tribe today.',
  },
  activations: {
    title: 'Activations',
    icon: 'Play',
    color: 'green',
  },
  creations: {
    title: 'Creations',
    icon: 'Sparkles',
    color: 'yellow',
  },
}
