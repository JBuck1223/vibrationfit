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
  Calendar,
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
  HardDrive
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
}

export default function TrackingContent({ user, profileData, visionData, visionBoardData, journalData, assessmentData = [], profileCount, audioSetsCount, refinementsCount, storageQuotaGB }: DashboardContentProps) {
  const [storageUsed, setStorageUsed] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  
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
            title="Tracking"
            subtitle="Review your progress, streaks, and performance across time."
          />

          {/* Tools Callout - Daily Paper & Abundance Tracker */}
          <Card className="p-6 bg-gradient-to-r from-[#39FF14]/10 to-[#00FFFF]/10 border-[#39FF14]/30">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Practice Tools</h3>
                <p className="text-sm text-neutral-300">
                  Track your daily activations and abundance with these practice tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/daily-paper" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Daily Paper
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/abundance-tracker" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Abundance Tracker
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Retention Metrics - The 4 Core Tiles */}
          <RetentionDashboard />

          {/* How it works link */}
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-1">Want the full breakdown?</p>
            <Link
              href="/tracking/how-it-works"
              className="text-xs text-neutral-400 hover:text-primary-400 transition-colors underline underline-offset-2"
            >
              How Vibration Fit tracks your Creations, Activations, Connections and Sessions
            </Link>
          </div>

        {/* Detailed Data Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Details */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-lg font-bold text-white">Profile</h3>
                  {profileData?.updated_at && mounted && (
                    <p className="text-xs text-neutral-400">
                      Last Updated: {formatDate(profileData.updated_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-center">
                <Button variant="ghost" size="sm" asChild className="w-full md:w-auto">
                  <Link href="/profile/active">View</Link>
                </Button>
              </div>
            </div>
            
            {profileData ? (
              <div className="space-y-4">
                {/* Tracking Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <TrackingMilestoneCard
                    label="Profiles"
                    value={profileCount}
                    theme="primary"
                    className="!p-3 md:!p-4"
                  />
                  <TrackingMilestoneCard
                    label="Completion"
                    value={`${profileCompletePercentage}%`}
                    theme="secondary"
                    className="!p-3 md:!p-4"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-center text-neutral-400">
                  <p className="text-sm">Profile not found</p>
                  <Button variant="ghost" size="sm" className="mt-2" asChild>
                    <Link href="/profile">Create Profile</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Life Vision Details */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-lg font-bold text-white">Life Vision</h3>
                  <p className="text-xs text-neutral-400">
                    Last Updated: {visionData.find(v => v.is_active)?.updated_at ? (mounted ? formatDate(visionData.find(v => v.is_active).updated_at) : '') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-center">
                <Button variant="ghost" size="sm" asChild className="w-full md:w-auto">
                  <Link href="/life-vision">View</Link>
                </Button>
              </div>
            </div>
            
            {(() => {
              const activeVision = visionData.find(v => v.is_active)
              return activeVision ? (
                <div className="space-y-4">
                  {/* Tracking Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <TrackingMilestoneCard
                      label="Versions"
                      value={visionData.length}
                      theme="primary"
                      className="!p-3 md:!p-4"
                    />
                    <TrackingMilestoneCard
                      label="Refinements"
                      value={refinementsCount}
                      theme="secondary"
                      className="!p-3 md:!p-4"
                    />
                    <TrackingMilestoneCard
                      label="Audio Tracks"
                      mobileLabel="Audios"
                      value={audioSetsCount}
                      theme="accent"
                      className="!p-3 md:!p-4"
                    />
                  </div>
                </div>
              ) : visionData.length > 0 ? (
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="text-center text-neutral-400">
                    <p className="text-sm">No active vision. Please activate a vision version.</p>
                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                      <Link href="/life-vision">View Visions</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="text-center text-neutral-400">
                    <p className="text-sm">No vision versions created yet</p>
                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                      <Link href="/life-vision/new">Create Your First Vision</Link>
                    </Button>
                  </div>
                </div>
              )
            })()}
          </Card>

          {/* Assessment Details */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-lg font-bold text-white">Assessment</h3>
                  {assessmentData.length > 0 && assessmentData[0]?.updated_at && mounted && (
                    <p className="text-xs text-neutral-400">
                      Last Updated: {formatDate(assessmentData[0].updated_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-center">
                <Button variant="ghost" size="sm" asChild className="w-full md:w-auto">
                  <Link href="/assessment">View</Link>
                </Button>
              </div>
            </div>
            
            {assessmentData.length > 0 ? (
              <div className="space-y-4">
                {/* Tracking Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <TrackingMilestoneCard
                    label="Completed"
                    value={assessmentData.filter(a => a.status === 'completed').length}
                    theme="primary"
                    className="!p-3 md:!p-4"
                  />
                  <TrackingMilestoneCard
                    label="Active Score"
                    mobileLabel="Score"
                    value={(() => {
                      const activeAssessment = assessmentData.find(a => a.status === 'completed')
                      return activeAssessment?.overall_percentage ? `${activeAssessment.overall_percentage}%` : 'N/A'
                    })()}
                    theme="secondary"
                    className="!p-3 md:!p-4"
                  />
                </div>
                
                {/* Green Line Status Chart */}
                {(() => {
                  const activeAssessment = assessmentData.find(a => a.status === 'completed')
                  return activeAssessment ? (
                    <Card className="p-4 md:p-6 lg:p-8 pb-2 md:pb-3 lg:pb-4">
                      <AssessmentBarChart assessment={activeAssessment} compact={true} />
                    </Card>
                  ) : null
                })()}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#D03739]/10 to-[#EF4444]/10 border border-[#D03739]/30 rounded-lg p-4">
                <p className="text-sm text-neutral-300">
                  Take your first vibrational assessment to discover your current alignment across 12 key life areas.
                </p>
              </div>
            )}
          </Card>

          {/* Vision Board Details */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-lg font-bold text-white">Vision Board</h3>
                  {visionBoardData.length > 0 && visionBoardData[0]?.updated_at && mounted && (
                    <p className="text-xs text-neutral-400">
                      Last Updated: {formatDate(visionBoardData[0].updated_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center w-full md:w-auto justify-center">
                <Button variant="ghost" size="sm" asChild className="flex-1 md:flex-initial">
                  <Link href="/vision-board">View</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="flex-1 md:flex-initial">
                  <Link href="/vision-board/new" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </Link>
                </Button>
              </div>
            </div>
            
            {visionBoardData.length > 0 ? (
              <div className="space-y-4">
                {/* Tracking Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <TrackingMilestoneCard
                    label="Total"
                    value={visionBoardData.length}
                    theme="primary"
                    className="!p-3 md:!p-4"
                  />
                  <TrackingMilestoneCard
                    label="In Progress"
                    value={visionBoardData.filter(item => item.status === 'active').length}
                    theme="secondary"
                    className="!p-3 md:!p-4"
                  />
                  <TrackingMilestoneCard
                    label="Actualized"
                    value={visionBoardData.filter(item => item.status === 'actualized').length}
                    theme="accent"
                    className="!p-3 md:!p-4"
                  />
                </div>
                
                {/* Recent Items */}
                <div className="space-y-2">
                  {visionBoardData.slice(0, 4).map((item) => (
                    <Link 
                      key={item.id} 
                      href={`/vision-board/${item.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#39FF14]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.name || 'Untitled Item'}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {item.status === 'actualized' ? 'Actualized' : item.status === 'active' ? 'In Progress' : 'Paused'}{mounted && ` • ${formatDate(item.created_at)}`}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Summary */}
                {visionBoardData.length > 4 && (
                  <Link href="/vision-board" className="block">
                    <p className="text-xs text-neutral-400 text-center hover:text-primary-500 transition-colors cursor-pointer">
                      +{visionBoardData.length - 4} more items
                    </p>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#D03739]/10 to-[#EF4444]/10 border border-[#D03739]/30 rounded-lg p-4">
                <p className="text-sm text-neutral-300">
                  Start adding items to your vision board to visualize and track your conscious creations.
                </p>
              </div>
            )}
          </Card>

          {/* Journal Details */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-lg font-bold text-white">Journal</h3>
                  {journalData.length > 0 && journalData[0]?.updated_at && mounted && (
                    <p className="text-xs text-neutral-400">
                      Last Updated: {formatDate(journalData[0].updated_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center w-full md:w-auto justify-center">
                <Button variant="ghost" size="sm" asChild className="flex-1 md:flex-initial">
                  <Link href="/journal">View</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="flex-1 md:flex-initial">
                  <Link href="/journal/new" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Entry</span>
                  </Link>
                </Button>
              </div>
            </div>
              
              {journalData.length > 0 ? (
                <div className="space-y-4">
                  {/* Tracking Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <TrackingMilestoneCard
                      label="Total Entries"
                      mobileLabel="Entries"
                      value={journalData.length}
                      theme="primary"
                      className="!p-3 md:!p-4"
                    />
                    
                    <TrackingMilestoneCard
                      label="Media Files"
                      value={journalData.reduce((total, entry) => total + (entry.image_urls?.length || 0), 0)}
                      theme="accent"
                      className="!p-3 md:!p-4"
                    />
                  </div>
                  
                  {/* Recent Entries */}
                  <div className="space-y-2">
                    {journalData.slice(0, 3).map((entry, index) => (
                      <Link 
                        key={entry.id} 
                        href={`/journal/${entry.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#39FF14]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {entry.title || 'Untitled Entry'}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {mounted && formatDate(entry.created_at)}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Summary */}
                  {journalData.length > 3 && (
                    <Link href="/journal" className="block">
                      <p className="text-xs text-neutral-400 text-center hover:text-primary-500 transition-colors cursor-pointer">
                        +{journalData.length - 3} more entries
                      </p>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#D03739]/10 to-[#EF4444]/10 border border-[#D03739]/30 rounded-lg p-4">
                  <p className="text-sm text-neutral-300">
                    Start capturing evidence of actualization with rich multimedia journal entries.
                  </p>
                </div>
              )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-6 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
              <Link href="/dashboard/activity" className="w-full md:w-auto">
                <Button variant="ghost" size="sm" className="w-full md:w-auto">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">No recent activity</p>
                  <p className="text-neutral-500 text-xs">Start building your vision!</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const IconComponent = activity.icon
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-800/50">
                      <div className="p-2 bg-[#39FF14]/20 rounded-lg">
                        <IconComponent className="w-4 h-4 text-[#39FF14]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{activity.title}</h4>
                        <p className="text-sm text-neutral-400">{activity.description}</p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {mounted && formatDate(activity.date)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Billing Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Billing</h3>
                  <p className="text-sm text-neutral-400">Vibration Fit Pro</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/billing">Manage</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Subscription</span>
                <span className="text-sm text-[#39FF14]">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Next Billing</span>
                <span className="text-sm text-neutral-300">Jan 1, 2025</span>
              </div>
            </div>
          </Card>

          {/* Support Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Support</h3>
                  <p className="text-sm text-neutral-400">Get Help</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/support">Contact Us</Link>
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#06B6D4]/10 border border-[#00FFFF]/30 rounded-lg p-4">
              <p className="text-sm text-neutral-300">
                Need help? Our support team is here to assist you with any questions or issues.
              </p>
            </div>
          </Card>

          {/* Creation Tokens and Storage Section */}
          <HouseholdTokenBalance />
          
          {/* Storage Usage Card */}
          <Card variant="elevated" className="bg-black">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#14B8A6]/20 rounded-xl flex items-center justify-center">
                <HardDrive className="w-8 h-8 text-[#14B8A6]" />
              </div>
              <h3 className="text-lg font-semibold mt-4">Storage Usage</h3>
              <p className="text-3xl font-bold text-secondary-500 mt-4">
                {(storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                of {storageQuotaGB} GB total
              </p>
              <Button variant="secondary" size="sm" asChild className="mt-6">
                <Link href="/dashboard/storage">
                  Storage Dashboard
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </Stack>
    </Container>
    </>
  )
}