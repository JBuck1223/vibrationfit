'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Rocket, 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Zap, 
  Brain, 
  ArrowRight, 
  BarChart3,
  Lightbulb,
  Star,
  Crown,
  Activity,
  Edit,
  Play,
  Pause,
  Archive,
  Trash2,
  Plus,
  Users,
  MapPin,
  Wrench,
  GraduationCap,
  DollarSign
} from 'lucide-react'
import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge, 
  ProgressBar, 
  Spinner
} from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'

interface Blueprint {
  id: string
  title: string
  description: string
  category: string
  status: string
  progress_percentage: number
  priority_level: string
  ai_analysis: string
  opportunity_summary: string
  success_metrics: string
  potential_challenges: string
  recommended_timeline: string
  phases: any[]
  resources_needed: {
    people?: string[]
    places?: string[]
    tools?: string[]
    skills?: string[]
    financial?: string[]
  }
  milestones: any[]
  created_at: string
  updated_at: string
  vision_id: string
}

interface VisionData {
  id: string
  title: string
}

export default function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  
  // State management
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'resources' | 'progress'>('overview')

  // Load blueprint data
  useEffect(() => {
    const loadBlueprint = async () => {
      try {
        const resolvedParams = await params
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Please log in to access this page')
          return
        }

        // Load blueprint
        const { data: blueprintData, error: blueprintError } = await supabase
          .from('actualization_blueprints')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single()

        if (blueprintError || !blueprintData) {
          setError('Blueprint not found or access denied')
          return
        }

        setBlueprint(blueprintData)

        // Load associated vision
        if (blueprintData.vision_id) {
          const { data: visionData } = await supabase
            .from('vision_versions')
            .select('id, title')
            .eq('id', blueprintData.vision_id)
            .single()

          setVision(visionData)
        }
        
      } catch (err) {
        console.error('Error loading blueprint:', err)
        setError('Failed to load blueprint')
      } finally {
        setLoading(false)
      }
    }
    
    loadBlueprint()
  }, [params])

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!blueprint) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('actualization_blueprints')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', blueprint.id)

      if (error) {
        throw new Error('Failed to update status')
      }

      setBlueprint(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (err) {
      console.error('Status update error:', err)
      alert('Failed to update status')
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'completed': return 'text-blue-400 bg-blue-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/20'
      case 'archived': return 'text-neutral-400 bg-neutral-500/20'
      default: return 'text-purple-400 bg-purple-500/20'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-green-400 bg-green-500/20'
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (error || !blueprint) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Rocket className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Blueprint Error</h2>
              <p className="text-neutral-400 mb-6">{error || 'Blueprint not found'}</p>
              <Button onClick={() => router.back()} variant="primary">
                Go Back
              </Button>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Blueprints
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-8 h-8 text-green-400" />
                <h1 className="text-3xl font-bold text-white">{blueprint.title}</h1>
                <Badge className={getStatusColor(blueprint.status)}>
                  {blueprint.status}
                </Badge>
                <Badge className={getPriorityColor(blueprint.priority_level)}>
                  {blueprint.priority_level} priority
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-neutral-400">
                <span>{blueprint.category}</span>
                {vision && (
                  <>
                    <span>•</span>
                    <Link href={`/life-vision/${vision.id}`} className="hover:text-white">
                      From: {vision.title}
                    </Link>
                  </>
                )}
                <span>•</span>
                <span>Created {new Date(blueprint.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleStatusChange(blueprint.status === 'active' ? 'paused' : 'active')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                {blueprint.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleStatusChange('completed')}
                variant="primary"
                size="sm"
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Progress</span>
              <span className="text-sm text-neutral-400">{blueprint.progress_percentage}% Complete</span>
            </div>
            <ProgressBar 
              value={blueprint.progress_percentage}
              variant="primary"
              showLabel={false}
              className="w-full"
            />
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-neutral-800 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'phases', label: 'Phases', icon: Target },
              { id: 'resources', label: 'Resources', icon: Users },
              { id: 'progress', label: 'Progress', icon: TrendingUp }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Analysis */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Analysis
                </h3>
                <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {blueprint.ai_analysis || 'No AI analysis available'}
                  </p>
                </div>
              </Card>

              {/* Opportunity Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Opportunity Summary
                </h3>
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {blueprint.opportunity_summary || 'No opportunity summary available'}
                  </p>
                </div>
              </Card>

              {/* Success Metrics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Success Metrics
                </h3>
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {blueprint.success_metrics || 'No success metrics available'}
                  </p>
                </div>
              </Card>

              {/* Potential Challenges */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  Potential Challenges
                </h3>
                <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {blueprint.potential_challenges || 'No challenges identified'}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Phases Tab */}
          {activeTab === 'phases' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-400" />
                Action Phases
              </h3>
              <div className="space-y-4">
                {blueprint.phases && blueprint.phases.length > 0 ? (
                  blueprint.phases.map((phase, index) => (
                    <div key={index} className="bg-neutral-800/50 border border-neutral-600 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-white">{phase.title || `Phase ${index + 1}`}</h4>
                      </div>
                      {phase.description && (
                        <p className="text-neutral-300 mb-3">{phase.description}</p>
                      )}
                      {phase.tasks && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-white">Key Actions:</h5>
                          <ul className="list-disc list-inside text-neutral-300 space-y-1">
                            {phase.tasks.map((task: string, taskIndex: number) => (
                              <li key={taskIndex}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No phases defined yet</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  People
                </h3>
                <div className="space-y-2">
                  {blueprint.resources_needed?.people ? (
                    blueprint.resources_needed.people.map((person: string, index: number) => (
                      <div key={index} className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3">
                        <p className="text-neutral-300">{person}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400">No people resources defined</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Places
                </h3>
                <div className="space-y-2">
                  {blueprint.resources_needed?.places ? (
                    blueprint.resources_needed.places.map((place: string, index: number) => (
                      <div key={index} className="bg-green-900/20 border border-green-500/50 rounded-lg p-3">
                        <p className="text-neutral-300">{place}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400">No places defined</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-purple-400" />
                  Tools
                </h3>
                <div className="space-y-2">
                  {blueprint.resources_needed?.tools ? (
                    blueprint.resources_needed.tools.map((tool: string, index: number) => (
                      <div key={index} className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-3">
                        <p className="text-neutral-300">{tool}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400">No tools defined</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-yellow-400" />
                  Skills
                </h3>
                <div className="space-y-2">
                  {blueprint.resources_needed?.skills ? (
                    blueprint.resources_needed.skills.map((skill: string, index: number) => (
                      <div key={index} className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                        <p className="text-neutral-300">{skill}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400">No skills defined</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Progress Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{blueprint.progress_percentage}%</div>
                    <div className="text-sm text-neutral-400">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{blueprint.status}</div>
                    <div className="text-sm text-neutral-400">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{blueprint.priority_level}</div>
                    <div className="text-sm text-neutral-400">Priority</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Milestones
                </h3>
                <div className="space-y-3">
                  {blueprint.milestones && blueprint.milestones.length > 0 ? (
                    blueprint.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{milestone.title || `Milestone ${index + 1}`}</p>
                          {milestone.description && (
                            <p className="text-neutral-300 text-sm">{milestone.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">No milestones defined yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  )
}
