'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Badge, Button, Stack, PageHero } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import Image from 'next/image'
import {
  ArrowLeft, User, Mail, Phone, Globe, Calendar, Clock, Shield,
  Zap, HardDrive, FileText, MessageSquare, Video, BookOpen,
  Award, Heart, Mic, Target, CreditCard, ChevronDown, ChevronUp,
  Eye, ListChecks, Sparkles, BarChart3, Send, Users, LayoutGrid,
  ImageIcon, CheckCircle, AlertTriangle, MinusCircle, Play
} from 'lucide-react'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function formatCurrency(cents: number | null | undefined): string {
  if (!cents && cents !== 0) return '$0.00'
  return `$${(cents / 100).toFixed(2)}`
}

function Section({ title, icon: Icon, children, defaultOpen = true, count }: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {count !== undefined && (
            <Badge variant="neutral" className="text-xs">{count}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-neutral-700/50 pt-4">{children}</div>}
    </Card>
  )
}

function DataRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-neutral-800 last:border-0">
      <span className="text-neutral-400 text-sm w-48 flex-shrink-0">{label}</span>
      <span className={`text-white text-sm flex-1 ${mono ? 'font-mono text-xs' : ''}`}>{value || <span className="text-neutral-600 italic">Not set</span>}</span>
    </div>
  )
}

function IntensiveChecklist({ checklist }: { checklist: any }) {
  const steps = [
    { key: 'profile_completed', label: 'Profile Completed' },
    { key: 'assessment_completed', label: 'Assessment Completed' },
    { key: 'intake_completed', label: 'Intake Completed' },
    { key: 'unlock_completed', label: 'Unlock Completed' },
    { key: 'voice_recording_completed', label: 'Voice Recording' },
    { key: 'vision_drafted', label: 'Vision Drafted' },
    { key: 'vision_built', label: 'Vision Built' },
    { key: 'vision_refined', label: 'Vision Refined' },
    { key: 'audio_generated', label: 'Audio Generated' },
    { key: 'vision_board_completed', label: 'Vision Board' },
    { key: 'first_journal_entry', label: 'First Journal Entry' },
    { key: 'call_scheduled', label: 'Call Scheduled' },
    { key: 'calibration_call_completed', label: 'Calibration Call' },
    { key: 'activation_protocol_completed', label: 'Activation Protocol' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {steps.map(step => {
        const done = checklist[step.key]
        const at = checklist[`${step.key}_at`]
        return (
          <div key={step.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            done ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-neutral-500'
          }`}>
            <ListChecks className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{step.label}</span>
            {done && at && <span className="text-xs text-neutral-500">{formatDate(at)}</span>}
          </div>
        )
      })}
    </div>
  )
}

const VISION_CATEGORIES = [
  { key: 'forward', label: 'Forward / Opening' },
  { key: 'fun', label: 'Fun & Recreation' },
  { key: 'travel', label: 'Travel & Adventure' },
  { key: 'home', label: 'Home & Environment' },
  { key: 'family', label: 'Family' },
  { key: 'love', label: 'Love & Romance' },
  { key: 'health', label: 'Health & Fitness' },
  { key: 'money', label: 'Money & Finances' },
  { key: 'work', label: 'Work & Career' },
  { key: 'social', label: 'Social & Friends' },
  { key: 'stuff', label: 'Stuff & Possessions' },
  { key: 'giving', label: 'Giving & Legacy' },
  { key: 'spirituality', label: 'Spirituality' },
  { key: 'conclusion', label: 'Conclusion' },
]

function VisionDetail({ vision }: { vision: any }) {
  const [expanded, setExpanded] = useState(vision.is_active)
  const filledCategories = VISION_CATEGORIES.filter(c => vision[c.key])

  return (
    <div className={`rounded-xl border ${
      vision.is_active ? 'border-primary-500/30 bg-primary-500/5' : 'border-neutral-700 bg-neutral-800/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className={`w-5 h-5 ${vision.is_active ? 'text-primary-400' : 'text-neutral-600'}`} />
          <div>
            <span className="text-white font-medium">{vision.title}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {vision.is_active && <Badge variant="success" className="text-xs">Active</Badge>}
              {vision.is_draft && <Badge variant="warning" className="text-xs">Draft</Badge>}
              {vision.has_audio && <Badge variant="info" className="text-xs">Has Audio</Badge>}
              <span className="text-xs text-neutral-500">{vision.perspective} | {filledCategories.length} categories</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{formatDate(vision.created_at)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-700/50 pt-4">
          {vision.audio_url && (
            <div className="flex items-center gap-2 text-sm text-secondary-400">
              <Play className="w-4 h-4" />
              <span>Audio: {vision.voice_type || 'Default'}</span>
              {vision.audio_duration && <span>({vision.audio_duration})</span>}
              {vision.background_music && <span>| Music: {vision.background_music}</span>}
            </div>
          )}
          {vision.activation_message && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
              <div className="text-xs text-primary-400 font-semibold mb-1">Activation Message</div>
              <p className="text-sm text-white">{vision.activation_message}</p>
            </div>
          )}
          <div className="space-y-3">
            {filledCategories.map(cat => (
              <div key={cat.key}>
                <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">{cat.label}</h4>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">{vision[cat.key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssessmentDetail({ assessment, isLatest }: { assessment: any; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest)
  const categoryScores = assessment.category_scores || {}
  const greenLine = assessment.green_line_status || {}
  const maxPerCategory = 70

  const categories = ['fun', 'travel', 'home', 'family', 'love', 'health', 'money', 'work', 'social', 'stuff', 'giving', 'spirituality']

  function getGreenLineColor(status: string) {
    if (status === 'above') return 'text-green-400'
    if (status === 'transition') return 'text-yellow-400'
    return 'text-red-400'
  }

  function getGreenLineIcon(status: string) {
    if (status === 'above') return CheckCircle
    if (status === 'transition') return AlertTriangle
    return MinusCircle
  }

  return (
    <div className={`rounded-xl border ${isLatest ? 'border-primary-500/30 bg-primary-500/5' : 'border-neutral-700 bg-neutral-800/50'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className={`w-5 h-5 ${isLatest ? 'text-primary-400' : 'text-neutral-600'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {assessment.overall_percentage || 0}% ({assessment.total_score || 0}/{assessment.max_possible_score || 840})
              </span>
              {isLatest && <Badge variant="success" className="text-xs">Latest</Badge>}
              <Badge variant={assessment.status === 'completed' ? 'neutral' : 'warning'} className="text-xs">
                {assessment.status}
              </Badge>
              {assessment.is_active && <Badge variant="info" className="text-xs">Active</Badge>}
            </div>
            <span className="text-xs text-neutral-500">v{assessment.assessment_version || 1} | {formatDate(assessment.completed_at || assessment.created_at)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-700/50 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map(cat => {
              const score = categoryScores[cat]
              const glStatus = greenLine[cat] || 'below'
              const pct = score != null ? Math.round((score / maxPerCategory) * 100) : 0
              const GlIcon = getGreenLineIcon(glStatus)
              return (
                <div key={cat} className="bg-neutral-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-400 capitalize">{cat}</span>
                    <GlIcon className={`w-3.5 h-3.5 ${getGreenLineColor(glStatus)}`} />
                  </div>
                  <div className="text-lg font-bold text-white">{score ?? '—'}<span className="text-xs text-neutral-500 font-normal">/{maxPerCategory}</span></div>
                  <div className="w-full bg-neutral-700 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        glStatus === 'above' ? 'bg-green-500' : glStatus === 'transition' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={`text-xs mt-1 capitalize ${getGreenLineColor(glStatus)}`}>{glStatus}</div>
                </div>
              )
            })}
          </div>
          {assessment.notes && (
            <div className="bg-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-400 font-semibold mb-1">Notes</div>
              <p className="text-sm text-white">{assessment.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JournalEntryDetail({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false)
  const hasMedia = (entry.image_urls?.length > 0) || (entry.audio_recordings?.length > 0)

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-800/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BookOpen className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-white text-sm font-medium">{entry.title || 'Untitled'}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {entry.categories?.map((cat: string) => (
                <Badge key={cat} variant="neutral" className="text-xs">{cat}</Badge>
              ))}
              {hasMedia && <Badge variant="info" className="text-xs">Has Media</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-neutral-500">{formatDate(entry.date || entry.created_at)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-700/50 pt-3">
          <div className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">{entry.content}</div>
          {entry.image_urls?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.image_urls.map((url: string, i: number) => (
                <div key={i} className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-900 relative">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {entry.audio_recordings?.length > 0 && (
            <div className="space-y-2">
              {entry.audio_recordings.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-neutral-800 rounded-lg p-3">
                  <Mic className="w-4 h-4 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>{rec.type || 'audio'}</span>
                      {rec.category && <span>| {rec.category}</span>}
                      {rec.created_at && <span>| {formatDate(rec.created_at)}</span>}
                    </div>
                    {rec.transcript && (
                      <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap">{rec.transcript}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserDetailContent() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/admin/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user data')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-neutral-400">Loading user data...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !data?.account) {
    return (
      <Container size="xl">
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error || 'User not found'}</p>
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
          </Button>
        </div>
      </Container>
    )
  }

  const { account, profile, voiceProfile, activityMetrics, badges, communityStats,
    storage, intensive, visions, tokens, orders, conversations, videoSessions,
    bookings, assessments, journalEntries, sequenceEnrollments, communityPosts,
    visionBoard } = data

  const isAdmin = account.role === 'admin' || account.role === 'super_admin'
  const activeIntensive = (intensive.checklists || []).find((c: any) => c.status === 'in_progress' || c.status === 'pending')

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')} className="self-start">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </Button>

        {/* Hero header */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {account.profile_picture_url ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500/30 shadow-lg">
                  <Image src={account.profile_picture_url} alt="" width={96} height={96} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border-2 border-neutral-700">
                  <User className="w-10 h-10 text-neutral-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {account.full_name || account.email}
                </h1>
                {isAdmin && <Badge variant="success">Admin</Badge>}
                <Badge variant="neutral">{account.role}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-neutral-300">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-neutral-500" /> {account.email}</span>
                {account.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-neutral-500" /> {account.phone}</span>}
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-500" /> Joined {formatDate(account.created_at)}</span>
                {account.last_login_at && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-500" /> Last login {formatDate(account.last_login_at)}</span>}
                {account.timezone && <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-neutral-500" /> {account.timezone}</span>}
                {account.date_of_birth && <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-500" /> DOB: {formatDate(account.date_of_birth)}</span>}
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-neutral-500 font-mono">
                <span>ID: {account.id}</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">{tokens.balance || 0}</div>
                <div className="text-xs text-neutral-400">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-400">{storage.total_gb || 0}GB</div>
                <div className="text-xs text-neutral-400">Storage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-400">{visions.length}</div>
                <div className="text-xs text-neutral-400">Visions</div>
              </div>
            </div>
          </div>

          {/* View as User button */}
          <div className="mt-4 pt-4 border-t border-neutral-700/50 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-secondary-400 border-secondary-500/50 hover:bg-secondary-500/10"
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/impersonate-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: account.id }),
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    alert(`Failed: ${data.error || 'Unknown error'}`)
                    return
                  }
                  localStorage.setItem('vf-impersonation', JSON.stringify({
                    returnToken: data.returnToken,
                    targetName: data.targetName,
                    targetEmail: data.targetEmail,
                    adminName: data.adminName,
                    startedAt: new Date().toISOString(),
                  }))
                  window.location.href = `/auth/impersonate-verify?token_hash=${encodeURIComponent(data.tokenHash)}`
                } catch (err: any) {
                  alert(`Error: ${err.message || 'Network error'}`)
                }
              }}
            >
              <Eye className="w-4 h-4 mr-2" /> View as User
            </Button>
          </div>
        </Card>

        {/* Intensive Progress */}
        <Section title="Activation Intensive" icon={Zap} count={intensive.checklists?.length || 0}>
          {intensive.checklists?.length > 0 ? (
            <div className="space-y-6">
              {intensive.checklists.map((cl: any, i: number) => (
                <div key={cl.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={cl.status === 'completed' ? 'success' : cl.status === 'in_progress' ? 'warning' : 'neutral'}>
                      {cl.status}
                    </Badge>
                    <span className="text-sm text-neutral-400">
                      Started {formatDate(cl.started_at || cl.created_at)}
                      {cl.completed_at && ` — Completed ${formatDate(cl.completed_at)}`}
                    </span>
                    {i > 0 && <span className="text-xs text-neutral-600">Enrollment #{intensive.checklists.length - i}</span>}
                  </div>
                  <IntensiveChecklist checklist={cl} />
                  {cl.call_scheduled_time && (
                    <div className="text-sm text-secondary-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Call scheduled: {formatDateTime(cl.call_scheduled_time)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No intensive enrollments</p>
          )}
        </Section>

        {/* Profile / Demographics */}
        <Section title="Profile & Demographics" icon={User} defaultOpen={!!profile}>
          {profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Personal</h3>
                  <DataRow label="Gender" value={profile.gender} />
                  <DataRow label="Ethnicity" value={profile.ethnicity} />
                  <DataRow label="Relationship" value={profile.relationship_status} />
                  {profile.partner_name && <DataRow label="Partner Name" value={profile.partner_name} />}
                  <DataRow label="Has Children" value={profile.has_children ? 'Yes' : profile.has_children === false ? 'No' : null} />
                  {profile.children?.length > 0 && (
                    <DataRow label="Children" value={profile.children.map((c: any) => `${c.name || 'Child'} (${c.age || '?'})`).join(', ')} />
                  )}
                  <DataRow label="Education" value={profile.education} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Location</h3>
                  <DataRow label="City" value={profile.city} />
                  <DataRow label="State" value={profile.state} />
                  <DataRow label="Country" value={profile.country} />
                  <DataRow label="Postal Code" value={profile.postal_code} />
                  <DataRow label="Living Situation" value={profile.living_situation} />
                  <DataRow label="Time at Location" value={profile.time_at_location} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Health & Lifestyle</h3>
                  <DataRow label="Height" value={profile.height ? `${profile.height} ${profile.units || ''}` : null} />
                  <DataRow label="Weight" value={profile.weight ? `${profile.weight} ${profile.units || ''}` : null} />
                  <DataRow label="Exercise Frequency" value={profile.exercise_frequency} />
                  <DataRow label="Lifestyle Category" value={profile.lifestyle_category} />
                  <DataRow label="Hobbies" value={profile.hobbies?.join(', ')} />
                  <DataRow label="Leisure Time/Week" value={profile.leisure_time_weekly} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Work & Finance</h3>
                  <DataRow label="Employment" value={profile.employment_type} />
                  <DataRow label="Occupation" value={profile.occupation} />
                  <DataRow label="Company" value={profile.company} />
                  <DataRow label="Time in Role" value={profile.time_in_role} />
                  <DataRow label="Household Income" value={profile.household_income} />
                  <DataRow label="Savings/Retirement" value={profile.savings_retirement} />
                  <DataRow label="Consumer Debt" value={profile.consumer_debt} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Travel & Social</h3>
                  <DataRow label="Travel Frequency" value={profile.travel_frequency} />
                  <DataRow label="Passport" value={profile.passport ? 'Yes' : profile.passport === false ? 'No' : null} />
                  <DataRow label="Countries Visited" value={profile.countries_visited} />
                  <DataRow label="Close Friends" value={profile.close_friends_count} />
                  <DataRow label="Social Preference" value={profile.social_preference} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Spiritual & Growth</h3>
                  <DataRow label="Spiritual Practice" value={profile.spiritual_practice} />
                  <DataRow label="Meditation" value={profile.meditation_frequency} />
                  <DataRow label="Personal Growth Focus" value={profile.personal_growth_focus ? 'Yes' : null} />
                  <DataRow label="Volunteer Status" value={profile.volunteer_status} />
                  <DataRow label="Charitable Giving" value={profile.charitable_giving} />
                  <DataRow label="Legacy Mindset" value={profile.legacy_mindset ? 'Yes' : null} />
                </div>
              </div>

              {/* Current State ratings */}
              {(profile.state_fun || profile.state_health || profile.state_work) && (
                <div>
                  <h3 className="text-sm font-semibold text-primary-400 mb-2">Current State Ratings</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality'].map(cat => {
                      const val = profile[`state_${cat}`]
                      if (!val) return null
                      return (
                        <div key={cat} className="bg-neutral-800 rounded-lg px-3 py-2 text-center">
                          <div className="text-xs text-neutral-400 capitalize">{cat}</div>
                          <div className="text-sm font-semibold text-white">{val}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No profile data</p>
          )}
        </Section>

        {/* Life Visions */}
        <Section title="Life Visions" icon={Target} count={visions.length}>
          {visions.length > 0 ? (
            <div className="space-y-6">
              {visions.map((v: any) => (
                <VisionDetail key={v.id} vision={v} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No visions created</p>
          )}
        </Section>

        {/* Vision Board */}
        <Section title="Vision Board" icon={LayoutGrid} count={visionBoard?.length || 0} defaultOpen={(visionBoard?.length || 0) > 0}>
          {visionBoard?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visionBoard.map((item: any) => (
                <div key={item.id} className={`rounded-xl border overflow-hidden ${
                  item.status === 'actualized'
                    ? 'border-primary-500/40 bg-primary-500/5'
                    : 'border-neutral-700 bg-neutral-800'
                }`}>
                  {item.image_url && (
                    <div className="aspect-video relative bg-neutral-900">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{item.name}</span>
                      <Badge
                        variant={item.status === 'actualized' ? 'success' : item.status === 'active' ? 'neutral' : 'warning'}
                        className="text-xs flex-shrink-0"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-neutral-400 text-xs line-clamp-2 mb-2">{item.description}</p>
                    )}
                    {item.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.categories.map((cat: string) => (
                          <span key={cat} className="text-xs bg-neutral-700 text-neutral-300 rounded px-1.5 py-0.5 capitalize">{cat}</span>
                        ))}
                      </div>
                    )}
                    {item.status === 'actualized' && (
                      <div className="mt-2 pt-2 border-t border-neutral-700/50">
                        {item.actualization_story && (
                          <p className="text-xs text-primary-300 italic">{item.actualization_story}</p>
                        )}
                        {item.actualized_at && (
                          <span className="text-xs text-neutral-500">Actualized {formatDate(item.actualized_at)}</span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-neutral-600 mt-1">{formatDate(item.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No vision board items</p>
          )}
        </Section>

        {/* Voice Profile */}
        <Section title="Voice Profile" icon={Mic} defaultOpen={!!voiceProfile}>
          {voiceProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <DataRow label="Style Label" value={voiceProfile.style_label} />
                <DataRow label="Word Flow" value={voiceProfile.word_flow} />
                <DataRow label="Emotional Range" value={voiceProfile.emotional_range} />
                <DataRow label="Detail Level" value={voiceProfile.detail_level} />
                <DataRow label="Energy/Tempo" value={voiceProfile.energy_tempo} />
              </div>
              <div>
                <DataRow label="Woo Level" value={`${voiceProfile.woo_level}/3`} />
                <DataRow label="Humor/Personality" value={voiceProfile.humor_personality} />
                <DataRow label="Speech Rhythm" value={voiceProfile.speech_rhythm} />
                <DataRow label="Forbidden Words" value={voiceProfile.forbidden_words?.join(', ')} />
                <DataRow label="Source" value={voiceProfile.source} />
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No voice profile</p>
          )}
        </Section>

        {/* Activity Metrics */}
        <Section title="Activity Metrics" icon={BarChart3} defaultOpen={!!activityMetrics}>
          {activityMetrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { label: 'Profile Completion', value: `${activityMetrics.profile_completion_percent || 0}%` },
                { label: 'Visions Created', value: activityMetrics.vision_count || 0 },
                { label: 'Vision Refinements', value: activityMetrics.vision_refinement_count || 0 },
                { label: 'Audio Generated', value: activityMetrics.audio_generated_count || 0 },
                { label: 'Journal Entries', value: activityMetrics.journal_entry_count || 0 },
                { label: 'Vision Board Images', value: activityMetrics.vision_board_image_count || 0 },
                { label: 'Total Logins', value: activityMetrics.total_logins || 0 },
                { label: 'Days Since Login', value: activityMetrics.days_since_last_login ?? 'N/A' },
                { label: 'S3 Files', value: activityMetrics.s3_file_count || 0 },
                { label: 'Storage Used', value: `${activityMetrics.total_storage_mb || 0} MB` },
                { label: 'Tokens Used', value: activityMetrics.tokens_used || 0 },
                { label: 'Engagement Status', value: activityMetrics.engagement_status || 'N/A' },
              ].map(item => (
                <div key={item.label} className="bg-neutral-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="text-xs text-neutral-400">{item.label}</div>
                </div>
              ))}
              {activityMetrics.admin_notes && (
                <div className="col-span-full bg-accent-500/10 border border-accent-500/30 rounded-lg p-3">
                  <div className="text-xs text-accent-400 font-semibold mb-1">Admin Notes</div>
                  <div className="text-sm text-white">{activityMetrics.admin_notes}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No activity metrics</p>
          )}
        </Section>

        {/* Assessments */}
        <Section title="Vibrational Assessment" icon={BarChart3} count={assessments.length} defaultOpen={assessments.length > 0}>
          {assessments.length > 0 ? (
            <div className="space-y-6">
              {assessments.map((a: any, idx: number) => (
                <AssessmentDetail key={a.id} assessment={a} isLatest={idx === 0} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No assessments completed</p>
          )}
        </Section>

        {/* Orders & Purchases */}
        <Section title="Orders & Purchases" icon={CreditCard} count={orders.length} defaultOpen={false}>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={o.status === 'paid' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}>
                        {o.status}
                      </Badge>
                      <span className="text-white text-sm font-medium">{formatCurrency(o.total_amount)}</span>
                    </div>
                    {o.promo_code && <span className="text-xs text-neutral-500">Promo: {o.promo_code}</span>}
                    {o.referral_source && <span className="text-xs text-neutral-500 ml-2">Ref: {o.referral_source}</span>}
                  </div>
                  <span className="text-xs text-neutral-500">{formatDate(o.paid_at || o.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No orders</p>
          )}
        </Section>

        {/* Token Transactions */}
        <Section title="Token History (Recent 20)" icon={Zap} count={tokens.recentTransactions?.length} defaultOpen={false}>
          {tokens.recentTransactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-neutral-400 border-b border-neutral-700">
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-right py-2 pr-4">Amount</th>
                    <th className="text-right py-2 pr-4">Balance After</th>
                    <th className="text-left py-2 pr-4">Notes</th>
                    <th className="text-right py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-neutral-800">
                      <td className="py-2 pr-4 text-white">{tx.action_type}</td>
                      <td className={`py-2 pr-4 text-right font-mono ${tx.tokens_used > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.tokens_used > 0 ? '+' : ''}{tx.tokens_used}
                      </td>
                      <td className="py-2 pr-4 text-right text-neutral-400 font-mono">{tx.tokens_remaining}</td>
                      <td className="py-2 pr-4 text-neutral-500 max-w-[200px] truncate">{tx.notes || tx.token_pack_id || ''}</td>
                      <td className="py-2 text-right text-neutral-500">{formatDate(tx.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No token transactions</p>
          )}
        </Section>

        {/* Video Sessions / Coaching */}
        <Section title="Video Sessions" icon={Video} count={videoSessions.length} defaultOpen={false}>
          {videoSessions.length > 0 ? (
            <div className="space-y-3">
              {videoSessions.map((vp: any) => {
                const session = vp.video_sessions
                if (!session) return null
                return (
                  <div key={vp.id} className="p-3 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{session.title}</span>
                      <Badge variant={session.status === 'completed' ? 'success' : session.status === 'live' ? 'warning' : 'neutral'}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-400 space-x-3">
                      <span>{session.session_type}</span>
                      <span>{formatDateTime(session.scheduled_at)}</span>
                      {vp.attended && <span className="text-green-400">Attended</span>}
                      {vp.duration_seconds && <span>{Math.round(vp.duration_seconds / 60)}min</span>}
                    </div>
                    {session.session_summary && (
                      <p className="text-sm text-neutral-300 mt-2 bg-neutral-700/50 rounded p-2">{session.session_summary}</p>
                    )}
                    {session.host_notes && (
                      <p className="text-sm text-neutral-400 mt-1 italic">Notes: {session.host_notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No video sessions</p>
          )}
        </Section>

        {/* Bookings */}
        {bookings.length > 0 && (
          <Section title="Bookings" icon={Calendar} count={bookings.length} defaultOpen={false}>
            <div className="space-y-3">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div>
                    <span className="text-white text-sm font-medium">{b.event_type || b.booking_type || 'Booking'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'neutral' : 'warning'}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">{formatDateTime(b.scheduled_at || b.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* VIVA Conversations */}
        <Section title="VIVA Conversations" icon={MessageSquare} count={conversations.length} defaultOpen={false}>
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div>
                    <span className="text-white text-sm">{c.title || 'Untitled'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.mode && <Badge variant="neutral" className="text-xs">{c.mode}</Badge>}
                      {c.category && <Badge variant="info" className="text-xs">{c.category}</Badge>}
                      <span className="text-xs text-neutral-500">{c.message_count || 0} messages</span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">{formatDate(c.last_message_at || c.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No conversations</p>
          )}
        </Section>

        {/* Journal Entries */}
        <Section title="Journal Entries" icon={BookOpen} count={journalEntries.length} defaultOpen={journalEntries.length > 0}>
          {journalEntries.length > 0 ? (
            <div className="space-y-4">
              {journalEntries.map((j: any) => (
                <JournalEntryDetail key={j.id} entry={j} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No journal entries</p>
          )}
        </Section>

        {/* Sequence Enrollments */}
        {sequenceEnrollments.length > 0 && (
          <Section title="Sequence Enrollments" icon={Send} count={sequenceEnrollments.length} defaultOpen={false}>
            <div className="space-y-3">
              {sequenceEnrollments.map((se: any) => (
                <div key={se.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div>
                    <span className="text-white text-sm font-medium">{se.sequences?.name || 'Unknown Sequence'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={se.status === 'active' ? 'success' : se.status === 'completed' ? 'neutral' : 'warning'}>
                        {se.status}
                      </Badge>
                      <span className="text-xs text-neutral-500">Step {se.current_step_order}</span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">{formatDate(se.enrolled_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Community */}
        <Section title="Community Activity" icon={Heart} defaultOpen={false}>
          <div className="space-y-4">
            {communityStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Posts', value: communityStats.total_posts || 0 },
                  { label: 'Comments', value: communityStats.total_comments || 0 },
                  { label: 'Hearts Given', value: communityStats.hearts_given || 0 },
                  { label: 'Hearts Received', value: communityStats.hearts_received || 0 },
                  { label: 'Current Streak', value: `${communityStats.streak_days || 0} days` },
                  { label: 'Longest Streak', value: `${communityStats.longest_streak || 0} days` },
                ].map(item => (
                  <div key={item.label} className="bg-neutral-800 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{item.value}</div>
                    <div className="text-xs text-neutral-400">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
            {communityPosts?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 mb-2">Recent Posts</h3>
                <div className="space-y-2">
                  {communityPosts.map((p: any) => (
                    <div key={p.id} className="p-3 bg-neutral-800 rounded-lg">
                      <p className="text-sm text-white line-clamp-2">{p.content}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                        {p.media_type && <span>{p.media_type}</span>}
                        <span>{p.hearts_count || 0} hearts</span>
                        <span>{p.comments_count || 0} comments</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Badges */}
        {badges.length > 0 && (
          <Section title="Badges & Achievements" icon={Award} count={badges.length} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {badges.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 bg-accent-500/10 border border-accent-500/30 rounded-full px-3 py-1.5">
                  <Award className="w-4 h-4 text-accent-400" />
                  <span className="text-sm text-white">{b.badge_type}</span>
                  <span className="text-xs text-neutral-500">{formatDate(b.earned_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

      </Stack>
    </Container>
  )
}

export default function UserDetailPage() {
  return (
    <AdminWrapper>
      <UserDetailContent />
    </AdminWrapper>
  )
}
