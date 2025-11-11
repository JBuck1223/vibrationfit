'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge, AutoResizeTextarea } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, ArrowLeft, Edit2, Save, X, RefreshCw, AlertCircle } from 'lucide-react'
import { getVisionCategory } from '@/lib/design-system/vision-categories'

interface BeingDoingReceivingLoop {
  being: string
  doing: string
  receiving: string
  essence?: string
}

function VIVAActionCard({ stage, className = '' }: { stage: string; className?: string }) {
  const stageData = {
    'generating': {
      title: 'Generating Being/Doing/Receiving loops',
      description: 'Creating your identity, action, and manifestation cycles...',
      icon: Sparkles
    },
    'analyzing': {
      title: 'Analyzing your ideal state',
      description: 'Understanding your vision patterns...',
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

export default function BlueprintPage() {
  const router = useRouter()
  const params = useParams()
  const categoryKey = params.key as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loops, setLoops] = useState<BeingDoingReceivingLoop[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedLoop, setEditedLoop] = useState<BeingDoingReceivingLoop | null>(null)

  const category = getVisionCategory(categoryKey)
  const IconComponent = category?.icon

  useEffect(() => {
    loadBlueprintData()
  }, [categoryKey])

  const loadBlueprintData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Try to load existing blueprint
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('blueprint_data')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .maybeSingle()

      if (categoryState?.blueprint_data?.loops) {
        setLoops(categoryState.blueprint_data.loops)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading blueprint:', err)
      setError('Failed to load blueprint data')
      setLoading(false)
    }
  }

  const handleGenerateBlueprint = async () => {
    setIsProcessing(true)
    setVivaStage('analyzing')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get ideal state and other context
      const { data: categoryState } = await supabase
        .from('life_vision_category_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryKey)
        .single()

      if (!categoryState?.ideal_state) {
        setError('Please complete the Ideal State step first')
        setIsProcessing(false)
        return
      }

      // Get profile and assessment
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setVivaStage('generating')

      // Call blueprint API
      const response = await fetch('/api/viva/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey,
          categoryName: category?.label || categoryKey,
          idealState: categoryState.ideal_state,
          currentClarity: categoryState.ai_summary || '',
          flippedContrast: '', // Optional
          profile,
          assessment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate blueprint')
      }

      const data = await response.json()

      if (data.blueprint?.loops) {
        setLoops(data.blueprint.loops)
      }

      setVivaStage('')
    } catch (err) {
      console.error('Error generating blueprint:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate blueprint')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditLoop = (index: number) => {
    setEditingIndex(index)
    setEditedLoop({ ...loops[index] })
  }

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editedLoop) return

    const updatedLoops = [...loops]
    updatedLoops[editingIndex] = editedLoop

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Save to database
      const { error: updateError } = await supabase
        .from('life_vision_category_state')
        .upsert({
          user_id: user.id,
          category: categoryKey,
          blueprint_data: { loops: updatedLoops }
        }, {
          onConflict: 'user_id,category'
        })

      if (updateError) throw updateError

      setLoops(updatedLoops)
      setEditingIndex(null)
      setEditedLoop(null)
    } catch (err) {
      console.error('Error saving loop:', err)
      setError('Failed to save changes')
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditedLoop(null)
  }

  const handleContinueToScenes = () => {
    router.push(`/life-vision/new/category/${categoryKey}/scenes`)
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
              {category?.label} Blueprint
            </h1>
            <p className="text-xs md:text-sm text-neutral-400">Being / Doing / Receiving Loops</p>
          </div>
        </div>

        <div className="p-3 md:p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
            <strong className="text-primary-500">Blueprint Loops</strong> connect your identity (Being), actions (Doing), and manifestations (Receiving) into powerful cycles of conscious creation.
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

      {/* Generate Blueprint (if none exists) */}
      {loops.length === 0 && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary-500" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3">
              Generate Your Blueprint
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create Being/Doing/Receiving loops based on your ideal state, connecting identity, action, and manifestation.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateBlueprint}
              className="w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Blueprint
            </Button>
          </div>
        </Card>
      )}

      {/* Blueprint Loops Display */}
      {loops.length > 0 && !isProcessing && (
        <>
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <Badge variant="success" className="text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {loops.length} Loop{loops.length !== 1 ? 's' : ''} Created
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateBlueprint}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            {loops.map((loop, index) => (
              <Card key={index} className="p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold text-white">
                    Loop {index + 1}
                    {loop.essence && (
                      <span className="ml-3 text-sm font-normal text-primary-500">
                        Essence: {loop.essence}
                      </span>
                    )}
                  </h3>
                  {editingIndex !== index && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLoop(index)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {editingIndex === index && editedLoop ? (
                  /* Edit Mode */
                  <div className="space-y-4 md:space-y-6">
                    {/* Being */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                        Being (Identity & Feeling)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.being}
                        onChange={(value) => setEditedLoop({ ...editedLoop, being: value })}
                        placeholder="Who you are being..."
                        className="w-full bg-neutral-800 border-2 border-[#00FFFF]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Doing */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                        Doing (Actions & Rhythms)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.doing}
                        onChange={(value) => setEditedLoop({ ...editedLoop, doing: value })}
                        placeholder="What you are doing..."
                        className="w-full bg-neutral-800 border-2 border-[#14B8A6]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Receiving */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                        Receiving (Evidence & Support)
                      </label>
                      <AutoResizeTextarea
                        value={editedLoop.receiving}
                        onChange={(value) => setEditedLoop({ ...editedLoop, receiving: value })}
                        placeholder="What you are receiving..."
                        className="w-full bg-neutral-800 border-2 border-[#8B5CF6]/30 text-white text-sm md:text-base"
                        minHeight={80}
                      />
                    </div>

                    {/* Essence */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-[#FFB701] mb-2 uppercase tracking-wide">
                        Essence (Optional)
                      </label>
                      <input
                        type="text"
                        value={editedLoop.essence || ''}
                        onChange={(e) => setEditedLoop({ ...editedLoop, essence: e.target.value })}
                        placeholder="One-word essence..."
                        className="w-full bg-neutral-800 border-2 border-[#FFB701]/30 text-white text-sm md:text-base px-4 py-2 rounded-lg"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4 md:space-y-6">
                    {/* Being */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#00FFFF] mb-2 uppercase tracking-wide">
                        Being
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.being}
                      </p>
                    </div>

                    {/* Doing */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#14B8A6] mb-2 uppercase tracking-wide">
                        Doing
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.doing}
                      </p>
                    </div>

                    {/* Receiving */}
                    <div>
                      <h4 className="text-xs md:text-sm font-semibold text-[#8B5CF6] mb-2 uppercase tracking-wide">
                        Receiving
                      </h4>
                      <p className="text-sm md:text-base text-neutral-200 leading-relaxed bg-neutral-800/50 p-3 md:p-4 rounded-lg">
                        {loop.receiving}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateBlueprint}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate All
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueToScenes}
                className="flex-1"
              >
                Continue to Scenes
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </>
      )}
    </Container>
  )
}

