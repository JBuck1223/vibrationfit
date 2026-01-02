'use client'

/**
 * Post-Call Summary Component
 * 
 * Shown after a video session ends.
 * Displays session stats and options for next steps.
 */

import { useState } from 'react'
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Video as VideoIcon,
  FileText,
  Calendar,
  MessageSquare,
  Download,
  Share2,
  Star,
  Sparkles
} from 'lucide-react'
import { Card, Button, Badge, Textarea } from '@/lib/design-system/components'
import type { VideoSession } from '@/lib/video/types'
import { formatDuration } from '@/lib/video/types'

interface PostCallSummaryProps {
  session: VideoSession
  duration: number // seconds
  isHost?: boolean
  onClose?: () => void
  onScheduleFollowUp?: () => void
  onViewRecording?: () => void
  onSaveNotes?: (notes: string) => void
}

export function PostCallSummary({
  session,
  duration,
  isHost = false,
  onClose,
  onScheduleFollowUp,
  onViewRecording,
  onSaveNotes,
}: PostCallSummaryProps) {
  const [notes, setNotes] = useState(session.host_notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return
    setIsSavingNotes(true)
    await onSaveNotes(notes)
    setIsSavingNotes(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-xl bg-neutral-900/90 backdrop-blur border-neutral-700">
        {/* Success accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-primary-500 to-secondary-500 rounded-t-2xl" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Session Complete</h1>
              <p className="text-neutral-400 mt-1">{session.title}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-primary-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{formatDuration(duration)}</p>
              <p className="text-xs text-neutral-500">Duration</p>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-secondary-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{session.max_participants}</p>
              <p className="text-xs text-neutral-500">Participants</p>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
              <VideoIcon className="w-5 h-5 text-accent-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">
                {session.recording_status === 'ready' || session.recording_status === 'uploaded' ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-neutral-500">Recording</p>
            </div>
          </div>

          {/* Recording status */}
          {(session.recording_status === 'processing' || session.recording_status === 'recording') && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="animate-spin">
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-yellow-400 font-medium">Processing Recording</p>
                <p className="text-yellow-400/70 text-sm">Your recording will be ready in a few minutes</p>
              </div>
            </div>
          )}

          {/* Recording ready */}
          {(session.recording_status === 'ready' || session.recording_status === 'uploaded') && onViewRecording && (
            <button
              onClick={onViewRecording}
              className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl p-4 flex items-center gap-4 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-primary-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium group-hover:text-primary-400 transition-colors">View Recording</p>
                <p className="text-neutral-500 text-sm">Watch the session replay</p>
              </div>
              <Download className="w-5 h-5 text-neutral-500 group-hover:text-primary-400 transition-colors" />
            </button>
          )}

          {/* Host notes section */}
          {isHost && (
            <div className="space-y-3">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-300 text-sm">Session Notes</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {notes ? 'Saved' : 'Add notes'}
                </Badge>
              </button>

              {showNotes && (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes about this session..."
                    rows={4}
                    className="bg-neutral-800 border-neutral-700"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="w-full"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {onScheduleFollowUp && (
              <Button
                variant="secondary"
                onClick={onScheduleFollowUp}
                className="flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Follow-up</span>
              </Button>
            )}
            <Button
              variant="primary"
              onClick={onClose}
              className="col-span-2 md:col-span-1 bg-gradient-to-r from-primary-500 to-secondary-500"
            >
              Done
            </Button>
          </div>

          {/* Feedback prompt */}
          <div className="pt-4 border-t border-neutral-800">
            <p className="text-center text-sm text-neutral-500">
              How was this session?
            </p>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
                >
                  <Star className="w-6 h-6 text-neutral-600 group-hover:text-yellow-400 group-hover:fill-yellow-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PostCallSummary

