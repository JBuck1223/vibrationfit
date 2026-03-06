'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, Button, Badge, ProgressBar, Container, Stack, PageHero, AIButton, TrackingMilestoneCard, VersionBadge, StatusBadge } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system'
import Link from 'next/link'
import AITokenUsage from '@/components/AITokenUsage'
import HouseholdTokenBalance from '@/components/HouseholdTokenBalance'
import AssessmentBarChart from '@/app/assessment/components/AssessmentBarChart'
import { RetentionDashboard } from '@/components/retention'
import { UnlockCelebrationModal } from '@/components/UnlockCelebrationModal'
import { GraduateChecklistCard } from '@/components/GraduateChecklistCard'
import type { GraduateChecklistResult } from '@/lib/graduate-checklist'
import { 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  Zap, 
  Users, 
  Heart, 
  DollarSign, 
  Briefcase, 
  Home, 
  Plane, 
  PartyPopper, 
  CheckCircle,
  ArrowRight,
  Plus,
  BarChart3,
  Activity,
  Crown,
  LogOut,
  Brain,
  Image,
  AlertCircle,
  Eye,
  FileText,
  Rocket,
  Settings,
  CreditCard,
  Trophy,
  User,
  CalendarDays,
  HardDrive,
  Video,
  UsersRound,
  Award,
  Apple,
  Calendar,
} from 'lucide-react'

interface DashboardContentProps {
  user: {
    email?: string
  }
  profileData: any
  visionData: any[]
  visionBoardData: any[]
  journalData: any[]
  assessmentData?: any[]
  profileCount: number
  audioSetsCount: number
  refinementsCount: number
  storageQuotaGB: number
  initialCalibrationCall?: { show: boolean; session?: { id: string | null; title: string; scheduled_at: string; join_link: string } } | null
  graduateChecklist?: GraduateChecklistResult | null
}

export default function DashboardContent({ user, profileData, visionData, visionBoardData, journalData, assessmentData = [], profileCount, audioSetsCount, refinementsCount, storageQuotaGB, initialCalibrationCall = null, graduateChecklist = null }: DashboardContentProps) {
  const [storageUsed, setStorageUsed] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [earnedActivationBadges, setEarnedActivationBadges] = useState<Set<string>>(new Set())
  const [activationDays, setActivationDays] = useState(0)
  const [calibrationCall, setCalibrationCall] = useState<{
    show: boolean
    session?: { id: string | null; title: string; scheduled_at: string; join_link: string }
  } | null>(initialCalibrationCall)
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check for unlock celebration param
  useEffect(() => {
    if (searchParams.get('unlocked') === 'true') {
      setShowCelebration(true)
      // Remove the param from URL without refresh
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  // Prevent hydration mismatch for date formatting
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchStorageUsage() {
      try {
        const response = await fetch('/api/storage/usage')
        if (response.ok) {
          const data = await response.json()
          setStorageUsed(data.totalSize || 0)
        }
      } catch (error) {
        console.error('Error fetching storage usage:', error)
      }
    }
    fetchStorageUsage()
  }, [])

  // Fetch MAP status + badge data in parallel
  useEffect(() => {
    async function fetchMapAndBadges() {
      try {
        const [, badgesRes] = await Promise.all([
          fetch('/api/map/status'),
          fetch('/api/badges'),
        ])
        
        if (badgesRes.ok) {
          const badgesData = await badgesRes.json()
          // Extract earned activation badges and activation day progress
          const earned = new Set<string>()
          let days = 0
          for (const badge of (badgesData.badges || [])) {
            if (badge.earned && badge.definition?.type?.startsWith('activated_')) {
              earned.add(badge.definition.type)
            }
            // Get the activation days progress from any activation day badge
            if (badge.definition?.activationDays && badge.progress) {
              days = Math.max(days, badge.progress.current)
            }
          }
          setEarnedActivationBadges(earned)
          setActivationDays(days)
        }
      } catch (error) {
        console.error('Error fetching MAP/badge status:', error)
      }
    }
    fetchMapAndBadges()
  }, [])

  // Countdown to calibration call (updates every minute)
  useEffect(() => {
    if (!calibrationCall?.session?.scheduled_at) {
      setCountdown(null)
      return
    }
    const scheduled = new Date(calibrationCall.session.scheduled_at).getTime()
    const update = () => {
      const now = Date.now()
      const diff = Math.max(0, scheduled - now)
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 })
        return
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      setCountdown({ days, hours, minutes })
    }
    update()
    const interval = setInterval(update, 60 * 1000)
    return () => clearInterval(interval)
  }, [calibrationCall?.session?.scheduled_at])
  // Calculate completion percentage manually (same logic as profile API)
  const calculateCompletionManually = (profileData: any): number => {
    if (!profileData) return 0

    let totalFields = 0
    let completedFields = 0

    // Helper to check if a field has value
    const hasValue = (field: string) => {
      const value = profileData[field]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'boolean') return true
      return value !== null && value !== undefined && value !== ''
    }

    // Core Fields (always required)
    const coreFields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
      'relationship_status', 'partner_name', 'number_of_children', 'children_ages',
      'units', 'height', 'weight', 'exercise_frequency', 'living_situation',
      'time_at_location', 'city', 'state', 'postal_code', 'country',
      'employment_type', 'occupation', 'company', 'time_in_role', 'education', 'household_income',
      'profile_picture_url']

    coreFields.forEach(field => {
      totalFields++
      if (hasValue(field)) {
        completedFields++
      }
    })

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
  }

  const completionPercentage = calculateCompletionManually(profileData)

  // Safe date formatting that prevents hydration mismatch
  const formatDate = (dateString: string) => {
    if (!mounted) return '' // Return empty string during SSR
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }

  // Create recent activity data
  const recentActivity = [
    ...visionData.map(vision => ({
      title: 'Vision Updated',
      description: `Life vision updated`,
      date: vision.updated_at,
      icon: Target
    })),
    ...visionBoardData.map(item => ({
      title: item.status === 'actualized' ? 'Vision Actualized' : 'Vision Board Item Created',
      description: item.name || 'Untitled item',
      date: item.updated_at || item.created_at,
      icon: Image
    })),
    ...journalData.map(entry => ({
      title: 'Journal Entry Created',
      description: entry.title || 'Untitled entry',
      date: entry.created_at,
      icon: BookOpen
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4)

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      career: Briefcase,
      relationships: Heart,
      health: Activity,
      finance: DollarSign,
      personal_growth: TrendingUp,
      family: Users,
      travel: Plane,
      hobbies: PartyPopper,
      home: Home,
      spirituality: Star
    }
    return iconMap[category] || Target
  }

  // Get latest assessment
  const latestAssessment = assessmentData?.find(a => a.status === 'completed') || assessmentData?.[0]

  // Profile completion call-to-action
  const profileCompletePercentage = completionPercentage

  // Build and download ICS for Apple Calendar (Calibration Call) - opens iPhone calendar when opened on iOS
  const handleAddToAppleCalendar = () => {
    if (!calibrationCall?.session?.scheduled_at) return
    const start = new Date(calibrationCall.session.scheduled_at)
    const end = new Date(start.getTime() + 45 * 60 * 1000)
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const title = calibrationCall.session.title || 'Calibration Call'
    const desc = `Your 1-on-1 vision calibration session. Join: ${calibrationCall.session.join_link}`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VibrationFit//Calibration Call//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
      `DESCRIPTION:${desc.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')}`,
      calibrationCall.session.join_link ? `URL:${calibrationCall.session.join_link}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Calibration-Call.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Google Calendar add-event URL (opens Gmail/Google Calendar)
  const calibrationCallGoogleCalendarUrl = calibrationCall?.session?.scheduled_at
    ? (() => {
        const start = new Date(calibrationCall.session.scheduled_at)
        const end = new Date(start.getTime() + 45 * 60 * 1000)
        const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
        const title = encodeURIComponent(calibrationCall.session.title || 'Calibration Call')
        const details = encodeURIComponent(`Your 1-on-1 vision calibration session. Join: ${calibrationCall.session.join_link}`)
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&details=${details}`
      })()
    : null

  return (
    <>
      {/* Unlock Celebration Modal */}
      <UnlockCelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />

      <Container size="xl">
        <Stack gap="lg">
          {/* PageHero */}
          <PageHero
            title="Dashboard"
            subtitle="Run your MAP and stay connected."
          />

        {/* Getting Started as a Graduate checklist (only for users who completed the intensive) */}
        {graduateChecklist?.isGraduate && graduateChecklist.progress && (
          <GraduateChecklistCard progress={graduateChecklist.progress} />
        )}

        {/* Calibration Call booking card (post-intensive; hides once call is completed) */}
        {calibrationCall?.show && calibrationCall?.session && (
          <Card className="relative overflow-hidden p-0 border-2 border-[#00FFFF]/40">
            <div className="absolute inset-0 opacity-5 bg-[#00FFFF]" />
            <div className="relative z-10 p-4 md:p-6 lg:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start gap-0">
                  <h2 className="text-xl font-bold text-white mb-1">Calibration Call</h2>
                  <p className="text-neutral-400 text-sm mb-2">Your 1-on-1 vision calibration session</p>
                  {calibrationCall.session.scheduled_at && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-neutral-300 mb-3">
                      <span className="flex items-center gap-1.5 justify-center">
                        <CalendarDays className="w-4 h-4 text-[#00FFFF]" />
                        {formatDate(calibrationCall.session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1.5 justify-center">
                        <Clock className="w-4 h-4 text-[#00FFFF]" />
                        {mounted && new Date(calibrationCall.session.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {countdown !== null && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
                    <div className="flex flex-wrap gap-3 text-sm justify-center md:justify-start">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] font-mono">
                        <span className="font-bold">{countdown.days}</span> {countdown.days === 1 ? 'Day' : 'Days'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] font-mono">
                        <span className="font-bold">{countdown.hours}</span> {countdown.hours === 1 ? 'Hour' : 'Hours'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] font-mono">
                        <span className="font-bold">{countdown.minutes}</span> {countdown.minutes === 1 ? 'Minute' : 'Minutes'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="flex flex-col gap-2 items-center md:items-end">
                    <Button variant="primary" asChild className="w-full sm:w-auto whitespace-nowrap">
                      <Link href={calibrationCall.session.join_link} className="flex items-center justify-center gap-2">
                        <Video className="w-5 h-5" />
                        {calibrationCall.session.id ? 'Join Call' : 'View Details'}
                      </Link>
                    </Button>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 gap-y-1 text-sm">
                      <button
                        type="button"
                        onClick={handleAddToAppleCalendar}
                        className="inline-flex items-center gap-1.5 text-[#00FFFF] hover:text-[#00FFFF]/80 underline underline-offset-2"
                      >
                        <Apple className="w-4 h-4 flex-shrink-0" />
                        Add to Apple Calendar
                      </button>
                      <span className="text-neutral-500 hidden md:inline">or</span>
                      {calibrationCallGoogleCalendarUrl ? (
                        <a
                          href={calibrationCallGoogleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#00FFFF] hover:text-[#00FFFF]/80 underline underline-offset-2"
                        >
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          Add to Google Calendar
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300 text-center md:text-right mt-1">You can join up to 10 minutes before the scheduled time.</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* MAP Card - My Activation Plan */}
          <Card className="relative overflow-hidden p-0">
            {/* Background map pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <pattern id="map-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[#39FF14]" />
                </pattern>
                <rect width="400" height="200" fill="url(#map-grid)" />
                
                {/* Curved path line representing journey */}
                <path 
                  d="M 20 100 Q 100 50 150 100 T 280 100 Q 340 80 380 100" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-[#39FF14]"
                  strokeDasharray="8 4"
                />
                
                {/* Location markers along the path */}
                <circle cx="20" cy="100" r="4" fill="currentColor" className="text-[#39FF14]" />
                <circle cx="150" cy="100" r="4" fill="currentColor" className="text-[#00FFFF]" />
                <circle cx="280" cy="100" r="4" fill="currentColor" className="text-[#BF00FF]" />
                <circle cx="380" cy="100" r="6" fill="currentColor" className="text-[#39FF14]" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Text content */}
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    <span className="text-[#39FF14] font-mono tracking-wider">MAP</span>
                    <span className="text-neutral-400 mx-2 hidden md:inline">·</span>
                    <span className="block md:inline">My Activation Plan</span>
                  </h2>
                  <p className="text-neutral-300 text-sm">Your daily rhythm for living The Life I Choose.</p>
                </div>

                {/* Action Button with Compass Icon */}
                <Button variant="primary" asChild className="w-full md:w-auto whitespace-nowrap">
                  <Link href="/map" className="flex items-center gap-2">
                    <svg 
                      className="w-5 h-5" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
                    </svg>
                    View My MAP
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

        {/* Activation Badges Strip */}
          <Card className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Activation Badges</h3>
              <p className="text-xs text-neutral-500">
                {activationDays > 0
                  ? `${activationDays} activation ${activationDays === 1 ? 'day' : 'days'} logged`
                  : 'Earn badges by logging activations on different days'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-5 mb-5">
              {[
                { day: 3, type: 'activated_3d' },
                { day: 7, type: 'activated_7d' },
                { day: 14, type: 'activated_14d' },
                { day: 21, type: 'activated_21d' },
                { day: 28, type: 'activated_28d' },
              ].map(({ day, type }) => {
                const earned = earnedActivationBadges.has(type)
                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      earned 
                        ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' 
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-600'
                    }`}>
                      <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className={`text-xs font-medium ${earned ? 'text-[#39FF14]' : 'text-neutral-600'}`}>
                      {day}-Day
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="text-center">
              <Button variant="outline" size="sm" asChild>
                <Link href="/snapshot/me" className="inline-flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  View All Badges
                </Link>
              </Button>
            </div>
          </Card>

        {/* What's New Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alignment Gym - Next Session */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-[#BF00FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">Alignment Gym</h3>
                <p className="text-sm text-neutral-400">Weekly live group coaching</p>
              </div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-neutral-300 mb-2">Next session coming soon</p>
              <p className="text-xs text-neutral-500">Check back for upcoming schedule</p>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/alignment-gym">View Schedule</Link>
            </Button>
          </Card>

          {/* Vibe Tribe - Latest Activity */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <UsersRound className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">Vibe Tribe</h3>
                <p className="text-sm text-neutral-400">Community connection</p>
              </div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-neutral-300 mb-2">Connect with the community</p>
              <p className="text-xs text-neutral-500">Share your journey and support others</p>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/vibe-tribe">Visit Vibe Tribe</Link>
            </Button>
          </Card>
        </div>

        {/* Quick Stats - Link to Tracking */}
        <Card className="p-6 bg-gradient-to-r from-[#39FF14]/10 to-[#00FFFF]/10 border-[#39FF14]/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Your Progress</h3>
              <p className="text-sm text-neutral-300">
                View detailed analytics, streaks, and performance metrics.
              </p>
            </div>
            <Button variant="primary" asChild>
              <Link href="/tracking" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                View Tracking
              </Link>
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
    </>
  )
}