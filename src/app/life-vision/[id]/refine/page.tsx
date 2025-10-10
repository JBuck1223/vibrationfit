'use client'

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
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
} from '@/lib/vibe-assistant/allowance-client'
import { createClient } from '@/lib/supabase/client'
import { VISION_CATEGORIES } from '@/lib/design-system'

// Use centralized vision categories for consistency

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
  const [vivaNotes, setVivaNotes] = useState('')
  
  // Refinement settings
  const [refinementPercentage, setRefinementPercentage] = useState(50)
  const [tonality, setTonality] = useState<string>(TONALITY_OPTIONS.BALANCED)
  const [wordCount, setWordCount] = useState<number | undefined>(undefined)
  const [emotionalIntensity, setEmotionalIntensity] = useState<string>(EMOTIONAL_INTENSITY.MODERATE)
  
  // UI state
  const [isRefining, setIsRefining] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showVivaNotes, setShowVivaNotes] = useState(false)
  const [lastUsage, setLastUsage] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load vision data
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params
        
        // Fetch the actual vision data from the database
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        console.log('Auth check:', { user: user?.id, authError })
        
        if (authError) {
          console.error('Auth error:', authError)
          setError(`Authentication error: ${authError.message}`)
          return
        }
        
        if (!user) {
          setError('Please log in to access this page')
          return
        }

        // Get the vision data
        const { data: visionData, error: visionError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single()

        if (visionError || !visionData) {
          setError('Vision not found or access denied')
          return
        }

        setVision(visionData)
        
        // Load allowance info
        const allowanceData = await checkVibeAssistantAllowance()
        setAllowance(allowanceData)
        
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
      
      // Load saved refinement for this category
      const savedRefinement = localStorage.getItem(`refinement-${vision.id}-${selectedCategory}`)
      setCurrentRefinement(savedRefinement || '')
      
      // Load saved instructions for this category
      const savedInstructions = localStorage.getItem(`instructions-${vision.id}-${selectedCategory}`)
      setInstructions(savedInstructions || '')
      
      setRefinedText('')
      setVivaNotes('')
    }
  }, [selectedCategory, vision])

  // Auto-save current refinement
  useEffect(() => {
    if (vision && selectedCategory && currentRefinement) {
      const saveKey = `refinement-${vision.id}-${selectedCategory}`
      localStorage.setItem(saveKey, currentRefinement)
      setLastSaved(new Date())
    }
  }, [currentRefinement, vision, selectedCategory])

  // Auto-save instructions
  useEffect(() => {
    if (vision && selectedCategory && instructions) {
      const saveKey = `instructions-${vision.id}-${selectedCategory}`
      localStorage.setItem(saveKey, instructions)
      setLastSaved(new Date())
    }
  }, [instructions, vision, selectedCategory])

  // Auto-resize textareas when content changes
  useEffect(() => {
    if (activeVisionRef.current) {
      autoResizeTextarea(activeVisionRef.current)
    }
  }, [activeVision])

  // Auto-resize on initial load after vision data is loaded
  useEffect(() => {
    if (vision && activeVision && activeVisionRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        autoResizeTextarea(activeVisionRef.current!)
      }, 100)
    }
  }, [vision, activeVision])

  // Force auto-resize when component mounts and vision data is available
  useLayoutEffect(() => {
    if (vision && activeVisionRef.current && activeVision) {
      // Immediate resize attempt
      autoResizeTextarea(activeVisionRef.current)
      
      // Additional attempts with small delays
      const resizeAttempts = [50, 100, 200, 500]
      resizeAttempts.forEach(delay => {
        setTimeout(() => {
          if (activeVisionRef.current) {
            autoResizeTextarea(activeVisionRef.current)
          }
        }, delay)
      })
    }
  }, [vision, activeVision])

  // Additional resize trigger when selectedCategory changes (for initial load)
  useLayoutEffect(() => {
    if (vision && activeVisionRef.current) {
      // Multiple resize attempts to catch the initial render
      const resizeAttempts = [0, 50, 100, 200, 500]
      resizeAttempts.forEach(delay => {
        setTimeout(() => {
          if (activeVisionRef.current) {
            autoResizeTextarea(activeVisionRef.current)
          }
        }, delay)
      })
    }
  }, [selectedCategory, vision])

  useEffect(() => {
    if (currentRefinementRef.current) {
      autoResizeTextarea(currentRefinementRef.current)
    }
  }, [currentRefinement])

  useEffect(() => {
    if (instructionsRef.current) {
      autoResizeTextarea(instructionsRef.current)
    }
  }, [instructions])

  useEffect(() => {
    if (refinedTextRef.current) {
      autoResizeTextarea(refinedTextRef.current)
    }
  }, [refinedText])

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
        if (data.error === 'Insufficient tokens remaining') {
          throw new Error(`Insufficient tokens remaining. You have ${data.allowanceInfo?.tokensRemaining || 0} tokens left, but need ${tokenEstimate?.estimatedTokens || 0} tokens for this refinement. Please upgrade your plan or wait for your monthly allowance to reset.`)
        }
        throw new Error(data.error || 'Refinement failed')
      }

      setRefinedText(data.refinedText)
      setVivaNotes(data.vivaNotes || '')
      setLastUsage(data.usage)
      
      // Auto-show VIVA Notes when they first appear
      if (data.vivaNotes) {
        setShowVivaNotes(true)
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

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  // Refs for textareas
  const activeVisionRef = useRef<HTMLTextAreaElement>(null)
  const currentRefinementRef = useRef<HTMLTextAreaElement>(null)
  const instructionsRef = useRef<HTMLTextAreaElement>(null)
  const refinedTextRef = useRef<HTMLTextAreaElement>(null)

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

  // Handle blueprint generation
  const handleGenerateBlueprint = async () => {
    if (!vision || !activeVision) {
      alert('Please select a category with vision content to generate a blueprint')
      return
    }

    try {
      const response = await fetch('/api/vibe-assistant/generate-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visionId: vision.id,
          category: selectedCategory,
          visionContent: activeVision,
          focusArea: instructions || undefined,
          priority: 'medium'
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Blueprint generation failed')
      }

      // For now, show the blueprint in an alert
      // Later this will open a dedicated blueprint page
      alert(`Blueprint Generated!\n\nTitle: ${data.blueprint?.title}\n\nCheck the console for full details.`)
      console.log('Generated Blueprint:', data.blueprint)

    } catch (err) {
      console.error('Blueprint generation error:', err)
      alert(err instanceof Error ? err.message : 'Blueprint generation failed')
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
                  VIVA Powered
                </Badge>
              </div>
              <p className="text-neutral-400">
                Refine your vision with VIVA's conscious creation guidance
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
          {/* Category Selector - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Vision Categories
              </h3>
              <div className="space-y-2">
                {VISION_CATEGORIES.map((category) => {
                  const IconComponent = category.icon
                  return (
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
                        <IconComponent className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs text-neutral-400 line-clamp-2">{category.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Main Refinement Interface */}
          <div className="lg:col-span-3">
            {/* Section Header - matching edit screen */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                {selectedCategoryInfo && (
                  <selectedCategoryInfo.icon className="w-12 h-12 text-primary-500" />
                )}
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {selectedCategoryInfo?.label}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm">
                    Refining your vision for {selectedCategoryInfo?.label.toLowerCase()}
                  </p>
                </div>
              </div>
              <p className="text-[#cbd5e1] text-lg leading-relaxed">
                {selectedCategoryInfo?.description}
              </p>
            </div>

            <div className="space-y-6">
            {/* Active Vision (Read-only) */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-green-400">📖</span>
                  Active Vision
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyToClipboard(activeVision)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300 transition-all duration-300"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => setCurrentRefinement(activeVision)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Copy to My Current Refinement
                  </Button>
                </div>
              </div>
              <Textarea
                key={`active-vision-${selectedCategory}-${activeVision.length}`}
                ref={activeVisionRef}
                value={activeVision}
                onChange={() => {}} // Read-only
                placeholder="Select a category to view the active vision..."
                className="bg-neutral-800/50 border-neutral-600 min-h-[100px]"
                readOnly
              />
            </Card>

            {/* Current Refinement (Editable) */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-blue-400">✏️</span>
                  My Current Refinement
                  {lastSaved && (
                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                      Auto-saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
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
                ref={currentRefinementRef}
                value={currentRefinement}
                onChange={(e) => setCurrentRefinement(e.target.value)}
                placeholder="Write your current refinement of this vision section..."
                className="min-h-[150px]"
              />
            </Card>

            {/* Vibe Assistant Instructions */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
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
                ref={instructionsRef}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Tell the Vibe Assistant how you'd like to refine this section. Be specific about the tone, focus areas, or particular aspects you want enhanced..."
                className="min-h-[100px]"
              />
            </Card>

            {/* Vibe Assistant Refinement (VIVA Output) */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
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
                  ref={refinedTextRef}
                  value={refinedText}
                  onChange={() => {}} // Read-only
                  className="bg-purple-900/20 border-purple-500/50 min-h-[150px]"
                  readOnly
                />
              ) : (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 text-center">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    Generate a Vibe Assistant refinement to see VIVA's enhancements here
                  </p>
                </div>
              )}
            </Card>

            {/* VIVA Notes Section */}
            {vivaNotes && (
              <Card className="p-6 border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-purple-400">🧠</span>
                    VIVA Notes
                    <Badge variant="premium" className="text-xs">
                      VIVA's Reasoning
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerateBlueprint}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-green-500/20 hover:border-green-500/30"
                    >
                      <span className="text-green-400">🏗️</span>
                      Generate Blueprint
                    </Button>
                    <Button
                      onClick={() => setShowVivaNotes(!showVivaNotes)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-purple-500/20 hover:border-purple-500/30"
                    >
                      {showVivaNotes ? 'Hide' : 'Show'} Reasoning
                    </Button>
                  </div>
                </div>
                {showVivaNotes && (
                  <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-purple-400 text-sm">✨</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">{vivaNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

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
