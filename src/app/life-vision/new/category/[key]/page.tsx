'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'

interface VIVAActionCardProps {
  stage: string
  className?: string
}

function VIVAActionCard({ stage, className = '' }: VIVAActionCardProps) {
  const stageData = {
    'gathering': {
      title: 'Gathering your energy',
      description: 'VIVA is collecting your profile and assessment data...',
      icon: Sparkles
    },
    'processing': {
      title: 'Processing your words',
      description: 'Transforming your reflection into vibrational alignment...',
      icon: Sparkles
    },
    'crafting': {
      title: 'Crafting your summary',
      description: 'Weaving your authentic voice into a resonant narrative...',
      icon: Sparkles
    }
  }

  const data = stageData[stage as keyof typeof stageData] || stageData.processing
  const Icon = data.icon

  return (
    <Card className={`${className} border-2 border-primary-500/50 bg-primary-500/10`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{data.title}</h3>
          <p className="text-sm text-neutral-400">{data.description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [content, setContent] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const category = getVisionCategory(categoryKey)
  if (!category) {
    return <div>Invalid category</div>
  }

  const IconComponent = category.icon

  // Get all categories excluding forward and conclusion
  const allCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
  const currentIndex = allCategories.findIndex(c => c.key === categoryKey)
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null

  useEffect(() => {
    loadExistingData()
  }, [categoryKey])

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check for existing transcript and summary in refinements table
      const { data: refinements } = await supabase
        .from('refinements')
        .select('*')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (refinements) {
        setTranscript(refinements.transcript || '')
        setAiSummary(refinements.ai_summary || '')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    setTranscript(transcript)
    setContent(updatedText)
  }

  const handleTranscriptComplete = (transcriptText: string) => {
    setTranscript(transcriptText)
  }

  const handleProcessWithVIVA = async () => {
    if (!transcript) return

    setIsProcessing(true)
    setVivaStage('gathering')
    setError(null)

    try {
      // Cycle through VIVA stages for visual feedback
      setTimeout(() => setVivaStage('processing'), 1000)
      setTimeout(() => setVivaStage('crafting'), 2000)

      const response = await fetch('/api/viva/category-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          transcript: transcript,
          categoryName: category.label
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()

      if (data.summary) {
        setAiSummary(data.summary)
        
        // Save to refinements table
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('refinements').insert({
            user_id: user.id,
            category: categoryKey,
            transcript: transcript,
            ai_summary: data.summary
          })
        }
      }

      setVivaStage('')
    } catch (err) {
      console.error('Error processing with VIVA:', err)
      setError(err instanceof Error ? err.message : 'Failed to process')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinue = () => {
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-400">
            Category {currentIndex + 1} of {allCategories.length}
          </span>
          <Badge variant="info">{Math.round(((currentIndex + 1) / allCategories.length) * 100)}%</Badge>
        </div>
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / allCategories.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          {prevCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/life-vision/new/category/${prevCategory.key}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-[#00FFFF]">
              <IconComponent className="w-8 h-8 text-[#00FFFF]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{category.label}</h1>
              <p className="text-neutral-400">{category.description}</p>
            </div>
          </div>
          {nextCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/life-vision/new/category/${nextCategory.key}`)}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Recording Section */}
      {!transcript && !aiSummary && (
        <>
          {/* Prompt Guidance Card */}
          <Card className="mb-6 border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#00FFFF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#00FFFF] mb-2">Let's Get Clear...</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Explore what feels AMAZING and what feels BAD or frustrating. Contrast creates clarity!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What Feels Amazing */}
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-[#39FF14] mb-2 uppercase tracking-wide">
                    What Feels Amazing
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Imagine your ideal {category.label.toLowerCase()}. What do you love? How does it feel?
                  </p>
                </div>

                {/* What Feels Bad or Missing */}
                <div className="bg-[#FFB701]/10 border border-[#FFB701]/30 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-[#FFB701] mb-2 uppercase tracking-wide">
                    What Feels Bad or Missing
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    What's frustrating? What's not working? Don't hold back—vent it out!
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recording Card */}
          <Card className="mb-8">
            <div>
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Share your vision for {category.label.toLowerCase()}
                </h2>
                <p className="text-neutral-400 text-sm">
                  Speak naturally about what you envision in this area of your life. 
                  Your authentic voice will be captured and transformed into a resonant summary by VIVA.
                </p>
              </div>

              <RecordingTextarea
                value={content}
                onChange={(value) => setContent(value)}
                rows={10}
                placeholder="Write about your vision or click the microphone/video icon to record!"
                allowVideo={true}
                storageFolder="lifeVision"
                onRecordingSaved={handleRecordingSaved}
              />
            </div>
          </Card>
        </>
      )}

      {/* Transcript Display */}
      {transcript && !aiSummary && !isProcessing && (
        <Card className="mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Your Recording</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTranscript('')}
              >
                Record Again
              </Button>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-neutral-300 whitespace-pre-wrap">{transcript}</p>
            </div>
            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleProcessWithVIVA}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Process with VIVA
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* VIVA Processing State */}
      {isProcessing && (
        <VIVAActionCard stage={vivaStage} className="mb-8" />
      )}

      {/* AI Summary Display */}
      {aiSummary && !isProcessing && (
        <Card className="mb-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Your {category.label} Summary</h3>
                <p className="text-sm text-neutral-400">Crafted by VIVA in your voice</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <div className="bg-neutral-800 rounded-lg p-6">
                <div 
                  className="text-neutral-200 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: aiSummary }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setTranscript('')
                  setAiSummary('')
                }}
              >
                Add More Details
              </Button>
              <Button
                variant="primary"
                onClick={handleContinue}
                className="w-full"
              >
                {nextCategory ? 'Continue' : 'Assemble Vision'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-8 border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </Card>
      )}
    </div>
  )
}
