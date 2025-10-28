'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Sparkles, 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Zap, 
  Brain, 
  ArrowRight, 
  Filter,
  Search,
  BarChart3,
  Lightbulb,
  Rocket,
  Star,
  Crown,
  Activity
} from 'lucide-react'
import { 
  PageLayout, 
  Card, 
  Button, 
  Badge, 
  ProgressBar, 
  Spinner,
  Input,
  InsufficientTokensDialog
} from '@/lib/design-system'
import { 
  checkVibeAssistantAllowance,
  formatTokens,
  formatCost,
  getMembershipTierColor,
  getMembershipTierBgColor
} from '@/lib/vibe-assistant/allowance-client'
import { createClient } from '@/lib/supabase/client'
import { VISION_CATEGORIES } from '@/lib/design-system'

interface VisionData {
  id: string
  title: string
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  romance: string
  health: string
  money: string
  business: string
  social: string
  possessions: string
  giving: string
  spirituality: string
  conclusion: string
  status: string
  completion_percent: number
  version_number: number
  created_at: string
  updated_at: string
}

interface VibeAssistantAllowance {
  tokensRemaining: number
  tokensUsed: number
  monthlyLimit: number
  costLimit: number
  resetDate: string
  tierName: string
}

interface Blueprint {
  id: string
  title: string
  description: string
  category: string
  status: string
  progress_percentage: number
  priority_level: string
  created_at: string
  updated_at: string
}

export default function ActualizationBlueprintsPage() {
  const router = useRouter()
  
  // State management
  const [visions, setVisions] = useState<VisionData[]>([])
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [allowance, setAllowance] = useState<VibeAssistantAllowance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [selectedVision, setSelectedVision] = useState<VisionData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Insufficient tokens dialog state
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [insufficientTokensData, setInsufficientTokensData] = useState<{
    tokensRemaining: number
    estimatedTokens?: number
    actionName?: string
  } | null>(null)
  
  // Text isolation state
  const [activeVisionText, setActiveVisionText] = useState('')
  const [isolatedText, setIsolatedText] = useState('')
  const [showIsolationField, setShowIsolationField] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Please log in to access this page')
          return
        }

        // Load visions
        const { data: visionsData, error: visionsError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (visionsError) {
          throw new Error('Failed to load visions')
        }

        setVisions(visionsData || [])

        // Load existing blueprints
        const { data: blueprintsData, error: blueprintsError } = await supabase
          .from('actualization_blueprints')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (blueprintsError) {
          console.error('Error loading blueprints:', blueprintsError)
          // Continue without blueprints for now
        } else {
          setBlueprints(blueprintsData || [])
        }

        // Load allowance
        const allowanceData = await checkVibeAssistantAllowance()
        setAllowance(allowanceData)
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Update active vision text when category changes
  useEffect(() => {
    if (selectedVision && selectedCategory) {
      const categoryText = selectedVision[selectedCategory as keyof VisionData] as string
      setActiveVisionText(categoryText || '')
      setIsolatedText('')
      setShowIsolationField(false)
    }
  }, [selectedCategory, selectedVision])

  // Handle blueprint generation
  const handleGenerateBlueprint = async () => {
    if (!selectedVision || !selectedCategory) {
      alert('Please select a vision and category to generate a blueprint')
      return
    }

    // Use isolated text if available, otherwise use full category content
    const categoryContent = selectedVision[selectedCategory as keyof VisionData] as string
    const contentToUse = isolatedText.trim() || categoryContent
    
    if (!contentToUse || contentToUse.trim().length === 0) {
      alert('This vision category is empty. Please select a category with content.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/vibe-assistant/generate-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visionId: selectedVision.id,
          category: selectedCategory,
          visionContent: contentToUse,
          priority: 'medium'
        })
      })

      const data = await response.json()

      if (!data.success) {
        if (data.error === 'Insufficient tokens remaining' || response.status === 402) {
          // Show beautiful insufficient tokens dialog
          setInsufficientTokensData({
            tokensRemaining: data.tokensRemaining || data.allowanceInfo?.tokensRemaining || 0,
            estimatedTokens: undefined, // We don't get this from the error
            actionName: 'generate blueprint'
          })
          setShowInsufficientTokens(true)
          setIsGenerating(false)
          return
        }
        throw new Error(data.error || 'Blueprint generation failed')
      }

      // Refresh blueprints list
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: blueprintsData } = await supabase
          .from('actualization_blueprints')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setBlueprints(blueprintsData || [])
      }

      // Update allowance
      if (data.allowanceInfo) {
        setAllowance(prev => prev ? {
          ...prev,
          tokensRemaining: data.allowanceInfo.tokensRemaining,
          monthlyLimit: data.allowanceInfo.monthlyLimit,
          tierName: data.allowanceInfo.tierName
        } : null)
      }

      alert(`Blueprint Generated Successfully!\n\nTitle: ${data.blueprint?.title}\n\nCheck your blueprints list below.`)
      console.log('Generated Blueprint:', data.blueprint)

    } catch (err) {
      console.error('Blueprint generation error:', err)
      alert(err instanceof Error ? err.message : 'Blueprint generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // Filter blueprints
  const filteredBlueprints = blueprints.filter(blueprint => {
    const matchesSearch = blueprint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blueprint.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || blueprint.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Sparkles className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const selectedCategoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)

  return (
    <>
      <PageLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-8 h-8 text-green-400" />
                <h1 className="text-3xl font-bold text-white">Actualization Blueprints</h1>
                <Badge variant="success" className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  AI-Powered
                </Badge>
              </div>
              <p className="text-neutral-400">
                Turn your visions into concrete action plans with AI-powered blueprints
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Allowance Display */}
          {allowance && (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getMembershipTierBgColor(allowance.tierName)}>
                      {allowance.tierName} Tier
                    </Badge>
                    <span className="text-sm text-neutral-400">
                      {formatTokens(allowance.tokensRemaining)} / {formatTokens(allowance.monthlyLimit)} tokens
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar 
                    value={(allowance.tokensUsed / allowance.monthlyLimit) * 100}
                    variant="primary"
                    showLabel={false}
                    className="w-32"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Blueprint Generator - Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                Generate New Blueprint
              </h3>
              
              {/* Vision Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Select Vision
                </label>
                <select
                  value={selectedVision?.id || ''}
                  onChange={(e) => {
                    const vision = visions.find(v => v.id === e.target.value)
                    setSelectedVision(vision || null)
                    setSelectedCategory('')
                  }}
                  className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                >
                  <option value="">Choose a vision...</option>
                  {visions.map((vision) => (
                    <option key={vision.id} value={vision.id}>
                      {vision.title} (v{vision.version_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              {selectedVision && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Category
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {VISION_CATEGORIES.map((category) => {
                      const IconComponent = category.icon
                      const categoryContent = selectedVision[category.key as keyof VisionData] as string
                      const hasContent = categoryContent && categoryContent.trim().length > 0
                      
                      return (
                        <button
                          key={category.key}
                          onClick={() => setSelectedCategory(category.key)}
                          disabled={!hasContent}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedCategory === category.key
                              ? 'border-green-500 bg-green-500/10 text-green-300'
                              : hasContent
                              ? 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 text-neutral-300'
                              : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{category.label}</div>
                              <div className="text-xs text-neutral-400 line-clamp-1">
                                {hasContent ? `${categoryContent.length} characters` : 'No content'}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Vision Text Display */}
              {activeVisionText && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-white">
                      Active Vision Text
                    </label>
                    <Button
                      onClick={() => setShowIsolationField(!showIsolationField)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Target className="w-4 h-4" />
                      {showIsolationField ? 'Hide' : 'Isolate'} Section
                    </Button>
                  </div>
                  
                  <div className="bg-neutral-800/50 border border-neutral-600 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {activeVisionText}
                    </p>
                  </div>
                  
                  <div className="text-xs text-neutral-500 mt-2">
                    {activeVisionText.length} characters
                  </div>
                </div>
              )}

              {/* Text Isolation Field */}
              {showIsolationField && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">
                    Isolated Text for Blueprint
                  </label>
                  <textarea
                    value={isolatedText}
                    onChange={(e) => setIsolatedText(e.target.value)}
                    placeholder="Select and copy the specific part of your vision you want to build a blueprint for..."
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white min-h-32 resize-y"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-neutral-500">
                      {isolatedText.length} characters
                    </div>
                    <Button
                      onClick={() => setIsolatedText(activeVisionText)}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      Use Full Text
                    </Button>
                  </div>
                </div>
              )}

              {/* Blueprint Content Summary */}
              {selectedVision && selectedCategory && (isolatedText.trim() || activeVisionText) && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Blueprint Content</span>
                  </div>
                  <div className="text-xs text-neutral-300">
                    {isolatedText.trim() ? (
                      <>
                        <span className="text-blue-400">Using isolated text:</span> {isolatedText.length} characters
                      </>
                    ) : (
                      <>
                        <span className="text-blue-400">Using full category:</span> {activeVisionText.length} characters
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {selectedVision && selectedCategory && (
                <Button
                  onClick={handleGenerateBlueprint}
                  disabled={isGenerating}
                  variant="primary"
                  className="w-full flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Spinner variant="primary" size="sm" />
                      Generating Blueprint...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Generate Blueprint
                    </>
                  )}
                </Button>
              )}

              {/* Selected Category Info */}
              {selectedCategoryInfo && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <selectedCategoryInfo.icon className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-300">{selectedCategoryInfo.label}</span>
                  </div>
                  <p className="text-sm text-neutral-300">{selectedCategoryInfo.description}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Blueprints List - Main Content */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <Input
                    type="text"
                    placeholder="Search blueprints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Blueprints Grid */}
            {filteredBlueprints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBlueprints.map((blueprint) => (
                  <Card key={blueprint.id} className="p-6 hover:border-green-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {blueprint.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="info" className="text-xs">
                            {blueprint.category}
                          </Badge>
                          <Badge 
                            variant={blueprint.status === 'completed' ? 'success' : 
                                    blueprint.status === 'active' ? 'info' : 'neutral'}
                            className="text-xs"
                          >
                            {blueprint.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-400 mb-1">
                          {blueprint.progress_percentage}% Complete
                        </div>
                        <ProgressBar 
                          value={blueprint.progress_percentage}
                          variant="primary"
                          showLabel={false}
                          className="w-16"
                        />
                      </div>
                    </div>
                    
                    <p className="text-neutral-300 text-sm mb-4 line-clamp-3">
                      {blueprint.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-500">
                        Created {new Date(blueprint.created_at).toLocaleDateString()}
                      </div>
                      <Link href={`/actualization-blueprints/${blueprint.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Rocket className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Blueprints Yet</h3>
                <p className="text-neutral-400 mb-6">
                  Generate your first actualization blueprint to turn your visions into action plans
                </p>
                <div className="text-sm text-neutral-500">
                  Select a vision and category on the left to get started
                </div>
              </Card>
            )}
          </div>
        </div>
      </PageLayout>

      {/* Insufficient Tokens Dialog */}
      <InsufficientTokensDialog
        isOpen={showInsufficientTokens}
        onClose={() => {
          setShowInsufficientTokens(false)
          setInsufficientTokensData(null)
        }}
        tokensRemaining={insufficientTokensData?.tokensRemaining || 0}
        estimatedTokens={insufficientTokensData?.estimatedTokens}
        actionName={insufficientTokensData?.actionName}
      />
    </>
  )
}
