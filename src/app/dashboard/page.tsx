import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout, Container, Card, Button, Badge, ProgressBar } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system'
import Link from 'next/link'
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
  Package, 
  Gift, 
  CheckCircle,
  ArrowRight,
  Plus,
  BarChart3,
  Calendar,
  Activity,
  Crown,
  Brain,
  Lightbulb
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch comprehensive user data
  const [visionResult, profileResult, journalResult, visionBoardResult, vibeAssistantResult, assessmentResult] = await Promise.all([
    // Vision data
    supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    
    // Profile completion
    supabase
      .rpc('get_profile_completion_percentage', { user_uuid: user.id }),
    
    // Journal entries
    supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    
    // Vision board items
    supabase
      .from('vision_board_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    
    // Vibe Assistant usage (if available)
    supabase
      .from('profiles')
      .select('vibe_assistant_tokens_used, vibe_assistant_tokens_remaining, vibe_assistant_total_cost, membership_tier_id')
      .eq('id', user.id)
      .single(),
    
    // Assessment data
    supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
  ])

  const visions = visionResult.data || []
  const profileCompletePercentage = profileResult.data || 0
  const journalCount = journalResult.count || 0
  const visionBoardCount = visionBoardResult.count || 0
  const vibeAssistantData = vibeAssistantResult.data
  const latestAssessment = assessmentResult.data?.[0] || null

  // Calculate stats
  const visionCount = visions.length
  const completedVisions = visions.filter(v => v.status === 'complete').length
  const latestVision = visions[0]
  
  // Calculate vision category completion for latest vision
  const getCategoryCompletion = (vision: any) => {
    if (!vision) return {}
    const categories = VISION_CATEGORIES.map(cat => cat.key)
    const completed = categories.filter(key => vision[key] && vision[key].trim().length > 0)
    return {
      completed: completed.length,
      total: categories.length,
      percentage: Math.round((completed.length / categories.length) * 100)
    }
  }

  const categoryProgress = getCategoryCompletion(latestVision)

  // Calculate Vibe Assistant stats
  const vibeAssistantTokensUsed = vibeAssistantData?.vibe_assistant_tokens_used || 0
  const vibeAssistantTokensRemaining = vibeAssistantData?.vibe_assistant_tokens_remaining || 100
  const vibeAssistantTotalCost = vibeAssistantData?.vibe_assistant_total_cost || 0
  const membershipTierId = vibeAssistantData?.membership_tier_id

  // Determine membership tier
  const getMembershipTier = (tierId: string | null) => {
    if (!tierId) return { name: 'Free', color: 'neutral', monthlyLimit: 100 }
    // This would normally query the membership_tiers table
    return { name: 'Free', color: 'neutral', monthlyLimit: 100 }
  }

  const membershipTier = getMembershipTier(membershipTierId)

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [recentJournalEntries, recentVisionUpdates] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(3)
  ])

  const recentActivity = [
    ...(recentJournalEntries.data || []).map(entry => ({
      type: 'journal',
      title: 'Journal Entry',
      description: entry.entry_type === 'evidence' ? 'Logged evidence of actualization' : 'New journal entry',
      date: entry.created_at,
      icon: BookOpen
    })),
    ...(recentVisionUpdates.data || []).map(vision => ({
      type: 'vision',
      title: 'Vision Updated',
      description: `Updated "${vision.title}"`,
      date: vision.updated_at,
      icon: Target
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
              <p className="text-secondary-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="premium" className="flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {membershipTier.name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {profileCompletePercentage < 100 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">Complete Your Profile</h3>
                <p className="text-neutral-300 text-sm">
                  Your profile is {profileCompletePercentage}% complete. Help your AI assistant provide better guidance.
                </p>
              </div>
              <Button asChild>
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Assessment Call-to-Action */}
        {!latestAssessment && profileCompletePercentage >= 50 && (
          <Card className="mb-6 p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Take Your Vibrational Assessment</h3>
                <p className="text-neutral-300 text-sm mb-3">
                  Discover where you stand across all 12 life categories. Our 84-question assessment helps VIVA create your most aligned life vision.
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <CheckCircle className="w-4 h-4 text-primary-500" />
                  <span>Takes 10-15 minutes</span>
                  <span className="text-neutral-600">•</span>
                  <CheckCircle className="w-4 h-4 text-primary-500" />
                  <span>Green Line scoring</span>
                  <span className="text-neutral-600">•</span>
                  <CheckCircle className="w-4 h-4 text-primary-500" />
                  <span>Personalized insights</span>
                </div>
              </div>
              <Button asChild size="lg">
                <Link href="/assessment">
                  <Target className="w-4 h-4 mr-2" />
                  Start Assessment
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-500/20 rounded-xl">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <h3 className="text-neutral-400 text-sm mb-2">Life Visions</h3>
            <p className="text-3xl font-bold text-white mb-1">{visionCount}</p>
            <p className="text-xs text-neutral-500">{completedVisions} completed</p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-secondary-500" />
              </div>
              <Badge variant="info">Growing</Badge>
            </div>
            <h3 className="text-neutral-400 text-sm mb-2">Journal Entries</h3>
            <p className="text-3xl font-bold text-white mb-1">{journalCount}</p>
            <p className="text-xs text-neutral-500">Evidence & reflections</p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-accent-500" />
              </div>
              <Badge variant="premium">AI Powered</Badge>
            </div>
            <h3 className="text-neutral-400 text-sm mb-2">Vision Board Items</h3>
            <p className="text-3xl font-bold text-white mb-1">{visionBoardCount}</p>
            <p className="text-xs text-neutral-500">Manifestation goals</p>
          </Card>
          
          <Link href="/dashboard/tokens">
            <Card className="p-6 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-energy-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-energy-500" />
                </div>
                <Badge variant="warning">Creation Tokens</Badge>
              </div>
              <h3 className="text-neutral-400 text-sm mb-2">Token Balance</h3>
              <p className="text-3xl font-bold text-white mb-1">
                {vibeAssistantTokensRemaining >= 1_000_000 
                  ? `${(vibeAssistantTokensRemaining / 1_000_000).toFixed(1)}M`
                  : vibeAssistantTokensRemaining >= 1_000
                    ? `${(vibeAssistantTokensRemaining / 1_000).toFixed(1)}K`
                    : vibeAssistantTokensRemaining
                }
              </p>
              <p className="text-xs text-neutral-500">
                {vibeAssistantTokensUsed >= 1_000_000
                  ? `${(vibeAssistantTokensUsed / 1_000_000).toFixed(1)}M used`
                  : vibeAssistantTokensUsed >= 1_000
                    ? `${(vibeAssistantTokensUsed / 1_000).toFixed(1)}K used`
                    : `${vibeAssistantTokensUsed} used`
                }
              </p>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Vision Progress */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary-500" />
                Vision Progress
              </h2>
              <Button variant="ghost" asChild className="text-primary-500">
                <Link href="/life-vision">View All</Link>
              </Button>
            </div>

            {latestVision ? (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{latestVision.title}</h3>
                    <Badge variant={latestVision.status === 'complete' ? 'success' : 'warning'}>
                      {latestVision.status}
                    </Badge>
                  </div>
                  <ProgressBar 
                    value={categoryProgress.percentage || 0} 
                    variant="primary" 
                    className="mb-2"
                  />
                  <p className="text-sm text-neutral-400">
                    {categoryProgress.completed} of {categoryProgress.total} categories completed
                  </p>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {VISION_CATEGORIES.slice(0, 6).map((category) => {
                    const IconComponent = category.icon
                    const isCompleted = latestVision[category.key as keyof typeof latestVision] && 
                                      String(latestVision[category.key as keyof typeof latestVision]).trim().length > 0
                    
                    return (
                      <div 
                        key={category.key}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isCompleted 
                            ? 'border-primary-500/50 bg-primary-500/10' 
                            : 'border-neutral-700 bg-neutral-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className={`w-4 h-4 ${isCompleted ? 'text-primary-500' : 'text-neutral-400'}`} />
                          <span className={`text-xs font-medium ${isCompleted ? 'text-primary-300' : 'text-neutral-400'}`}>
                            {category.label}
                          </span>
                        </div>
                        {isCompleted && <CheckCircle className="w-3 h-3 text-primary-500" />}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <Link href={`/life-vision/${latestVision.id}`}>
                      <Target className="w-4 h-4 mr-2" />
                      Continue Vision
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href={`/life-vision/${latestVision.id}/refine`}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Refine with AI
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Vision Yet</h3>
                <p className="text-neutral-400 mb-4">Start your journey by creating your first Life Vision</p>
                <Button asChild>
                  <Link href="/life-vision/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Vision
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              {!latestAssessment && (
                <Button asChild className="w-full justify-start">
                  <Link href="/assessment">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    Take Assessment
                  </Link>
                </Button>
              )}
              <Button asChild className={!latestAssessment ? "w-full justify-start" : "w-full justify-start"} variant={latestAssessment ? "primary" : "secondary"}>
                <Link href="/life-vision/new">
                  <Sparkles className="w-4 h-4 mr-3" />
                  New Life Vision
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full justify-start">
                <Link href="/journal/new">
                  <BookOpen className="w-4 h-4 mr-3" />
                  Journal Entry
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full justify-start">
                <Link href="/vision-board/new">
                  <Target className="w-4 h-4 mr-3" />
                  Vision Board Item
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/dashboard/vibe-assistant-usage">
                  <Brain className="w-4 h-4 mr-3" />
                  Vibe Assistant
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-500" />
              Recent Activity
            </h2>
            <Button variant="ghost" asChild className="text-primary-500">
              <Link href="/journal">View All</Link>
            </Button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = activity.icon
                return (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-800/50">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <IconComponent className="w-4 h-4 text-primary-500" />
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
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
              <p className="text-neutral-400 mb-4">Start journaling or updating your vision to see activity here</p>
              <Button asChild>
                <Link href="/journal/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Journaling
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Vibe Assistant Usage */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-accent-500" />
              Vibe Assistant Usage
            </h2>
            <Button variant="ghost" asChild className="text-accent-500">
              <Link href="/dashboard/vibe-assistant-usage">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-accent-500/20 rounded-xl inline-flex mb-3">
                <Zap className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="text-sm text-neutral-400 mb-1">Tokens Used</h3>
              <p className="text-2xl font-bold text-white">{vibeAssistantTokensUsed.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-green-500/20 rounded-xl inline-flex mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-sm text-neutral-400 mb-1">Tokens Remaining</h3>
              <p className="text-2xl font-bold text-white">{vibeAssistantTokensRemaining.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-yellow-500/20 rounded-xl inline-flex mb-3">
                <DollarSign className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-sm text-neutral-400 mb-1">Total Cost</h3>
              <p className="text-2xl font-bold text-white">${vibeAssistantTotalCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6">
            <ProgressBar 
              value={(vibeAssistantTokensUsed / (vibeAssistantTokensUsed + vibeAssistantTokensRemaining)) * 100} 
              variant="accent" 
              className="mb-2"
            />
            <p className="text-sm text-neutral-400 text-center">
              {membershipTier.name} Plan - {membershipTier.monthlyLimit} tokens/month
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <form action="/auth/logout" method="post">
            <Button variant="ghost" type="submit" className="text-neutral-400 hover:text-white">
              Sign out
            </Button>
          </form>
        </div>
      </Container>
    </PageLayout>
  )
}