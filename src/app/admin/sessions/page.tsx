'use client'

/**
 * Admin Sessions List Page
 * 
 * Admin view for managing all video sessions.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Video, 
  Plus, 
  Calendar,
  Clock,
  Filter,
  Search,
  Users,
  User,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Play
} from 'lucide-react'
import { 
  PageHero, 
  Container, 
  Button, 
  Card,
  Input,
  Spinner,
  Badge,
  Stack
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import type { VideoSession, VideoSessionParticipant, VideoSessionStatus } from '@/lib/video/types'
import { getSessionTypeLabel, getSessionStatusLabel, isSessionJoinable } from '@/lib/video/types'

type SessionWithParticipants = VideoSession & {
  participants?: VideoSessionParticipant[]
}

function AdminSessionsContent() {
  const router = useRouter()
  
  // State
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [search, setSearch] = useState('')

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (filter === 'upcoming') {
      if (session.status === 'completed' || session.status === 'cancelled') {
        return false
      }
    }
    if (filter === 'past') {
      if (session.status !== 'completed' && session.status !== 'cancelled') {
        return false
      }
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        session.title.toLowerCase().includes(searchLower) ||
        session.description?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Handle delete
  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const response = await fetch(`/api/video/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  // Status badge styling
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
    completed: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  // Stats
  const upcomingCount = sessions.filter(s => 
    s.status === 'scheduled' || s.status === 'waiting' || s.status === 'live'
  ).length
  const liveCount = sessions.filter(s => s.status === 'live').length
  const completedCount = sessions.filter(s => s.status === 'completed').length

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Video Sessions"
          subtitle="Manage and schedule coaching sessions"
        />
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{upcomingCount}</p>
                <p className="text-xs text-neutral-500">Upcoming</p>
              </div>
            </div>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{liveCount}</p>
                <p className="text-xs text-neutral-500">Live Now</p>
              </div>
            </div>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedCount}</p>
                <p className="text-xs text-neutral-500">Completed</p>
              </div>
            </div>
          </Card>

          <Card 
            className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-primary-500/30 p-4 cursor-pointer hover:border-primary-500/50 transition-colors"
            onClick={() => router.push('/admin/sessions/new')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/30 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">New Session</p>
                <p className="text-xs text-neutral-400">Create manually</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'upcoming' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={filter === 'past' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('past')}
            >
              Past
            </Button>
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>

          <div className="flex-1 md:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8" />
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/30 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <Button variant="secondary" onClick={fetchSessions} className="mt-4">
              Try Again
            </Button>
          </Card>
        ) : filteredSessions.length === 0 ? (
          <Card className="bg-neutral-900 border-neutral-700 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No sessions found
            </h3>
            <p className="text-neutral-400 mb-6">
              Create a session or wait for members to book appointments.
            </p>
            <Button 
              variant="primary" 
              onClick={() => router.push('/admin/sessions/new')}
              className="bg-gradient-to-r from-primary-500 to-secondary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </Card>
        ) : (
          <Card className="bg-neutral-900 border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-4">
                      Session
                    </th>
                    <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-4">
                      Date & Time
                    </th>
                    <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-4">
                      Participant
                    </th>
                    <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-4">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredSessions.map(session => {
                    const scheduledDate = new Date(session.scheduled_at)
                    const participant = session.participants?.find(p => !p.is_host)
                    const joinable = isSessionJoinable(session)
                    
                    return (
                      <tr key={session.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                              {session.session_type === 'one_on_one' 
                                ? <User className="w-5 h-5 text-primary-500" />
                                : <Users className="w-5 h-5 text-secondary-500" />
                              }
                            </div>
                            <div>
                              <p className="text-white font-medium">{session.title}</p>
                              <p className="text-xs text-neutral-500">
                                {getSessionTypeLabel(session.session_type)} · {session.scheduled_duration_minutes}min
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white">
                            {scheduledDate.toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {scheduledDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {participant ? (
                            <div>
                              <p className="text-white">{participant.name || 'Unnamed'}</p>
                              <p className="text-xs text-neutral-500">{participant.email}</p>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-sm">No participant</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusStyles[session.status]} border text-xs`}>
                            {session.status === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
                            )}
                            {getSessionStatusLabel(session.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {(joinable || session.status === 'live') && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => router.push(`/session/${session.id}`)}
                                className="bg-gradient-to-r from-primary-500 to-secondary-500"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Join
                              </Button>
                            )}
                            <button
                              onClick={() => router.push(`/admin/sessions/${session.id}`)}
                              className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

export default function AdminSessionsPageWrapper() {
  return (
    <AdminWrapper>
      <AdminSessionsContent />
    </AdminWrapper>
  )
}

