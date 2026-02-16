/**
 * Retention Metrics Types
 * 
 * These types define the shape of retention metrics calculated real-time
 * from existing database tables. The 4 metrics measure different dimensions:
 * 1. Creations - "What have I built?" (Asset count)
 * 2. Activations - "How many times did I run my practice?" (Total qualifying events)
 * 3. Connections - "How much am I engaging with the community?" (Vibe Tribe interactions)
 * 4. Sessions - "How often am I showing up to live coaching?" (Alignment Gym attendance)
 * 
 * Note: Activities can increment multiple metrics. For example, attending an Alignment Gym
 * session adds +1 Session AND +1 Activation. Creating a journal entry adds +1 Creation AND
 * +1 Activation. This is intentional: each metric answers a different question about practice.
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
  /** Total qualifying activation events in last 30 days */
  recent: number
  /** All-time total activation events */
  lifetime: number
  /** Total audio plays across all tracks (subset of activations) */
  totalAudioPlays: number
}

export interface CreationMetrics {
  /** Creations in last 30 days */
  recent: number
  /** All-time assets created */
  lifetime: number
  /** Most recent creation */
  lastCreation?: {
    type: 'vision' | 'audio' | 'board' | 'journal' | 'daily_paper' | 'abundance'
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
