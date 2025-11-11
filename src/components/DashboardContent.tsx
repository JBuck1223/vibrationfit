'use client'

import { Card, Button, Badge, ProgressBar, Container, AIButton } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system'
import Link from 'next/link'
import AITokenUsage from '@/components/AITokenUsage'
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
  User
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
}

export default function DashboardContent({ user, profileData, visionData, visionBoardData, journalData, assessmentData = [] }: DashboardContentProps) {
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

  // Calculate token usage percentage
  const tokensUsed = profileData?.vibe_assistant_tokens_used ?? 0
  const tokensRemaining = profileData?.vibe_assistant_tokens_remaining ?? 0
  const totalTokens = tokensUsed + tokensRemaining
  const tokenUsagePercentage = totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0

  // Create recent activity data
  const recentActivity = [
    ...visionData.map(vision => ({
      title: 'Vision Updated',
      description: `${vision.category} vision refined`,
      date: vision.updated_at,
      icon: Target
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

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
      {/* Hero Welcome Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#39FF14] to-[#00FFFF] bg-clip-text text-transparent">
            Welcome to Your Conscious Creation Hub
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
            Transform your vision into reality with VibrationFit's complete conscious creation system. 
            Build your Life I Choose™, align daily, and capture evidence of actualization.
          </p>
        </div>

      </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-[#00FF88] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">1</h3>
            <p className="text-neutral-400">Profiles Created</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF] to-[#06B6D4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{visionData.length}</h3>
            <p className="text-neutral-400">Visions Generated</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFB701] to-[#FCD34D] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">0</h3>
            <p className="text-neutral-400">Vision Board Items</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D03739] to-[#EF4444] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">0</h3>
            <p className="text-neutral-400">Journal Entries</p>
          </Card>
        </div>

        {/* Your Complete Conscious Creation Toolkit */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Your Complete Conscious Creation Toolkit</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Everything you need to build your vision, align daily, and capture evidence of actualization
            </p>
          </div>

          {/* First Row - Core Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#39FF14] to-[#00FF88] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Profile</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Complete your personal information and preferences
              </p>
              <Button variant="primary" size="sm" asChild>
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00FFFF] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Life Vision</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Build your Life I Choose™ document
              </p>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/life-vision">Build Vision</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#BF00FF] to-[#FF0080] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">VIVA Assistant</h3>
              <p className="text-neutral-400 text-sm mb-4">
                AI-powered guidance that knows your journey
              </p>
              <AIButton size="sm" asChild>
                <Link href="/viva">Chat with VIVA</Link>
              </AIButton>
            </Card>
          </div>

          {/* Second Row - Creation Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFB701] to-[#FCD34D] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Image className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vision Board</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Visualize and track your conscious creations
              </p>
              <Button variant="accent" size="sm" asChild>
                <Link href="/vision-board">View Board</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D03739] to-[#EF4444] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conscious Creation Journal</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Capture evidence of actualization with rich entries
              </p>
              <Button variant="primary" size="sm" asChild>
                <Link href="/journal">Start Journaling</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#BF00FF] to-[#FF0080] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vibration Assessment</h3>
              <p className="text-neutral-400 text-sm mb-4">
                {latestAssessment 
                  ? `Latest: ${latestAssessment.overall_percentage || 0}% complete`
                  : 'Discover your current alignment and insights'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <AIButton size="sm" asChild>
                  <Link href="/assessment">Take Assessment</Link>
                </AIButton>
                {latestAssessment && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/assessment/results">View Results</Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm">
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
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Detailed Data Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Profile</h3>
                  <p className="text-sm text-neutral-400">{profileCompletePercentage}% Complete</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">Edit</Link>
                </Button>
              </div>
            </div>
            
            {profileData ? (
              <div className="space-y-4">
                {/* Active Profile Info */}
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Profile Version 1</span>
                      <Badge variant={profileCompletePercentage >= 70 ? "success" : "warning"} className="text-xs">
                        {profileCompletePercentage >= 70 ? "Complete" : "In Progress"}
                      </Badge>
                    </div>
                    <span className="text-xs text-neutral-400">{profileCompletePercentage}% Complete</span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-neutral-400">
                    <div>Updated: {new Date(profileData.updated_at).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true 
                    })}</div>
                    <div>ID: {profileData.id}</div>
                  </div>
                  
                  <div className="mt-3 w-full bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-[#39FF14] h-2 rounded-full" 
                      style={{ width: `${profileCompletePercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-neutral-400">
                  {profileCompletePercentage >= 70 
                    ? "🎉 Your profile is complete! You're above the Green Line."
                    : "Complete your profile to unlock all features and get personalized insights."
                  }
                </p>
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Life Vision</h3>
                  <p className="text-sm text-neutral-400">{visionData.length} Versions</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/life-vision">View</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/life-vision/new">New</Link>
                </Button>
              </div>
            </div>
            
            {visionData.length > 0 ? (
              <div className="space-y-4">
                {/* Active Vision Info */}
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Version {visionData.length}</span>
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </div>
                    <span className="text-xs text-neutral-400">100% Complete</span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-neutral-400">
                    <div>Created: {new Date(visionData[0]?.created_at).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true 
                    })}</div>
                    <div>ID: {visionData[0]?.id}</div>
                  </div>
                  
                  <div className="mt-3 w-full bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-[#00FFFF] h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
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
            )}
          </Card>

          {/* Vision Board Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFB701]/20 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-[#FFB701]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Vision Board</h3>
                  <p className="text-sm text-neutral-400">{visionBoardData.length} Items</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vision-board">View</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vision-board/new">New Item</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-neutral-800/50">
                <div className="text-lg font-bold text-[#FFB701]">{visionBoardData.length}</div>
                <div className="text-xs text-neutral-400">Total</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-neutral-800/50">
                <div className="text-lg font-bold text-[#00FFFF]">
                  {visionBoardData.filter(item => item.status === 'active').length}
                </div>
                <div className="text-xs text-neutral-400">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-neutral-800/50">
                <div className="text-lg font-bold text-[#39FF14]">
                  {visionBoardData.filter(item => item.status === 'actualized').length}
                </div>
                <div className="text-xs text-neutral-400">Actualized</div>
              </div>
            </div>
          </Card>

          {/* Journal Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D03739]/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#D03739]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Journal</h3>
                  <p className="text-sm text-neutral-400">{journalData.length} Entries</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/journal">View</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/journal/new">New Entry</Link>
                </Button>
              </div>
            </div>
            {journalData.length > 0 ? (
              <div className="bg-gradient-to-r from-[#39FF14]/10 to-[#00FF88]/10 border border-[#39FF14]/30 rounded-lg p-4">
                <p className="text-sm text-neutral-300">
                  You have {journalData.length} journal entries capturing your evidence of actualization. Keep building your proof!
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#D03739]/10 to-[#EF4444]/10 border border-[#D03739]/30 rounded-lg p-4">
                <p className="text-sm text-neutral-300">
                  Start capturing evidence of actualization with rich multimedia journal entries.
                </p>
              </div>
            )}
          </Card>

          {/* VIVA Tokens and Usage */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#BF00FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">VIVA Tokens</h3>
                  <p className="text-sm text-neutral-400">{profileData?.vibe_assistant_tokens_remaining ?? 0} Available</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/token-history">See Detailed Tracking</Link>
                </Button>
              </div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-400">Tokens Used This Month</span>
                <span className="text-sm text-neutral-400">{profileData?.vibe_assistant_tokens_used ?? 0} / {profileData?.vibe_assistant_tokens_remaining ?? 0}</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-[#BF00FF] h-2 rounded-full" 
                  style={{ 
                    width: `${tokenUsagePercentage}%`
                  }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Storage Details */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#00FFFF]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Storage</h3>
                  <p className="text-xs text-neutral-400">0 GB Used</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/storage">View</Link>
                </Button>
              </div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-400">Storage Used</span>
                <span className="text-xs text-neutral-400">0 GB / {profileData?.storage_quota_gb ?? 5} GB</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-1.5">
                <div 
                  className="bg-[#00FFFF] h-1.5 rounded-full" 
                  style={{ width: '0%' }}
                ></div>
              </div>
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
                  <p className="text-sm text-neutral-400">VibrationFit Pro</p>
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
                <div className="w-12 h-12 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#00FFFF]" />
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
        </div>
    </>
  )
}