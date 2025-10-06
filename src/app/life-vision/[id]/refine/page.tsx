'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  ArrowRight, 
  Save, 
  Settings, 
  Zap, 
  Clock, 
  DollarSign,
  TrendingUp,
  Target,
  Palette,
  Volume2
} from 'lucide-react'
import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge, 
  ProgressBar, 
  Spinner,
  Input,
  Textarea
} from '@/lib/design-system'
import { 
  checkVibeAssistantAllowance,
  estimateTokens,
  calculateCost,
  formatCost,
  formatTokens,
  TONALITY_OPTIONS,
  EMOTIONAL_INTENSITY,
  VIBE_ASSISTANT_OPERATIONS
} from '@/lib/vibe-assistant/allowance'

// Vision categories for refinement
const VISION_CATEGORIES = [
  { key: 'forward', label: 'Forward', icon: '✨', description: 'Opening intention and energy' },
  { key: 'fun', label: 'Fun / Recreation', icon: '🎉', description: 'Joyful activities and hobbies' },
  { key: 'travel', label: 'Variety / Travel', icon: '✈️', description: 'Exploration and adventures' },
  { key: 'home', label: 'Home / Environment', icon: '🏡', description: 'Living space and atmosphere' },
  { key: 'family', label: 'Family / Parenting', icon: '👨‍👩‍👧‍👦', description: 'Family relationships' },
  { key: 'romance', label: 'Love / Romance', icon: '💕', description: 'Romantic relationships' },
  { key: 'health', label: 'Health / Vitality', icon: '💪', description: 'Physical and mental wellness' },
  { key: 'money', label: 'Money / Wealth', icon: '💰', description: 'Financial goals and strategies' },
  { key: 'business', label: 'Business / Career', icon: '💼', description: 'Professional aspirations' },
  { key: 'social', label: 'Social / Friends', icon: '👥', description: 'Social connections' },
  { key: 'possessions', label: 'Things / Belongings', icon: '📦', description: 'Material possessions' },
  { key: 'giving', label: 'Giving / Contribution', icon: '🎁', description: 'Contribution and legacy' },
  { key: 'spirituality', label: 'Spirituality / Expansion', icon: '🌟', description: 'Growth and development' },
  { key: 'conclusion', label: 'Conclusion', icon: '✅', description: 'Closing commitments' }
]

interface VisionData {
  id: string
  user_id: string
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
  status: 'draft' | 'complete' | string
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

export default function VisionRefinementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  
  // State management
  const [vision, setVision] = useState<VisionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allowance, setAllowance] = useState<VibeAssistantAllowance | null>(null)
  
  // Refinement state
  const [selectedCategory, setSelectedCategory] = useState('forward')
  const [activeVision, setActiveVision] = useState('')
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [instructions, setInstructions] = useState('')
  const [refinedText, setRefinedText] = useState('')
  
  // Refinement settings
  const [refinementPercentage, setRefinementPercentage] = useState(50)
  const [tonality, setTonality] = useState(TONALITY_OPTIONS.BALANCED)
  const [wordCount, setWordCount] = useState<number | undefined>(undefined)
  const [emotionalIntensity, setEmotionalIntensity] = useState(EMOTIONAL_INTENSITY.MODERATE)
  
  // UI state
  const [isRefining, setIsRefining] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [lastUsage, setLastUsage] = useState<any>(null)

  // Load vision data
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/profile`)
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const profileData = await response.json()
        
        // For now, we'll simulate loading a vision
        // In a real implementation, you'd fetch the specific vision by ID
        setVision({
          id: resolvedParams.id,
          user_id: 'current-user',
          title: 'My Life Vision',
          forward: 'I am creating a life filled with purpose, joy, and meaningful connections.',
          fun: 'I enjoy hiking, reading, and spending time with friends.',
          travel: 'I want to explore Europe and Southeast Asia.',
          home: 'I live in a cozy apartment with lots of plants.',
          family: 'I have a close relationship with my parents and siblings.',
          romance: 'I am in a loving, supportive relationship.',
          health: 'I maintain my physical and mental well-being through exercise and meditation.',
          money: 'I have financial security and invest wisely.',
          business: 'I work in a fulfilling career that aligns with my values.',
          social: 'I have a strong network of supportive friends.',
          possessions: 'I own things that bring me joy and serve a purpose.',
          giving: 'I contribute to causes I care about.',
          spirituality: 'I continue to grow and develop spiritually.',
          conclusion: 'I am grateful for this beautiful life I am creating.',
          status: 'draft',
          completion_percent: 75,
          version_number: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        // Load allowance info
        const allowanceData = await checkVibeAssistantAllowance()
        setAllowance(allowanceData)
        
        // Set initial active vision text
        setActiveVision('I am creating a life filled with purpose, joy, and meaningful connections.')
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load vision data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params])

  // Update active vision when category changes
  useEffect(() => {
    if (vision && selectedCategory) {
      const categoryText = vision[selectedCategory as keyof VisionData] as string
      setActiveVision(categoryText || '')
      setCurrentRefinement('')
      setRefinedText('')
    }
  }, [selectedCategory, vision])

  // Calculate token estimate
  const tokenEstimate = React.useMemo(() => {
    if (!activeVision || !currentRefinement || !instructions) return null
    
    const fullText = `${activeVision}\n\n${currentRefinement}\n\n${instructions}`
    return estimateTokens(fullText)
  }, [activeVision, currentRefinement, instructions])

  // Handle Vibe Assistant refinement
  const handleRefinement = async () => {
    if (!vision || !activeVision || !currentRefinement || !instructions) {
      alert('Please fill in all required fields')
      return
    }

    setIsRefining(true)
    try {
      const response = await fetch('/api/vibe-assistant/refine-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visionId: vision.id,
          category: selectedCategory,
          activeVision,
          currentRefinement,
          instructions,
          refinementPercentage,
          tonality,
          wordCount,
          emotionalIntensity
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Refinement failed')
      }

      setRefinedText(data.refinedText)
      setLastUsage(data.usage)
      
      // Update allowance
      if (data.allowanceInfo) {
        setAllowance(prev => prev ? {
          ...prev,
          tokensRemaining: data.allowanceInfo.tokensRemaining,
          monthlyLimit: data.allowanceInfo.monthlyLimit,
          tierName: data.allowanceInfo.tierName
        } : null)
      }

    } catch (err) {
      console.error('Refinement error:', err)
      alert(err instanceof Error ? err.message : 'Refinement failed')
    } finally {
      setIsRefining(false)
    }
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  // Push text between fields
  const pushVibeToCurrent = () => {
    setCurrentRefinement(refinedText)
  }

  const pushCurrentToActive = () => {
    setActiveVision(currentRefinement)
  }

  // Save new version (placeholder)
  const saveNewVersion = () => {
    alert('Save new version functionality would be implemented here')
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

  if (error || !vision) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Sparkles className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vision Error</h2>
              <p className="text-neutral-400 mb-6">{error || 'Vision not found'}</p>
              <Button onClick={() => router.back()} variant="primary">
                Go Back
              </Button>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  const selectedCategoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)

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
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Vibe Assistant Refinement</h1>
                <Badge variant="premium" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  GPT-5 Powered
                </Badge>
              </div>
              <p className="text-neutral-400">
                Refine your vision with AI-powered conscious creation guidance
              </p>
            </div>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Allowance Display */}
          {allowance && (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{allowance.tierName} Tier</Badge>
                    <span className="text-sm text-neutral-400">
                      {formatTokens(allowance.tokensRemaining)} / {formatTokens(allowance.monthlyLimit)} tokens
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <DollarSign className="w-4 h-4" />
                    <span>${allowance.costLimit.toFixed(2)} limit</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar 
                    value={(allowance.tokensUsed / allowance.monthlyLimit) * 100}
                    variant="primary"
                    showLabel={false}
                    className="w-32"
                  />
                  {tokenEstimate && (
                    <div className="text-sm text-neutral-400">
                      Est. {formatTokens(tokenEstimate.estimatedTokens)} tokens ({formatCost(tokenEstimate.estimatedCost)})
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Selector */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Vision Categories
              </h3>
              <div className="space-y-2">
                {VISION_CATEGORIES.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedCategory === category.key
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-neutral-400">{category.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Refinement Interface */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Vision (Read-only) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-green-400">📖</span>
                  Active Vision
                </h3>
                <Button
                  onClick={() => copyToClipboard(activeVision)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={activeVision}
                onChange={() => {}} // Read-only
                placeholder="Select a category to view the active vision..."
                rows={4}
                className="bg-neutral-800/50 border-neutral-600"
                readOnly
              />
            </Card>

            {/* Current Refinement (Editable) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-blue-400">✏️</span>
                  My Current Refinement
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentRefinement(activeVision)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={() => pushCurrentToActive()}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Save as New Version
                  </Button>
                </div>
              </div>
              <Textarea
                value={currentRefinement}
                onChange={(e) => setCurrentRefinement(e.target.value)}
                placeholder="Write your current refinement of this vision section..."
                rows={6}
              />
            </Card>

            {/* Vibe Assistant Instructions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-purple-400">🤖</span>
                  Vibe Assistant Instructions
                </h3>
                <Button
                  onClick={handleRefinement}
                  disabled={isRefining || !currentRefinement || !instructions}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {isRefining ? (
                    <>
                      <Spinner variant="primary" size="sm" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Refinement
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Tell the Vibe Assistant how you'd like to refine this section. Be specific about the tone, focus areas, or particular aspects you want enhanced..."
                rows={4}
              />
            </Card>

            {/* Vibe Assistant Refinement (AI Output) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-purple-400">✨</span>
                  Vibe Assistant Refinement
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyToClipboard(refinedText)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={!refinedText}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={pushVibeToCurrent}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={!refinedText}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Push to Current
                  </Button>
                </div>
              </div>
              {refinedText ? (
                <Textarea
                  value={refinedText}
                  onChange={() => {}} // Read-only
                  rows={6}
                  className="bg-purple-900/20 border-purple-500/50"
                  readOnly
                />
              ) : (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 text-center">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    Generate a Vibe Assistant refinement to see AI-powered enhancements here
                  </p>
                </div>
              )}
            </Card>

            {/* Usage Stats */}
            {lastUsage && (
              <Card className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Zap className="w-4 h-4" />
                      <span>{formatTokens(lastUsage.totalTokens)} tokens used</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCost(lastUsage.costUsd)} cost</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Clock className="w-4 h-4" />
                      <span>{lastUsage.processingTimeMs}ms</span>
                    </div>
                  </div>
                  <div className="text-neutral-400">
                    {formatTokens(lastUsage.remainingTokens)} tokens remaining
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-500" />
              Refinement Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Refinement Percentage */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Refinement Level
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={refinementPercentage}
                    onChange={(e) => setRefinementPercentage(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-neutral-400 text-center">
                    {refinementPercentage}%
                  </div>
                </div>
              </div>

              {/* Tonality */}
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  Tonality
                </label>
                <select
                  value={tonality}
                  onChange={(e) => setTonality(e.target.value)}
                  className="w-full p-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                >
                  <option value={TONALITY_OPTIONS.ENCOURAGING}>Encouraging</option>
                  <option value={TONALITY_OPTIONS.CHALLENGING}>Challenging</option>
                  <option value={TONALITY_OPTIONS.BALANCED}>Balanced</option>
                  <option value={TONALITY_OPTIONS.CELEBRATORY}>Celebratory</option>
                </select>
              </div>

              {/* Emotional Intensity */}
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  Emotional Intensity
                </label>
                <select
                  value={emotionalIntensity}
                  onChange={(e) => setEmotionalIntensity(e.target.value)}
                  className="w-full p-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                >
                  <option value={EMOTIONAL_INTENSITY.GENTLE}>Gentle</option>
                  <option value={EMOTIONAL_INTENSITY.MODERATE}>Moderate</option>
                  <option value={EMOTIONAL_INTENSITY.INTENSE}>Intense</option>
                </select>
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Target Word Count (Optional)
                </label>
                <Input
                  type="number"
                  value={wordCount || ''}
                  onChange={(e) => setWordCount(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 200"
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        )}
      </Container>
    </PageLayout>
  )
}
