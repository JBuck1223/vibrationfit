'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, ArrowLeft, Eye, RefreshCw, AlertCircle, Video } from 'lucide-react'
import { getVisionCategory, VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface Scene {
  id: string
  title: string
  text: string
  essence_word: string | null
  created_at: string
}

function VIVAActionCard({ stage, className = '' }: { stage: string; className?: string }) {
  const stageData = {
    'generating': {
      title: 'Generating visualization scenes',
      description: 'Creating cinematic moments with Micro-Macro breathing...',
      icon: Video
    },
    'analyzing': {
      title: 'Analyzing your vision data',
      description: 'Understanding your desires and richness...',
      icon: Sparkles
    }
  }

  const data = stageData[stage as keyof typeof stageData] || stageData.generating
  const Icon = data.icon

  return (
    <Card className={`${className} border-2 border-primary-500/50 bg-primary-500/10 p-4 md:p-6`}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white mb-1">{data.title}</h3>
          <p className="text-xs md:text-sm text-neutral-400">{data.description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function ScenesPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expandedScene, setExpandedScene] = useState<string | null>(null)

  const category = getVisionCategory(categoryKey)
  const IconComponent = category?.icon

  // Get next category for navigation
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null

  useEffect(() => {
    loadScenes()
  }, [categoryKey])

  const loadScenes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Load existing scenes for this category
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .order('created_at', { ascending: true })

      if (existingScenes && existingScenes.length > 0) {
        setScenes(existingScenes)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading scenes:', err)
      setError('Failed to load scenes')
      setLoading(false)
    }
  }

  const handleGenerateScenes = async () => {
    setIsProcessing(true)
    setVivaStage('analyzing')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get all category data
      const { data: refinement } = await supabase
        .from('refinements')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      // Get profile data for this category
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      // Get assessment data for this category
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*, assessment_responses(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Extract category-specific data
      const categoryResponses = assessment?.assessment_responses?.filter((r: any) => r.category === categoryKey) || []
      
      // Map category to profile story field
      const storyField = `${categoryKey}_story`
      const profileStory = profile?.[storyField] || ''

      setVivaStage('generating')

      // Call scenes generation API
      const response = await fetch('/api/vibration/scenes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          category: categoryKey,
          profileGoesWellText: profileStory,
          profileNotWellTextFlipped: refinement?.flipped_contrast || '',
          assessmentSnippets: categoryResponses.map((r: any) => r.response_text),
          existingVisionParagraph: refinement?.ai_summary || '',
          dataRichnessTier: 'B' // Will be calculated by API
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate scenes')
      }

      const data = await response.json()

      // Reload scenes from database
      await loadScenes()

      setVivaStage('')
    } catch (err) {
      console.error('Error generating scenes:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate scenes')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompleteCategory = () => {
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
    }
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" variant="primary" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 md:gap-4 mb-4">
          {category && IconComponent && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 border-[#00FFFF]">
              <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-[#00FFFF]" />
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
              {category?.label} Scenes
            </h1>
            <p className="text-xs md:text-sm text-neutral-400">Creative Visualization Scenes</p>
          </div>
        </div>

        <div className="p-3 md:p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-lg">
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
            <strong className="text-accent-purple">V3 Scene Generation:</strong> Scenes are dynamically created (1-8 based on your input richness) with 140-220 words each, using Micro-Macro paragraph breathing for depth and immersion.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-red-500 mb-1">Error</h3>
              <p className="text-sm text-neutral-300">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Processing State */}
      {isProcessing && vivaStage && (
        <VIVAActionCard stage={vivaStage} className="mb-6 md:mb-8" />
      )}

      {/* Generate Scenes (if none exist) */}
      {scenes.length === 0 && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Video className="w-8 h-8 md:w-10 md:h-10 text-accent-purple" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3">
              Generate Visualization Scenes
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create cinematic scenes that bring your {category?.label.toLowerCase()} vision to life with vivid sensory details and emotional depth.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateScenes}
              className="w-full md:w-auto"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Scenes
            </Button>
          </div>
        </Card>
      )}

      {/* Scenes Display */}
      {scenes.length > 0 && !isProcessing && (
        <>
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <Badge variant="success" className="text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {scenes.length} Scene{scenes.length !== 1 ? 's' : ''} Created
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateScenes}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {scenes.map((scene, index) => {
              const wordCount = getWordCount(scene.text)
              const isExpanded = expandedScene === scene.id

              return (
                <Card 
                  key={scene.id} 
                  className="p-4 md:p-6 border-2 border-accent-purple/30 bg-accent-purple/5 hover:border-accent-purple/50 transition-colors"
                >
                  <div className="space-y-3 md:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="neutral" className="text-xs bg-accent-purple/20 text-accent-purple">
                            Scene {index + 1}
                          </Badge>
                          <Badge variant="neutral" className="text-xs text-neutral-400">
                            {wordCount} words
                          </Badge>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-white">
                          {scene.title}
                        </h3>
                      </div>
                    </div>

                    {/* Scene Text */}
                    <div className={`text-sm md:text-base text-neutral-200 leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}>
                      {scene.text}
                    </div>

                    {/* Essence Word */}
                    {scene.essence_word && (
                      <div className="flex items-center gap-2 pt-2 border-t border-accent-purple/20">
                        <span className="text-xs md:text-sm text-neutral-400">Essence:</span>
                        <Badge variant="neutral" className="bg-accent-purple/20 text-accent-purple text-xs md:text-sm">
                          {scene.essence_word}
                        </Badge>
                      </div>
                    )}

                    {/* Expand/Collapse */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                      className="w-full text-xs md:text-sm"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      {isExpanded ? 'Show Less' : 'Read Full Scene'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Info Card about Scene Count */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm md:text-base font-semibold text-white mb-2">
                  Dynamic Scene Count
                </h4>
                <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                  You have <strong className="text-primary-500">{scenes.length} scenes</strong> because VIVA detected{' '}
                  <strong>{scenes.length === 1 ? '1 distinct desire' : `${scenes.length} distinct desires`}</strong> in your input for this category. 
                  More detail = more scenes (1-8). Each scene is 140-220 words with Micro-Macro breathing.
                </p>
              </div>
            </div>
          </Card>

          {/* Continue Button */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScenes}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate All Scenes
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCompleteCategory}
                className="flex-1"
              >
                {nextCategory ? `Continue to ${nextCategory.label}` : 'Complete All Categories'}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </>
      )}
    </Container>
  )
}

