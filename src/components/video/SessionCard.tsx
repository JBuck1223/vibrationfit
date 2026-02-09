'use client'

/**
 * Session Card Component
 * 
 * Displays a video session in a card format.
 * Used in session lists and dashboards.
 */

import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  Play,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react'
import { Card, Badge, Button } from '@/lib/design-system/components'
import type { VideoSession, VideoSessionParticipant } from '@/lib/video/types'
import { getSessionTypeLabel, getSessionStatusLabel, isSessionJoinable } from '@/lib/video/types'

interface SessionCardProps {
  session: VideoSession & { 
    participants?: VideoSessionParticipant[] 
  }
  isHost?: boolean
  onJoin?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
}

export function SessionCard({
  session,
  isHost = false,
  onJoin,
  onEdit,
  onDelete,
  onViewDetails,
}: SessionCardProps) {
  const scheduledDate = new Date(session.scheduled_at)
  const isJoinable = isSessionJoinable(session)
  const participantCount = session.participants?.length || 0

  // Status badge styling
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
    completed: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  // Session type icon
  const TypeIcon = session.session_type === 'one_on_one' ? User : Users

  return (
    <Card className="bg-neutral-900 border-neutral-700 hover:border-neutral-600 transition-all duration-200 group">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-white font-medium group-hover:text-primary-400 transition-colors">
                {session.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <TypeIcon className="w-3 h-3 text-neutral-500" />
                <span className="text-xs text-neutral-500">
                  {getSessionTypeLabel(session.session_type)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            className={`${statusStyles[session.status]} border text-xs`}
          >
            {session.status === 'live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
            )}
            {getSessionStatusLabel(session.status)}
          </Badge>
        </div>

        {/* Description */}
        {session.description && (
          <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Details */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span>
              {scheduledDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <Clock className="w-4 h-4" />
            <span>
              {scheduledDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <Users className="w-4 h-4" />
            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            {isHost && onEdit && session.status === 'scheduled' && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Edit session"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isHost && onDelete && session.status !== 'live' && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="View details"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Join button */}
          {onJoin && (
            <Button
              variant={isJoinable ? 'primary' : 'secondary'}
              size="sm"
              onClick={onJoin}
              disabled={!isJoinable && session.status !== 'live'}
            >
              <Play className="w-4 h-4 mr-2" />
              {session.status === 'live' ? 'Join Now' : 'Join Session'}
            </Button>
          )}
        </div>

        {/* Recording indicator */}
        {session.recording_url && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <button className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
              <Video className="w-4 h-4" />
              <span>View Recording</span>
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default SessionCard

