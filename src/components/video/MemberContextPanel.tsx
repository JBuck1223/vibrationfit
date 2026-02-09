'use client'

/**
 * MemberContextPanel
 * 
 * Shows member data to the host during a 1:1 session.
 * Displays: profile, assessment scores, life vision, session history, previous notes.
 */

import { useEffect, useState } from 'react'
import { 
  User, 
  BarChart3, 
  Target, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'

interface MemberProfile {
  id: string
  name: string
  firstName: string
  email: string
  avatarUrl: string | null
  memberSince: string
}

interface AssessmentData {
  overallScore: number
  scores: Record<string, number> | null
  completedAt: string
}

interface LifeVisionData {
  title: string
  status: string
  categoryScores: Record<string, number> | null
}

interface SessionHistory {
  totalSessions: number
  sessionsWithYou: number
  totalAttended: number
  previousNotes: Array<{
    date: string
    notes: string | null
    summary: string | null
  }>
}

interface MemberContext {
  profile: MemberProfile | null
  assessment: AssessmentData | null
  lifeVision: LifeVisionData | null
  sessionHistory: SessionHistory
}

interface MemberContextPanelProps {
  memberUserId: string
}

export function MemberContextPanel({ memberUserId }: MemberContextPanelProps) {
  const [context, setContext] = useState<MemberContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('assessment')

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await fetch(`/api/video/member-context?userId=${memberUserId}`)
        if (!response.ok) throw new Error('Failed to load member data')
        const data = await response.json()
        setContext(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchContext()
  }, [memberUserId])

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-neutral-900 items-center justify-center">
        <Spinner size="sm" />
        <p className="text-neutral-500 text-xs mt-2">Loading member data...</p>
      </div>
    )
  }

  if (error || !context) {
    return (
      <div className="flex flex-col h-full bg-neutral-900 items-center justify-center px-4">
        <p className="text-neutral-500 text-xs text-center">Could not load member data</p>
      </div>
    )
  }

  const { profile, assessment, lifeVision, sessionHistory } = context

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-primary-400'
    if (score >= 6) return 'text-secondary-400'
    if (score >= 4) return 'text-energy-400'
    return 'text-red-400'
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-primary-500'
    if (score >= 6) return 'bg-secondary-500'
    if (score >= 4) return 'bg-energy-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 overflow-hidden">
      {/* Member Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-500">
                {profile?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.name || 'Member'}
            </p>
            <p className="text-neutral-500 text-xs truncate">
              {profile?.email}
            </p>
          </div>
          {assessment?.overallScore != null && (
            <div className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-lg">
              <TrendingUp className={`w-3.5 h-3.5 ${getScoreColor(assessment.overallScore)}`} />
              <span className={`text-sm font-bold ${getScoreColor(assessment.overallScore)}`}>
                {assessment.overallScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        {profile?.memberSince && (
          <p className="text-neutral-600 text-[10px] mt-1">
            Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Assessment Scores */}
        {assessment && (
          <div className="border-b border-neutral-800">
            <button 
              onClick={() => toggleSection('assessment')}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-secondary-500" />
                <span className="text-xs font-medium text-neutral-300">Assessment Scores</span>
              </div>
              {expandedSection === 'assessment' ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>
            {expandedSection === 'assessment' && assessment.scores && (
              <div className="px-4 pb-3 space-y-2">
                {Object.entries(assessment.scores)
                  .sort(([, a], [, b]) => (a as number) - (b as number))
                  .map(([category, score]) => (
                    <div key={category} className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 w-24 truncate capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getScoreBarColor(score as number)}`}
                          style={{ width: `${((score as number) / 10) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium w-6 text-right ${getScoreColor(score as number)}`}>
                        {(score as number).toFixed(1)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Life Vision */}
        {lifeVision && (
          <div className="border-b border-neutral-800">
            <button 
              onClick={() => toggleSection('vision')}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-accent-500" />
                <span className="text-xs font-medium text-neutral-300">Life Vision</span>
              </div>
              {expandedSection === 'vision' ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>
            {expandedSection === 'vision' && (
              <div className="px-4 pb-3">
                <p className="text-xs text-white mb-1">{lifeVision.title}</p>
                <p className="text-[10px] text-neutral-500 capitalize">Status: {lifeVision.status}</p>
                {lifeVision.categoryScores && (
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(lifeVision.categoryScores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([category, score]) => (
                        <div key={category} className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 w-20 truncate capitalize">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getScoreBarColor(score as number)}`}
                              style={{ width: `${((score as number) / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Session History */}
        <div className="border-b border-neutral-800">
          <button 
            onClick={() => toggleSection('history')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-neutral-300">Session History</span>
              <span className="text-[10px] text-neutral-600">({sessionHistory.sessionsWithYou} with you)</span>
            </div>
            {expandedSection === 'history' ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>
          {expandedSection === 'history' && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-neutral-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{sessionHistory.totalSessions}</p>
                  <p className="text-[10px] text-neutral-500">Total</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{sessionHistory.totalAttended}</p>
                  <p className="text-[10px] text-neutral-500">Attended</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{sessionHistory.sessionsWithYou}</p>
                  <p className="text-[10px] text-neutral-500">With You</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Previous Notes */}
        {sessionHistory.previousNotes.length > 0 && (
          <div className="border-b border-neutral-800">
            <button 
              onClick={() => toggleSection('notes')}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-energy-500" />
                <span className="text-xs font-medium text-neutral-300">Previous Notes</span>
              </div>
              {expandedSection === 'notes' ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>
            {expandedSection === 'notes' && (
              <div className="px-4 pb-3 space-y-2">
                {sessionHistory.previousNotes.slice(0, 3).map((note, i) => (
                  <div key={i} className="bg-neutral-800/30 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-2.5 h-2.5 text-neutral-600" />
                      <span className="text-[10px] text-neutral-600">
                        {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {note.notes && (
                      <p className="text-[11px] text-neutral-300 leading-relaxed">{note.notes}</p>
                    )}
                    {note.summary && (
                      <p className="text-[11px] text-neutral-400 italic mt-1">{note.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberContextPanel
