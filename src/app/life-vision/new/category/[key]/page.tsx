'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge, AutoResizeTextarea } from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { deleteSavedRecording, getRecordingsForCategory } from '@/lib/storage/indexed-db-recording'

interface VIVAActionCardProps {
  stage: string
  className?: string
}

function VIVAActionCard({ stage, message, className = '' }: VIVAActionCardProps & { message?: string }) {
  const stageData: Record<string, { title: string; defaultDescription: string; icon: typeof Sparkles }> = {
    'evaluating': {
      title: 'Evaluating your input',
      defaultDescription: 'Understanding your vision...',
      icon: Sparkles
    },
    'profile': {
      title: 'Compiling profile information',
      defaultDescription: 'Gathering your background context...',
      icon: Sparkles
    },
    'assessment': {
      title: 'Compiling assessment data',
      defaultDescription: 'Analyzing your alignment insights...',
      icon: Sparkles
    },
    'reasoning': {
      title: 'Reasoning and synthesizing',
      defaultDescription: 'Weaving together your complete picture...',
      icon: Sparkles
    },
    'creating': {
      title: 'Creating your summary',
      defaultDescription: 'Crafting your personalized vision...',
      icon: Sparkles
    }
  }

  const data = stageData[stage] || stageData.evaluating
  const Icon = data.icon
  const description = message || data.defaultDescription

  return (
    <Card className={`${className} border-2 border-primary-500/50 bg-primary-500/10`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{data.title}</h3>
          <p className="text-sm text-neutral-400">{description}</p>
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
  const [editingSummary, setEditingSummary] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaMessage, setVivaMessage] = useState('')
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

  // Initialize editedSummary when aiSummary changes
  useEffect(() => {
    if (aiSummary && !editingSummary) {
      setEditedSummary(aiSummary)
    }
  }, [aiSummary])

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
        const savedTranscript = refinements.transcript || ''
        const savedSummary = refinements.ai_summary || ''
        
        // Populate both transcript and content with existing transcript
        setTranscript(savedTranscript)
        setContent(savedTranscript)
        setAiSummary(savedSummary)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    console.log('🎯 Category page: handleRecordingSaved called', { url, transcriptLength: transcript.length, type, updatedTextLength: updatedText.length })
    setTranscript(transcript)
    setContent(updatedText)
    console.log('✅ Category page: State updated with transcript and content')

    // Clear any saved recordings from IndexedDB for this category (successful upload means we don't need backups)
    try {
      const savedRecordings = await getRecordingsForCategory(categoryKey)
      for (const recording of savedRecordings) {
        await deleteSavedRecording(recording.id)
      }
      console.log('✅ Cleared IndexedDB backups after successful upload')
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
      // Non-critical, don't fail the save
    }
  }

  const handleProcessWithVIVA = async () => {
    // Use content if it exists (contains transcript + any manual edits), otherwise use transcript
    // Content will have the full text including any edits the user made
    const textToProcess = content.trim() || transcript.trim()
    if (!textToProcess) return

    setIsProcessing(true)
    setVivaStage('evaluating')
    setVivaMessage('')
    setError(null)

    try {
      const response = await fetch('/api/viva/category-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          transcript: textToProcess,
          categoryName: category.label
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('No response stream available')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
            continue // Skip empty lines or lines that don't start with 'data: '
          }

          try {
            // Extract JSON after 'data: '
            const jsonStr = trimmedLine.slice(6).trim()
            if (!jsonStr) continue // Skip if no JSON data
            
            const data = JSON.parse(jsonStr)
            
            if (data.type === 'progress') {
              setVivaStage(data.stage)
              setVivaMessage(data.message)
            } else if (data.type === 'complete') {
              if (data.summary) {
                // Save to refinements table first
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  // Update existing refinement or create new one
                  const { data: existing } = await supabase
                    .from('refinements')
                    .select('id')
                    .eq('category', categoryKey)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                  if (existing?.id) {
                    await supabase
                      .from('refinements')
                      .update({
                        transcript: textToProcess,
                        ai_summary: data.summary
                      })
                      .eq('id', existing.id)
                  } else {
                    await supabase.from('refinements').insert({
                      user_id: user.id,
                      category: categoryKey,
                      transcript: textToProcess,
                      ai_summary: data.summary
                    })
                  }
                }
                // Set summary first, then clear processing state to avoid blank screen
                setAiSummary(data.summary)
                setVivaStage('')
                setVivaMessage('')
                setIsProcessing(false)
              }
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (parseError) {
            console.error('Error parsing stream data:', parseError, 'Line:', trimmedLine)
            // Continue processing other lines even if one fails
          }
        }
      }
    } catch (err) {
      console.error('Error processing with VIVA:', err)
      setError(err instanceof Error ? err.message : 'Failed to process')
      setVivaStage('')
      setVivaMessage('')
      setIsProcessing(false)
    }
  }

  const handleEditSummary = () => {
    setEditedSummary(aiSummary)
    setEditingSummary(true)
  }

  const handleSaveEditedSummary = async () => {
    setAiSummary(editedSummary)
    setEditingSummary(false)
    
    // Save edited summary to database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase
        .from('refinements')
        .select('id')
        .eq('category', categoryKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        await supabase
          .from('refinements')
          .update({ ai_summary: editedSummary })
          .eq('id', existing.id)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingSummary(false)
    setEditedSummary('')
  }

  const handleAddToTranscript = () => {
    // Add the summary to the original transcript so user can add more
    // Use transcript as base since that's what was originally processed
    const originalTranscript = transcript.trim() || content.trim()
    const newContent = originalTranscript 
      ? `${originalTranscript}\n\n--- Additional Reflection ---\n\n${aiSummary}`
      : aiSummary
    setContent(newContent)
    setTranscript('') // Clear transcript so it doesn't conflict
    setAiSummary('') // Clear summary to return to input mode
    setEditingSummary(false) // Make sure we're not in edit mode
    setEditedSummary('')
  }

  const handleSaveAndContinue = async () => {
    // Summary is already saved, just continue
    if (nextCategory) {
      router.push(`/life-vision/new/category/${nextCategory.key}`)
    } else {
      // All categories complete - go to assembly
      router.push('/life-vision/new/assembly')
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

      {/* Prompt Guidance Card */}
      {!aiSummary && (
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
      )}

      {/* Recording/Input Card */}
      {!aiSummary && (
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
              category={categoryKey}
              onRecordingSaved={handleRecordingSaved}
            />

            {/* Submit Button - Shows when there's content */}
            {(content.trim() || transcript.trim()) && !isProcessing && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleProcessWithVIVA}
                  disabled={!content.trim() && !transcript.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process with VIVA
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* VIVA Processing State */}
      {isProcessing && vivaStage && (
        <VIVAActionCard stage={vivaStage} message={vivaMessage} className="mb-8" />
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

            {editingSummary ? (
              <div className="space-y-4 mb-6">
                <AutoResizeTextarea
                  value={editedSummary}
                  onChange={(value) => setEditedSummary(value)}
                  minHeight={200}
                  className="w-full"
                />
                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSaveEditedSummary}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="prose prose-invert max-w-none mb-6">
                  <div className="bg-neutral-800 rounded-lg p-6">
                    <div 
                      className="text-neutral-200 whitespace-pre-wrap"
                    >
                      {aiSummary}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleEditSummary}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Edit this summary
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleAddToTranscript}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Add to my transcript
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveAndContinue}
                    className="w-full md:w-auto md:flex-1"
                  >
                    Save and Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
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
