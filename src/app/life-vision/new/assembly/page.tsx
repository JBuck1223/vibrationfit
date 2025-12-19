'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner, Badge, Container, Stack, PageHero, VIVALoadingOverlay } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react'

export default function AssemblyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaStage, setVivaStage] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)
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
    setVivaProgress(0)
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

      // Extract all rich data from the new flow
      const categorySummaries: Record<string, string> = {}
      const categoryIdealStates: Record<string, string> = {}
      const categoryBlueprints: Record<string, any> = {}
      const categoryTranscripts: Record<string, string> = {}
      
      categoryStates?.forEach(cs => {
        // Step 1: Clarity (AI summary)
        if (cs.ai_summary) {
          categorySummaries[cs.category] = cs.ai_summary
        }
        // Step 2: Imagination (USER'S OWN WORDS - PRIMARY SOURCE!)
        if (cs.ideal_state && cs.ideal_state.trim().length > 0) {
          categoryIdealStates[cs.category] = cs.ideal_state
        }
        // Step 3: Blueprint (Being/Doing/Receiving loops)
        if (cs.blueprint_data) {
          try {
            categoryBlueprints[cs.category] = typeof cs.blueprint_data === 'string' 
              ? JSON.parse(cs.blueprint_data) 
              : cs.blueprint_data
          } catch (e) {
            console.error(`Failed to parse blueprint for ${cs.category}:`, e)
          }
        }
        // Legacy: Original transcripts (if available)
        if (cs.transcript && cs.transcript.trim().length > 0) {
          categoryTranscripts[cs.category] = cs.transcript
        }
      })

      // Step 4: Get Scenes for each category
      const { data: allScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true })

      const categoryScenes: Record<string, any[]> = {}
      allScenes?.forEach(scene => {
        if (!categoryScenes[scene.category]) {
          categoryScenes[scene.category] = []
        }
        categoryScenes[scene.category].push({
          title: scene.title,
          text: scene.text,
          essence_word: scene.essence_word
        })
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
          .eq('is_active', true)
          .maybeSingle()
        
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
          .eq('is_draft', false) // Only complete visions (not drafts)
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

      // DEBUG: Log what data we're sending
      console.log('=== ASSEMBLY DATA DEBUG ===')
      console.log('categorySummaries:', Object.keys(categorySummaries))
      console.log('categoryIdealStates:', Object.keys(categoryIdealStates))
      console.log('categoryBlueprints:', Object.keys(categoryBlueprints))
      console.log('categoryScenes:', Object.keys(categoryScenes))
      console.log('Sample idealState (fun):', categoryIdealStates['fun']?.substring(0, 100))
      console.log('Sample blueprint (fun):', categoryBlueprints['fun'])
      console.log('Sample scenes (fun):', categoryScenes['fun'])
      
      const response = await fetch('/api/viva/master-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySummaries,      // Step 1: Clarity (AI summary)
          categoryIdealStates,    // Step 2: Imagination (USER'S WORDS - PRIMARY!)
          categoryBlueprints,     // Step 3: Being/Doing/Receiving loops
          categoryScenes,         // Step 4: Visualization scenes
          categoryTranscripts,    // Legacy: Original transcripts
          profile: profileData,
          assessment: assessmentData,
          activeVision: activeVision
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assemble master vision')
      }

      const data = await response.json()

      // V5: Check for visionId (vision is created server-side) - this is the key indicator of success
      if (data.visionId && data.json) {
        // Slide progress to 100%
        setVivaProgress(100)
        
        setMasterVision({ 
          markdown: data.markdown || '', // May be empty if AI returned pure JSON
          json: data.json
        })
        
        setVisionId(data.visionId)
        console.log('[Assembly] Vision created by API:', data.visionId)
        
        // Wait briefly to show 100% completion, then hide overlay
        await new Promise(resolve => setTimeout(resolve, 600))
      } else {
        console.error('[Assembly] Missing required data:', { 
          hasVisionId: !!data.visionId, 
          hasJson: !!data.json,
          error: data.error 
        })
        throw new Error(data.error || 'Failed to create vision - missing visionId or json')
      }

      setVivaStage('')
    } catch (err) {
      console.error('Assembly error:', err)
      setError(err instanceof Error ? err.message : 'Failed to assemble vision')
    } finally {
      setIsProcessing(false)
      setVivaProgress(0)
    }
  }

  const handleViewVision = () => {
    if (visionId) {
      router.push(`/life-vision/${visionId}`)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Your Life Vision is Ready"
          subtitle="VIVA has synthesized your reflections across all life areas into a unified, activation-ready vision."
        >
          <div className="flex justify-center">
            <Badge variant="success">
              <CheckCircle className="w-4 h-4 mr-2" />
              12 of 12 Categories Complete
            </Badge>
          </div>
        </PageHero>

        {/* VIVA Processing Overlay */}
        <VIVALoadingOverlay
          isVisible={isProcessing}
          messages={[
            "VIVA is assembling your complete vision...",
            "Weaving together all 12 life categories...",
            "Creating unified vibrational alignment...",
            "Polishing your master vision document..."
          ]}
          cycleDuration={4000}
          estimatedTime="Usually takes 30-45 seconds"
          estimatedDuration={37500}
          progress={vivaProgress}
        />

        {/* Ready to Assemble */}
        {!masterVision && !isProcessing && !isLoading && (
          <Card>
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Ready to Create Your Master Vision
                </h2>
                <p className="text-neutral-400">
                  Click below to assemble your complete Life Vision Document from all 12 category summaries.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAssembleVision}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Assemble Master Vision
                </Button>
              </div>
            </div>
          </Card>
        )}


        {/* Success Confirmation */}
        {masterVision && visionId && !isProcessing && (
          <Card className="mb-6 md:mb-8 p-6 md:p-8 lg:p-10 border-2 border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-secondary-500/5">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Your Life Vision is Complete!
              </h2>
              
              <p className="text-base md:text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
                VIVA has assembled your complete Life Vision Document with all 12 categories, 
                personalized bookends, and activation guidance. Your vision is now active and ready to use.
              </p>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleViewVision}
                  className="min-w-[200px]"
                >
                  See My Vision
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
