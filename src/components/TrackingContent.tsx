'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, Button, Container, Stack, TrackingMilestoneCard } from '@/lib/design-system'
import Link from 'next/link'
import HouseholdTokenBalance from '@/components/HouseholdTokenBalance'
import AssessmentBarChart from '@/app/assessment/components/AssessmentBarChart'
import { RetentionDashboard } from '@/components/retention'
import { UnlockCelebrationModal } from '@/components/UnlockCelebrationModal'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Heart, 
  ArrowRight,
  Plus,
  Activity,
  Brain,
  Image,
  User,
  CreditCard,
  HardDrive,
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

  useEffect(() => {
    if (searchParams.get('unlocked') === 'true') {
      setShowCelebration(true)
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

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

  const calculateCompletionManually = (profileData: any): number => {
    if (!profileData) return 0

    let totalFields = 0
    let completedFields = 0

    const hasValue = (field: string) => {
      const value = profileData[field]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'boolean') return true
      return value !== null && value !== undefined && value !== ''
    }

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

  const formatDate = (dateString: string) => {
    if (!mounted) return ''
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }

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

  const profileCompletePercentage = completionPercentage

  return (
    <>
      <UnlockCelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />

      <Container size="xl">
        <Stack gap="md">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Profile Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <User className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Profile</h3>
                    {profileData?.updated_at && mounted && (
                      <p className="text-[11px] text-neutral-500">{formatDate(profileData.updated_at)}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile" className="text-xs">View</Link>
                </Button>
              </div>
              
              {profileData ? (
                <div className="grid grid-cols-2 gap-3">
                  <TrackingMilestoneCard label="Profiles" value={profileCount} theme="primary" className="!p-3" />
                  <TrackingMilestoneCard label="Completion" value={`${profileCompletePercentage}%`} theme="secondary" className="!p-3" />
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                  <p className="text-sm text-neutral-500">Profile not found</p>
                  <Button variant="ghost" size="sm" className="mt-2" asChild>
                    <Link href="/profile">Create Profile</Link>
                  </Button>
                </div>
              )}
            </Card>

            {/* Life Vision Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Target className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Life Vision</h3>
                    <p className="text-[11px] text-neutral-500">
                      {visionData.find(v => v.is_active)?.updated_at ? (mounted ? formatDate(visionData.find(v => v.is_active).updated_at) : '') : 'N/A'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/life-vision" className="text-xs">View</Link>
                </Button>
              </div>
              
              {(() => {
                const activeVision = visionData.find(v => v.is_active)
                return activeVision ? (
                  <div className="grid grid-cols-3 gap-3">
                    <TrackingMilestoneCard label="Versions" value={visionData.length} theme="primary" className="!p-3" />
                    <TrackingMilestoneCard label="Refinements" value={refinementsCount} theme="secondary" className="!p-3" />
                    <TrackingMilestoneCard label="Audios" value={audioSetsCount} theme="accent" className="!p-3" />
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                    <p className="text-sm text-neutral-500">
                      {visionData.length > 0 ? 'No active vision. Please activate a version.' : 'No vision versions created yet'}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                      <Link href={visionData.length > 0 ? '/life-vision' : '/life-vision/new'}>
                        {visionData.length > 0 ? 'View Visions' : 'Create Your First Vision'}
                      </Link>
                    </Button>
                  </div>
                )
              })()}
            </Card>

            {/* Assessment Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Brain className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Assessment</h3>
                    {assessmentData.length > 0 && assessmentData[0]?.updated_at && mounted && (
                      <p className="text-[11px] text-neutral-500">{formatDate(assessmentData[0].updated_at)}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/assessment" className="text-xs">View</Link>
                </Button>
              </div>
              
              {assessmentData.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TrackingMilestoneCard label="Completed" value={assessmentData.filter(a => a.status === 'completed').length} theme="primary" className="!p-3" />
                    <TrackingMilestoneCard
                      label="Score"
                      value={(() => {
                        const activeAssessment = assessmentData.find(a => a.status === 'completed')
                        return activeAssessment?.overall_percentage ? `${activeAssessment.overall_percentage}%` : 'N/A'
                      })()}
                      theme="secondary"
                      className="!p-3"
                    />
                  </div>
                  {(() => {
                    const activeAssessment = assessmentData.find(a => a.status === 'completed')
                    return activeAssessment ? (
                      <Card variant="glass" className="p-3 sm:p-4 border border-white/[0.06] shadow-none">
                        <AssessmentBarChart assessment={activeAssessment} compact={true} />
                      </Card>
                    ) : null
                  })()}
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-sm text-neutral-400">
                    Take your first vibrational assessment to discover your current alignment across 12 key life areas.
                  </p>
                </div>
              )}
            </Card>

            {/* Vision Board Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Image className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Vision Board</h3>
                    {visionBoardData.length > 0 && visionBoardData[0]?.updated_at && mounted && (
                      <p className="text-[11px] text-neutral-500">{formatDate(visionBoardData[0].updated_at)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vision-board" className="text-xs">View</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vision-board/new" className="text-xs flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </Link>
                  </Button>
                </div>
              </div>
              
              {visionBoardData.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <TrackingMilestoneCard label="Total" value={visionBoardData.length} theme="primary" className="!p-3" />
                    <TrackingMilestoneCard label="Active" value={visionBoardData.filter(item => item.status === 'active').length} theme="secondary" className="!p-3" />
                    <TrackingMilestoneCard label="Actualized" value={visionBoardData.filter(item => item.status === 'actualized').length} theme="accent" className="!p-3" />
                  </div>
                  
                  <div className="space-y-1.5">
                    {visionBoardData.slice(0, 3).map((item) => (
                      <Link key={item.id} href={`/vision-board/${item.id}`} className="block group">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.name || 'Untitled Item'}</p>
                            <p className="text-[11px] text-neutral-500">
                              {item.status === 'actualized' ? 'Actualized' : item.status === 'active' ? 'In Progress' : 'Paused'}{mounted && ` · ${formatDate(item.created_at)}`}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {visionBoardData.length > 3 && (
                    <Link href="/vision-board" className="block">
                      <p className="text-xs text-neutral-500 text-center hover:text-neutral-300 transition-colors">
                        +{visionBoardData.length - 3} more items
                      </p>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-sm text-neutral-400">
                    Start adding items to your vision board to visualize and track your conscious creations.
                  </p>
                </div>
              )}
            </Card>

            {/* Journal Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <BookOpen className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Journal</h3>
                    {journalData.length > 0 && journalData[0]?.updated_at && mounted && (
                      <p className="text-[11px] text-neutral-500">{formatDate(journalData[0].updated_at)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/journal" className="text-xs">View</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/journal/new" className="text-xs flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </Link>
                  </Button>
                </div>
              </div>
              
              {journalData.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TrackingMilestoneCard label="Entries" value={journalData.length} theme="primary" className="!p-3" />
                    <TrackingMilestoneCard label="Media" value={journalData.reduce((total, entry) => total + (entry.image_urls?.length || 0), 0)} theme="accent" className="!p-3" />
                  </div>
                  
                  <div className="space-y-1.5">
                    {journalData.slice(0, 3).map((entry) => (
                      <Link key={entry.id} href={`/journal?expand=${encodeURIComponent(entry.id)}`} className="block group">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{entry.title || 'Untitled Entry'}</p>
                            <p className="text-[11px] text-neutral-500">{mounted && formatDate(entry.created_at)}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {journalData.length > 3 && (
                    <Link href="/journal" className="block">
                      <p className="text-xs text-neutral-500 text-center hover:text-neutral-300 transition-colors">
                        +{journalData.length - 3} more entries
                      </p>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-sm text-neutral-400">
                    Start capturing evidence of actualization with rich multimedia journal entries.
                  </p>
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                <Link href="/activity">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-1.5">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-6 h-6 text-neutral-700 mx-auto mb-2" />
                    <p className="text-neutral-500 text-sm">No recent activity</p>
                    <p className="text-neutral-600 text-xs">Start building your vision!</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon
                    return (
                      <div key={index} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                          <IconComponent className="w-3.5 h-3.5 text-[#39FF14]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm text-white">{activity.title}</h4>
                          <p className="text-[11px] text-neutral-500 truncate">{activity.description}</p>
                        </div>
                        <span className="text-[11px] text-neutral-600 flex-shrink-0">
                          {mounted && formatDate(activity.date)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Billing Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <CreditCard className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Billing</h3>
                    <p className="text-[11px] text-neutral-500">Vibration Fit Pro</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/billing" className="text-xs">Manage</Link>
                </Button>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Subscription</span>
                  <span className="text-sm text-[#39FF14]">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Next Billing</span>
                  <span className="text-sm text-neutral-300">Jan 1, 2025</span>
                </div>
              </div>
            </Card>

            {/* Support Details */}
            <Card variant="glass" className="border border-white/[0.06] p-4 sm:p-5 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Users className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Support</h3>
                    <p className="text-[11px] text-neutral-500">Get Help</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/support" className="text-xs">Contact Us</Link>
                </Button>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-sm text-neutral-400">
                  Need help? Our support team is here to assist you with any questions or issues.
                </p>
              </div>
            </Card>

            {/* Creation Tokens and Storage Section */}
            <HouseholdTokenBalance />
            
            {/* Storage Usage Card */}
            <Card variant="glass" className="border border-white/[0.06] shadow-none">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/10">
                  <HardDrive className="w-6 h-6 text-[#14B8A6]" />
                </div>
                <h3 className="text-sm font-semibold mt-4">Storage Usage</h3>
                <p className="text-2xl font-bold text-secondary-500 mt-3">
                  {(storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  of {storageQuotaGB} GB total
                </p>
                <Button variant="secondary" size="sm" asChild className="mt-5">
                  <Link href="/storage">
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
