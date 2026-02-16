'use client'

import { useState, useEffect } from 'react'
import { Card, Spinner } from '@/lib/design-system/components'
import { 
  Play, Sparkles, Heart, Users, ChevronDown, ChevronUp,
  Music, BookOpen, FileText, Gem, Image, Video, MessageSquare,
  HeartHandshake, ThumbsUp, Calendar
} from 'lucide-react'

interface BreakdownItem {
  recent: number
  lifetime: number
}

interface DetailedMetrics {
  creations: {
    recent: number
    lifetime: number
    breakdown: {
      visions: BreakdownItem
      audios: BreakdownItem
      board_items: BreakdownItem
      journals: BreakdownItem
      daily_papers: BreakdownItem
      abundance: BreakdownItem
    }
    recentItems: Array<{ type: string; title: string; created_at: string }>
  }
  activations: {
    recent: number
    lifetime: number
    totalAudioPlays: number
    breakdown: {
      audio_plays: BreakdownItem
      journals: BreakdownItem
      daily_papers: BreakdownItem
      abundance: BreakdownItem
      board_actions: BreakdownItem
      gym_sessions: BreakdownItem
      tribe_posts: BreakdownItem
    }
    recentAudioPlays: Array<{
      track_id: string
      audio_set_name: string
      section_key: string
      play_count: number
      content_type: string
      text_snippet: string
    }>
  }
  connections: {
    recent: number
    lifetime: number
    needsNudge: boolean
    breakdown: {
      posts: BreakdownItem
      comments: BreakdownItem
      hearts: BreakdownItem
    }
    recentPosts: Array<{ content: string; vibe_tag: string; created_at: string }>
  }
  sessions: {
    recent: number
    target: number
    lifetime: number
    recentSessions: Array<{ title: string; attended_at: string }>
    nextEvent?: { title: string; scheduledAt: string }
  }
  calculatedAt: string
}

interface RetentionMetricsBreakdownProps {
  userId: string
}

export default function RetentionMetricsBreakdown({ userId }: RetentionMetricsBreakdownProps) {
  const [metrics, setMetrics] = useState<DetailedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/retention-metrics/${userId}`)
        if (!response.ok) throw new Error('Failed to fetch retention metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching admin retention metrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [userId])

  function toggleSection(section: string) {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </Card>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Creations"
          icon={<Sparkles className="w-4 h-4" />}
          recent={metrics.creations.recent}
          lifetime={metrics.creations.lifetime}
          recentLabel="last 30d"
          color="yellow"
        />
        <SummaryCard
          label="Activations"
          icon={<Play className="w-4 h-4" />}
          recent={metrics.activations.recent}
          lifetime={metrics.activations.lifetime}
          recentLabel="last 30d"
          color="green"
        />
        <SummaryCard
          label="Connections"
          icon={<Heart className="w-4 h-4" />}
          recent={metrics.connections.recent}
          lifetime={metrics.connections.lifetime}
          recentLabel="this week"
          color="purple"
        />
        <SummaryCard
          label="Sessions"
          icon={<Users className="w-4 h-4" />}
          recent={metrics.sessions.recent}
          lifetime={metrics.sessions.lifetime}
          recentLabel="last 4 weeks"
          color="teal"
        />
      </div>

      {/* Creations Breakdown */}
      <ExpandableSection
        title="Creations Breakdown"
        subtitle="What assets has this member built?"
        icon={<Sparkles className="w-5 h-5 text-yellow-400" />}
        color="yellow"
        isExpanded={expandedSection === 'creations'}
        onToggle={() => toggleSection('creations')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <BreakdownRow icon={<BookOpen className="w-4 h-4" />} label="Visions" item={metrics.creations.breakdown.visions} />
            <BreakdownRow icon={<Music className="w-4 h-4" />} label="Audio Sets" item={metrics.creations.breakdown.audios} />
            <BreakdownRow icon={<Image className="w-4 h-4" />} label="Board Items" item={metrics.creations.breakdown.board_items} />
            <BreakdownRow icon={<FileText className="w-4 h-4" />} label="Journals" item={metrics.creations.breakdown.journals} />
            <BreakdownRow icon={<Calendar className="w-4 h-4" />} label="Daily Papers" item={metrics.creations.breakdown.daily_papers} />
            <BreakdownRow icon={<Gem className="w-4 h-4" />} label="Abundance" item={metrics.creations.breakdown.abundance} />
          </div>

          {metrics.creations.recentItems.length > 0 && (
            <div className="pt-3 border-t border-[#333]">
              <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Recent Creations</h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {metrics.creations.recentItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-[#1A1A1A]">
                    <div className="flex items-center gap-2 min-w-0">
                      <CreationTypeIcon type={item.type} />
                      <span className="text-neutral-300 truncate">{item.title}</span>
                    </div>
                    <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Activations Breakdown */}
      <ExpandableSection
        title="Activations Breakdown"
        subtitle="What activities are feeding this number?"
        icon={<Play className="w-5 h-5 text-green-400" />}
        color="green"
        isExpanded={expandedSection === 'activations'}
        onToggle={() => toggleSection('activations')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <BreakdownRow icon={<Music className="w-4 h-4" />} label="Audio Plays" item={metrics.activations.breakdown.audio_plays} />
            <BreakdownRow icon={<FileText className="w-4 h-4" />} label="Journals" item={metrics.activations.breakdown.journals} />
            <BreakdownRow icon={<Calendar className="w-4 h-4" />} label="Daily Papers" item={metrics.activations.breakdown.daily_papers} />
            <BreakdownRow icon={<Gem className="w-4 h-4" />} label="Abundance" item={metrics.activations.breakdown.abundance} />
            <BreakdownRow icon={<Image className="w-4 h-4" />} label="Board Actions" item={metrics.activations.breakdown.board_actions} />
            <BreakdownRow icon={<Video className="w-4 h-4" />} label="Gym Sessions" item={metrics.activations.breakdown.gym_sessions} />
            <BreakdownRow icon={<MessageSquare className="w-4 h-4" />} label="Tribe Posts" item={metrics.activations.breakdown.tribe_posts} />
          </div>

          {metrics.activations.recentAudioPlays.length > 0 && (
            <div className="pt-3 border-t border-[#333]">
              <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                Audio Track Plays ({metrics.activations.totalAudioPlays} total)
              </h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {metrics.activations.recentAudioPlays.map((track) => (
                  <div key={track.track_id} className="px-3 py-2 rounded-lg bg-[#1A1A1A]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-white font-medium">
                          {formatSectionKey(track.section_key)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        {track.play_count}x played
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 ml-5.5">
                      {track.audio_set_name} - {track.content_type}
                    </div>
                    {track.text_snippet && (
                      <div className="text-xs text-neutral-600 ml-5.5 mt-0.5 italic">
                        &ldquo;{track.text_snippet}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Connections Breakdown */}
      <ExpandableSection
        title="Connections Breakdown"
        subtitle="Vibe Tribe community engagement"
        icon={<Heart className="w-5 h-5 text-purple-400" />}
        color="purple"
        isExpanded={expandedSection === 'connections'}
        onToggle={() => toggleSection('connections')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <BreakdownRow icon={<MessageSquare className="w-4 h-4" />} label="Posts" item={metrics.connections.breakdown.posts} />
            <BreakdownRow icon={<HeartHandshake className="w-4 h-4" />} label="Comments" item={metrics.connections.breakdown.comments} />
            <BreakdownRow icon={<ThumbsUp className="w-4 h-4" />} label="Hearts" item={metrics.connections.breakdown.hearts} />
          </div>

          {metrics.connections.needsNudge && (
            <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
              Zero interactions this week - may need a nudge.
            </div>
          )}

          {metrics.connections.recentPosts.length > 0 && (
            <div className="pt-3 border-t border-[#333]">
              <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Recent Posts</h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {metrics.connections.recentPosts.map((post, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-[#1A1A1A]">
                    <div className="flex items-center justify-between mb-1">
                      {post.vibe_tag && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                          {post.vibe_tag}
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">{formatDate(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-neutral-300">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Sessions Breakdown */}
      <ExpandableSection
        title="Sessions Breakdown"
        subtitle={`${metrics.sessions.recent} / ${metrics.sessions.target} target in last 4 weeks`}
        icon={<Users className="w-5 h-5 text-teal-400" />}
        color="teal"
        isExpanded={expandedSection === 'sessions'}
        onToggle={() => toggleSection('sessions')}
      >
        <div className="space-y-4">
          {metrics.sessions.nextEvent && (
            <div className="text-sm text-teal-400 bg-teal-500/10 rounded-lg px-3 py-2 border border-teal-500/20">
              <span className="font-medium">Next session:</span>{' '}
              {metrics.sessions.nextEvent.title} - {formatDate(metrics.sessions.nextEvent.scheduledAt)}
            </div>
          )}

          {metrics.sessions.recentSessions.length > 0 ? (
            <div>
              <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Recent Sessions Attended</h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {metrics.sessions.recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-sm text-neutral-300">{session.title}</span>
                    </div>
                    <span className="text-xs text-neutral-500">{formatDate(session.attended_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">No sessions attended yet</p>
          )}
        </div>
      </ExpandableSection>

      {/* Meta info */}
      <p className="text-xs text-neutral-600 text-right">
        Calculated at {new Date(metrics.calculatedAt).toLocaleString()}
      </p>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

function SummaryCard({
  label, icon, recent, lifetime, recentLabel, color,
}: {
  label: string
  icon: React.ReactNode
  recent: number
  lifetime: number
  recentLabel: string
  color: 'yellow' | 'green' | 'purple' | 'teal'
}) {
  const colorMap = {
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  }
  const c = colorMap[color]

  return (
    <Card className={`p-3 md:p-4 ${c.bg} border ${c.border}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={c.text}>{icon}</span>
        <span className={`text-xs font-medium ${c.text}`}>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold text-white">{recent}</div>
      <div className="text-xs text-neutral-500">{recentLabel}</div>
      <div className="text-xs text-neutral-600 mt-1">Lifetime: {lifetime}</div>
    </Card>
  )
}

function ExpandableSection({
  title, subtitle, icon, color, isExpanded, onToggle, children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: 'yellow' | 'green' | 'purple' | 'teal'
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const colorMap = {
    yellow: 'border-yellow-500/20 hover:border-yellow-500/40',
    green: 'border-green-500/20 hover:border-green-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    teal: 'border-teal-500/20 hover:border-teal-500/40',
  }

  return (
    <Card className={`border ${colorMap[color]} transition-colors`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="text-sm md:text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
        </div>
        {isExpanded
          ? <ChevronUp className="w-5 h-5 text-neutral-400" />
          : <ChevronDown className="w-5 h-5 text-neutral-400" />
        }
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          {children}
        </div>
      )}
    </Card>
  )
}

function BreakdownRow({
  icon, label, item,
}: {
  icon: React.ReactNode
  label: string
  item: BreakdownItem
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1A1A]">
      <span className="text-neutral-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-neutral-400 truncate">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white">{item.recent}</span>
          <span className="text-xs text-neutral-600">/ {item.lifetime} all-time</span>
        </div>
      </div>
    </div>
  )
}

function CreationTypeIcon({ type }: { type: string }) {
  const iconClass = 'w-3.5 h-3.5 text-neutral-500 flex-shrink-0'
  switch (type) {
    case 'vision': return <BookOpen className={iconClass} />
    case 'audio': return <Music className={iconClass} />
    case 'board': return <Image className={iconClass} />
    case 'journal': return <FileText className={iconClass} />
    case 'daily_paper': return <Calendar className={iconClass} />
    case 'abundance': return <Gem className={iconClass} />
    default: return <Sparkles className={iconClass} />
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSectionKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
