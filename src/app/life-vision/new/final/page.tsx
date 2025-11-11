'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, Download, Play, Image as ImageIcon, ArrowRight, AlertCircle } from 'lucide-react'

interface FinalAssemblyData {
  forward: string
  conclusion: string
  activationMessage: string
  harmonizationNotes?: string[]
}

function VIVAActionCard({ stage, className = '' }: { stage: string; className?: string }) {
  const stageData = {
    'generating': {
      title: 'Generating forward and conclusion',
      description: 'Creating your vision\'s opening and closing sections...',
      icon: Sparkles
    },
    'activation': {
      title: 'Crafting activation message',
      description: 'Preparing your personalized next steps...',
      icon: Sparkles
    },
    'finalizing': {
      title: 'Finalizing your vision',
      description: 'Polishing everything for activation...',
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

export default function FinalPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [finalData, setFinalData] = useState<FinalAssemblyData | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [visionPreview, setVisionPreview] = useState<any>(null)
  const [scenesCount, setScenesCount] = useState(0)

  useEffect(() => {
    loadVisionData()
  }, [])

  const loadVisionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to continue')
        setLoading(false)
        return
      }

      // Get latest vision
      const { data: latestVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!latestVision) {
        setError('No vision found. Please complete the assembly step first.')
        setLoading(false)
        return
      }

      setVisionId(latestVision.id)
      setVisionPreview(latestVision)

      // Count total scenes
      const { count } = await supabase
        .from('scenes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setScenesCount(count || 0)

      // Check if forward/conclusion/activation already exist
      if (latestVision.forward && latestVision.conclusion && latestVision.activation_message) {
        setFinalData({
          forward: latestVision.forward,
          conclusion: latestVision.conclusion,
          activationMessage: latestVision.activation_message
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading vision data:', err)
      setError('Failed to load vision data')
      setLoading(false)
    }
  }

  const handleGenerateFinal = async () => {
    if (!visionId) return

    setIsProcessing(true)
    setVivaStage('generating')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get profile and assessment for context
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get all categories completed
      const { data: refinements } = await supabase
        .from('refinements')
        .select('category')
        .eq('user_id', user.id)

      const categoriesCompleted = refinements?.map(r => r.category) || []

      // Create vision summary
      const visionSummary = `Complete life vision across ${categoriesCompleted.length} categories with ${scenesCount} visualization scenes.`

      setTimeout(() => setVivaStage('activation'), 2000)

      // Call final assembly API
      const response = await fetch('/api/viva/final-assembly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          assembledVision: visionPreview,
          visionSummary,
          scenesCount,
          categoriesCompleted,
          profile,
          assessment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate final sections')
      }

      const data = await response.json()

      setFinalData({
        forward: data.forward,
        conclusion: data.conclusion,
        activationMessage: data.activationMessage,
        harmonizationNotes: data.harmonizationNotes
      })

      setVivaStage('finalizing')
      setTimeout(() => setVivaStage(''), 1000)
    } catch (err) {
      console.error('Error generating final sections:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate final sections')
      setVivaStage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompleteVision = () => {
    if (visionId) {
      router.push(`/life-vision/${visionId}`)
    }
  }

  const handleDownload = () => {
    if (visionPreview && finalData) {
      const fullVision = `# ${visionPreview.title || 'My Life Vision'}

## Forward

${finalData.forward}

## Fun
${visionPreview.fun}

## Health
${visionPreview.health}

## Travel
${visionPreview.travel}

## Love
${visionPreview.love}

## Family
${visionPreview.family}

## Social
${visionPreview.social}

## Home
${visionPreview.home}

## Work
${visionPreview.work}

## Money
${visionPreview.money}

## Stuff
${visionPreview.stuff}

## Giving
${visionPreview.giving}

## Spirituality
${visionPreview.spirituality}

## Conclusion

${finalData.conclusion}

---

${finalData.activationMessage}
`

      const element = document.createElement('a')
      const file = new Blob([fullVision], { type: 'text/markdown' })
      element.href = URL.createObjectURL(file)
      element.download = 'my-complete-life-vision.md'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" variant="primary" />
      </Container>
    )
  }

  if (error && !finalData) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8 border-2 border-red-500/30 bg-red-500/5">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">Error</h2>
          <p className="text-sm md:text-base text-neutral-400 mb-6">{error}</p>
          <Button size="sm" onClick={() => router.push('/life-vision/new/assembly')}>
            Back to Assembly
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-4 md:mb-6">
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">
          Final Polish
        </h1>
        
        <p className="text-sm md:text-base lg:text-xl text-neutral-300 max-w-2xl mx-auto mb-4 md:mb-6">
          Add the finishing touches to your Life Vision with personalized opening, closing, and activation guidance.
        </p>

        <Badge variant="success" className="text-xs md:text-sm">
          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
          {scenesCount} Scenes Created
        </Badge>
      </div>

      {/* Processing State */}
      {isProcessing && vivaStage && (
        <VIVAActionCard stage={vivaStage} className="mb-6 md:mb-8" />
      )}

      {/* Ready to Generate */}
      {!finalData && !isProcessing && (
        <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
              Ready to Polish Your Vision
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
              VIVA will create your personalized Forward, Conclusion, and Activation Message to complete your Life Vision Document.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateFinal}
              className="w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Generate Final Sections
            </Button>
          </div>
        </Card>
      )}

      {/* Final Sections Display */}
      {finalData && !isProcessing && (
        <>
          {/* Forward */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Forward</h2>
                <p className="text-xs md:text-sm text-neutral-400">Your vision's opening</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none bg-neutral-800/50 rounded-lg p-4 md:p-6">
              <p className="text-sm md:text-base text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {finalData.forward}
              </p>
            </div>
          </Card>

          {/* Conclusion */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Conclusion</h2>
                <p className="text-xs md:text-sm text-neutral-400">Your vision's closing</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none bg-neutral-800/50 rounded-lg p-4 md:p-6">
              <p className="text-sm md:text-base text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {finalData.conclusion}
              </p>
            </div>
          </Card>

          {/* Activation Message */}
          <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 border-2 border-accent-purple/30 bg-accent-purple/5">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent-purple" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Ready for Activation</h2>
                <p className="text-xs md:text-sm text-neutral-400">Your next steps</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none bg-black/30 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <p className="text-sm md:text-base text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {finalData.activationMessage}
              </p>
            </div>

            {/* Suggested Actions */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-white">Ways to Activate Your Vision</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto py-3 md:py-4"
                  onClick={() => alert('Audio feature coming soon!')}
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs md:text-sm">Listen as Audio</div>
                    <div className="text-xs text-neutral-400">Hear your vision read aloud</div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto py-3 md:py-4"
                  onClick={() => router.push(`/vision-board/${visionId}`)}
                >
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs md:text-sm">Create Vision Board</div>
                    <div className="text-xs text-neutral-400">Visualize your scenes</div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto py-3 md:py-4"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs md:text-sm">Download PDF</div>
                    <div className="text-xs text-neutral-400">Keep a copy with you</div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto py-3 md:py-4"
                  onClick={() => router.push('/dashboard')}
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-xs md:text-sm">Daily Check-In</div>
                    <div className="text-xs text-neutral-400">Use as decision filter</div>
                  </div>
                </Button>
              </div>
            </div>
          </Card>

          {/* Harmonization Notes (if any) */}
          {finalData.harmonizationNotes && finalData.harmonizationNotes.length > 0 && (
            <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8 border-2 border-primary-500/30 bg-primary-500/5">
              <h3 className="text-base md:text-lg font-semibold text-primary-500 mb-3 md:mb-4">
                Vibrational Harmony Notes
              </h3>
              <ul className="space-y-2">
                {finalData.harmonizationNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-neutral-300">{note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Download Vision
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteVision}
              className="flex-1"
            >
              View Complete Vision
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Error Display */}
      {error && finalData && (
        <Card className="mt-6 md:mt-8 p-4 md:p-6 border-2 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm md:text-base text-red-400">{error}</p>
          </div>
        </Card>
      )}
    </Container>
  )
}

