'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, Download, ArrowRight, BarChart3 } from 'lucide-react'

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
  const [masterVision, setMasterVision] = useState<{ markdown: string, json: any, richnessMetadata?: any } | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [showRichnessStats, setShowRichnessStats] = useState(true)

  useEffect(() => {
    checkComplete()
  }, [])

  const checkComplete = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has completed all 12 categories
      const { data: categoryStates } = await supabase
        .from('life_vision_category_state')
        .select('*')
        .eq('user_id', user.id)

      if (categoryStates && categoryStates.length >= 12) {
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

      const { data: categoryStates } = await supabase
        .from('life_vision_category_state')
        .select('*')
        .eq('user_id', user.id)

      const categorySummaries: Record<string, string> = {}
      const categoryTranscripts: Record<string, string> = {}
      categoryStates?.forEach(cs => {
        if (cs.ai_summary) {
          categorySummaries[cs.category] = cs.ai_summary
        }
        if (cs.transcript && cs.transcript.trim().length > 0) {
          categoryTranscripts[cs.category] = cs.transcript
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
        setMasterVision({ 
          markdown: data.markdown, 
          json: data.json,
          richnessMetadata: data.richnessMetadata // V3: Store richness metadata
        })
        
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
            status: 'draft', // V3: Mark as draft until final sections are added
            richness_metadata: data.richnessMetadata || {} // V3: Save richness metadata
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

        {/* Richness Stats (V3) */}
        {masterVision && masterVision.richnessMetadata && showRichnessStats && (
          <Card className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-primary-500/30 bg-primary-500/5">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Input Richness Analysis</h3>
                  <p className="text-xs md:text-sm text-neutral-400">How your vision scales with your input</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowRichnessStats(false)}>
                Hide
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {Object.entries(masterVision.richnessMetadata).map(([category, data]: [string, any]) => {
                const densityColor = 
                  data.density === 'rich' ? 'text-primary-500' :
                  data.density === 'moderate' ? 'text-[#FFB701]' :
                  'text-neutral-500'
                
                const densityBg = 
                  data.density === 'rich' ? 'bg-primary-500/10 border-primary-500/30' :
                  data.density === 'moderate' ? 'bg-[#FFB701]/10 border-[#FFB701]/30' :
                  'bg-neutral-800/50 border-neutral-700/30'

                return (
                  <Card key={category} className={`p-3 md:p-4 border ${densityBg}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm md:text-base font-semibold text-white capitalize">{category}</h4>
                        <Badge variant="neutral" className={`text-xs ${densityColor}`}>
                          {data.density}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs md:text-sm">
                        <div className="flex justify-between text-neutral-400">
                          <span>Input:</span>
                          <span className="text-white">{data.inputChars} chars</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Ideas:</span>
                          <span className="text-white">{data.distinctIdeas}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-black/30 rounded-lg border border-primary-500/20">
              <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                <strong className="text-primary-500">V3 Intelligence:</strong> Your vision sections automatically scale to match your input richness. 
                Rich input = longer, detailed sections. Sparse input = concise, focused sections. No compression, no fluff.
              </p>
            </div>
          </Card>
        )}

        {/* Master Vision Display */}
        {masterVision && !isProcessing && (
          <Card className="mb-6 md:mb-8 p-4 md:p-6 lg:p-8">
            <div>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-white">Your Master Vision</h2>
                    <p className="text-xs md:text-sm text-neutral-400">A unified Life Vision Document</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-6 md:mb-8 bg-neutral-800 rounded-lg p-4 md:p-6 max-h-96 overflow-y-auto">
                <div className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: masterVision.markdown }} />
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleViewVision}
                  className="flex-1"
                >
                  View Full Vision
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/life-vision/new/final')}
                  className="flex-1"
                >
                  Continue to Final
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
