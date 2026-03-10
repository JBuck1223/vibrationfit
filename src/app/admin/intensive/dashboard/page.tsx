'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Stack, PageHero, ProgressBar } from '@/lib/design-system/components'
import {
  Users, CheckCircle, Clock, Pause, ArrowRight,
  Settings, FileText, User, ClipboardCheck, Sparkles, Wand2,
  Music, Mic, Sliders, ImageIcon, BookOpen, Calendar, Rocket, Unlock,
} from 'lucide-react'
import { toast } from 'sonner'

interface Enrollment {
  id: string
  user_id: string
  intensive_id: string
  email: string | null
  full_name: string | null
  status: string
  current_step_number: number
  current_step_name: string
  completed_steps: number
  total_steps: number
  progress_pct: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface StepBreakdown {
  step: number
  name: string
  count: number
}

interface Totals {
  enrolled: number
  pending: number
  in_progress: number
  completed: number
}

const STEP_ICONS = [
  Rocket,         // 0 - Not Started
  Settings,       // 1 - Settings
  FileText,       // 2 - Intake
  User,           // 3 - Profile
  ClipboardCheck, // 4 - Assessment
  Sparkles,       // 5 - Build Vision
  Wand2,          // 6 - Refine Vision
  Music,          // 7 - Generate Audio
  Mic,            // 8 - Record Voice
  Sliders,        // 9 - Audio Mix
  ImageIcon,      // 10 - Vision Board
  BookOpen,       // 11 - Journal
  Calendar,       // 12 - Book Call
  Rocket,         // 13 - Activation Plan
  Unlock,         // 14 - Unlock
  CheckCircle,    // 15 - Completed
]

const PHASE_COLORS: Record<string, string> = {
  'Not Started': 'bg-[#555] text-white',
  'Setup': 'bg-blue-600 text-white',
  'Foundation': 'bg-cyan-600 text-white',
  'Vision Creation': 'bg-accent-500 text-white',
  'Audio': 'bg-pink-600 text-white',
  'Activation': 'bg-[#FFB701] text-black',
  'Completion': 'bg-primary-500 text-black',
  'Completed': 'bg-primary-500 text-black',
}

function getPhaseForStep(step: number): string {
  if (step === 0) return 'Not Started'
  if (step <= 2) return 'Setup'
  if (step <= 4) return 'Foundation'
  if (step <= 6) return 'Vision Creation'
  if (step <= 9) return 'Audio'
  if (step <= 12) return 'Activation'
  if (step <= 14) return 'Completion'
  return 'Completed'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-primary-500 text-black'
    case 'in_progress': return 'bg-secondary-500 text-black'
    case 'pending': return 'bg-[#555] text-white'
    default: return 'bg-[#555] text-white'
  }
}

export default function IntensiveDashboardPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [stepBreakdown, setStepBreakdown] = useState<StepBreakdown[]>([])
  const [totals, setTotals] = useState<Totals>({ enrolled: 0, pending: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('all')
  const [stepFilter, setStepFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (stepFilter !== 'all') params.append('step', stepFilter)

      const response = await fetch(`/api/admin/intensive/dashboard?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch intensive data')

      const data = await response.json()
      setEnrollments(data.enrollments)
      setStepBreakdown(data.stepBreakdown)
      setTotals(data.totals)
    } catch (error) {
      console.error('Error fetching intensive dashboard:', error)
      toast.error('Failed to load intensive data')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, stepFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatRelative(dateStr: string | null) {
    if (!dateStr) return '-'
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  const maxBarCount = Math.max(...stepBreakdown.map(s => s.count), 1)

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Intensive Dashboard"
          subtitle="Enrollment status and step progress for the Activation Intensive"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/intensive/tester')}
          >
            <Rocket className="w-4 h-4 mr-1" />
            Tester
          </Button>
        </PageHero>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{totals.enrolled}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Enrolled
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#555]">{totals.pending}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <Pause className="w-3 h-3" /> Pending
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-secondary-500">{totals.in_progress}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> In Progress
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary-500">{totals.completed}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </div>
          </Card>
        </div>

        {/* Step breakdown chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Users by Current Step</h3>
          <div className="space-y-2">
            {stepBreakdown.map((item) => {
              const phase = getPhaseForStep(item.step)
              const barWidth = maxBarCount > 0 ? (item.count / maxBarCount) * 100 : 0
              const isActive = stepFilter === String(item.step)

              return (
                <button
                  key={item.step}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                    isActive ? 'bg-[#1F1F1F] ring-1 ring-primary-500' : 'hover:bg-[#1A1A1A]'
                  }`}
                  onClick={() => setStepFilter(isActive ? 'all' : String(item.step))}
                >
                  <span className="text-xs text-neutral-500 w-5 text-right flex-shrink-0">
                    {item.step === 0 ? '-' : item.step === 15 ? '' : item.step}
                  </span>
                  <span className="text-xs text-neutral-300 w-28 truncate flex-shrink-0">{item.name}</span>
                  <div className="flex-1 h-5 bg-[#1A1A1A] rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${PHASE_COLORS[phase]?.split(' ')[0] || 'bg-[#555]'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right flex-shrink-0">
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-neutral-500 mr-1">Status:</span>
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}

          {stepFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStepFilter('all')}
              className="ml-2"
            >
              Clear Step Filter
            </Button>
          )}
        </div>

        {/* Enrollments table */}
        {enrollments.length === 0 ? (
          <Card className="text-center p-8 md:p-12">
            <p className="text-sm md:text-base text-neutral-400">No enrollments found</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">User</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Current Step</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Progress</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Started</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const phase = getPhaseForStep(enrollment.current_step_number)
                    const Icon = STEP_ICONS[enrollment.current_step_number] || Rocket

                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/crm/members/${enrollment.user_id}`)}
                      >
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="font-medium text-xs md:text-sm text-white truncate max-w-[180px]">
                            {enrollment.full_name || 'Unnamed'}
                          </div>
                          <div className="text-xs text-neutral-500 truncate max-w-[180px]">
                            {enrollment.email || enrollment.user_id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <Badge className={`${getStatusColor(enrollment.status)} px-2 py-1 text-xs`}>
                            {enrollment.status === 'in_progress' ? 'Active' : enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${PHASE_COLORS[phase]?.split(' ')[0] || 'bg-[#555]'}`}>
                              <Icon className="w-3.5 h-3.5 text-black" />
                            </div>
                            <div>
                              <div className="text-xs md:text-sm text-white">
                                {enrollment.current_step_number === 0
                                  ? 'Not Started'
                                  : enrollment.current_step_number === 15
                                    ? 'All Complete'
                                    : `Step ${enrollment.current_step_number}`
                                }
                              </div>
                              <div className="text-xs text-neutral-500">{enrollment.current_step_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-20">
                              <ProgressBar value={enrollment.progress_pct} variant="primary" className="h-2" />
                            </div>
                            <span className="text-xs text-neutral-400">{enrollment.progress_pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs hidden md:table-cell">
                          {formatDate(enrollment.started_at || enrollment.created_at)}
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs hidden lg:table-cell">
                          {formatRelative(enrollment.updated_at)}
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
