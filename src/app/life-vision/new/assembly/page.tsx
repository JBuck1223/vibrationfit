'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, Download } from 'lucide-react'

function VIVAActionCard({ stage, className = '' }: { stage: string, className?: string }) {
  const stageData = {
    'assembling': {
      title: 'Assembling your master vision',
      description: 'VIVA is weaving together all 12 categories...',
      icon: Sparkles
    },
    'synthesizing': {
      title: 'Synthesizing vibrational alignment',
      description: 'Creating a unified life vision in your voice...',
      icon: Sparkles
    },
    'crafting': {
      title: 'Crafting final document',
      description: 'Polishing your complete Life Vision Document...',
      icon: Sparkles
    }
  }

  const data = stageData[stage as keyof typeof stageData] || stageData.assembling
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

export default function AssemblyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [masterVision, setMasterVision] = useState<{ markdown: string, json: any } | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)

  useEffect(() => {
    checkComplete()
  }, [])

  const checkComplete = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has completed all 12 categories
      const { data: refinements } = await supabase
        .from('refinements')
        .select('*')
        .eq('user_id', user.id)

      if (refinements && refinements.length >= 12) {
        // All categories complete
      } else {
        // Not enough categories
        setError('Please complete all 12 categories first')
      }
    } catch (err) {
      console.error('Error checking completion:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssembleVision = async () => {
    setIsProcessing(true)
    setVivaStage('assembling')
    setError(null)

    try {
      // Get category summaries
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { data: refinements } = await supabase
        .from('refinements')
        .select('*')
        .eq('user_id', user.id)

      const categorySummaries: Record<string, string> = {}
      const categoryTranscripts: Record<string, string> = {}
      refinements?.forEach(ref => {
        if (ref.ai_summary) {
          categorySummaries[ref.category] = ref.ai_summary
        }
        if (ref.transcript && ref.transcript.trim().length > 0) {
          categoryTranscripts[ref.category] = ref.transcript
        }
      })

      // Cycle through stages
      setTimeout(() => setVivaStage('synthesizing'), 1500)
      setTimeout(() => setVivaStage('crafting'), 3000)

      // Call API
      // Get profile, assessment, and active vision for context
      let profileData = {}
      let assessmentData = {}
      let activeVision = null
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        profileData = profile || {}
      } catch (e) {
        console.log('No profile available')
      }
      
      try {
        const { data: assessment } = await supabase
          .from('assessment_results')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()
        
        if (assessment) {
          // Get assessment responses with questions and answers
          const { data: responsesData } = await supabase
            .from('assessment_responses')
            .select('*')
            .eq('assessment_id', assessment.id)
          
          assessmentData = {
            ...assessment,
            responses: responsesData || []
          }
        }
      } catch (e) {
        console.log('No assessment available')
      }
      
      // Get active (complete) vision if one exists
      try {
        const { data: activeVisionData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'draft') // Only complete visions
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (activeVisionData) {
          activeVision = activeVisionData
          console.log('Found active vision to reference:', activeVisionData.version_number)
        }
      } catch (e) {
        console.log('No active vision available')
      }

      const response = await fetch('/api/viva/master-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySummaries,
          categoryTranscripts,
          profile: profileData,
          assessment: assessmentData,
          activeVision: activeVision // Pass active vision to API
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assemble master vision')
      }

      const data = await response.json()

      if (data.markdown && data.json) {
        setMasterVision({ markdown: data.markdown, json: data.json })
        
        // Get the highest version number for this user (like the existing vision system does)
        const { data: latestVersion } = await supabase
          .from('vision_versions')
          .select('version_number')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        const newVersionNumber = (latestVersion?.version_number || 0) + 1

        // Save to vision_versions
        // Map API response fields to database columns (API may still use old names for backwards compat)
        const { data: insertedVision } = await supabase
          .from('vision_versions')
          .insert({
            user_id: user.id,
            version_number: newVersionNumber,
            forward: data.json.forward || '',
            fun: data.json.fun || '',
            travel: data.json.travel || '',
            home: data.json.home || '',
            family: data.json.family || '',
            love: data.json.love || data.json.romance || '', // Support both old and new
            health: data.json.health || '',
            money: data.json.money || '',
            work: data.json.work || data.json.business || '', // Support both old and new
            social: data.json.social || '',
            stuff: data.json.stuff || data.json.possessions || '', // Support both old and new
            giving: data.json.giving || '',
            spirituality: data.json.spirituality || '',
            conclusion: '',
            completion_percent: 100,
            status: 'complete'
          })
          .select()
          .single()

        if (insertedVision) {
          setVisionId(insertedVision.id)
        }
      }

      setVivaStage('')
    } catch (err) {
      console.error('Assembly error:', err)
      setError(err instanceof Error ? err.message : 'Failed to assemble vision')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewVision = () => {
    if (visionId) {
      router.push(`/life-vision/${visionId}`)
    }
  }

  const handleDownload = () => {
    if (masterVision?.markdown) {
      const element = document.createElement('a')
      const file = new Blob([masterVision.markdown], { type: 'text/markdown' })
      element.href = URL.createObjectURL(file)
      element.download = 'my-life-vision.md'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Life Vision is Ready
          </h1>
          
          <p className="text-base md:text-xl text-neutral-300 max-w-2xl mx-auto mb-6">
            VIVA has synthesized your reflections across all life areas into a unified, activation-ready vision.
          </p>

          <Badge variant="success" className="mb-6">
            <CheckCircle className="w-4 h-4 mr-2" />
            12 of 12 Categories Complete
          </Badge>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <VIVAActionCard stage={vivaStage} className="mb-8" />
        )}

        {/* Ready to Assemble */}
        {!masterVision && !isProcessing && !isLoading && (
          <Card className="mb-8">
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Ready to Create Your Master Vision
                </h2>
                <p className="text-neutral-400">
                  Click below to assemble your complete Life Vision Document from all 12 category summaries.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAssembleVision}
                className="w-full"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Assemble Master Vision
              </Button>
            </div>
          </Card>
        )}

        {/* Master Vision Display */}
        {masterVision && !isProcessing && (
          <Card className="mb-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Your Master Vision</h2>
                    <p className="text-neutral-400">A unified Life Vision Document</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8 bg-neutral-800 rounded-lg p-6 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: masterVision.markdown }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="ghost"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="primary"
                  onClick={handleViewVision}
                  className="w-full"
                >
                  View Full Vision
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
