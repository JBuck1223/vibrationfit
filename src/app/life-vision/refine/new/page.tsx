'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  PageHero,
  Spinner,
  IntensiveCompletionBanner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Sparkles, Target, Heart, Zap, Eye } from 'lucide-react'

// Placeholder video URL - user will replace this later
const VISION_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function LifeVisionRefineNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check intensive mode on mount
  useEffect(() => {
    checkIntensiveMode()
  }, [])

  const checkIntensiveMode = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, vision_refined, vision_refined_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.vision_refined) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.vision_refined_at)
        }
      }
    } catch (err) {
      console.error('Error checking intensive mode:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVision = async () => {
    setIsCreating(true)
    setError(null)

    try {
      // Initialize Supabase client
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please log in to continue')
      }

      // Check if user has an existing active vision to clone from
      const { data: activeVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('household_id', null)
        .maybeSingle()
      
      if (!activeVision) {
        // No active vision exists - redirect to life vision page to create first one
        setError('Please create your first Life Vision before refining')
        setTimeout(() => {
          router.push('/life-vision')
        }, 2000)
        return
      }

      // Delete any existing draft first (only one draft at a time)
      await supabase
        .from('vision_versions')
        .delete()
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      // Clone the active vision to create a new draft
      const { data: newDraft, error: insertError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          title: activeVision.title || 'The Life I Choose',
          forward: activeVision.forward || '',
          fun: activeVision.fun || '',
          travel: activeVision.travel || '',
          home: activeVision.home || '',
          family: activeVision.family || '',
          love: activeVision.love || '',
          health: activeVision.health || '',
          money: activeVision.money || '',
          work: activeVision.work || '',
          social: activeVision.social || '',
          stuff: activeVision.stuff || '',
          giving: activeVision.giving || '',
          spirituality: activeVision.spirituality || '',
          conclusion: activeVision.conclusion || '',
          is_draft: true,
          is_active: false,
          refined_categories: [],
          parent_id: activeVision.id, // Track which vision this was cloned from
          perspective: activeVision.perspective || 'singular',
          richness_metadata: activeVision.richness_metadata || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message || 'Failed to create draft vision')
      }

      if (!newDraft?.id) {
        throw new Error('No draft ID returned')
      }

      // Redirect to draft refinement page
      router.push(`/life-vision/${newDraft.id}/draft`)
    } catch (err) {
      console.error('Error creating refinement draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to create refinement draft')
      setIsCreating(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Completion Banner - Shows when step is already complete in intensive mode */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Refine Your Vision"
            completedAt={completedAt}
          />
        )}

        {/* Centered Hero Title */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 6 OF 14" : undefined}
          title="Refine Your Life Vision"
          subtitle="Create a new draft based on your active vision, then refine and commit when ready."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={VISION_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isAlreadyCompleted ? (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/life-vision')}
                className="w-full md:w-auto"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Life Vision
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCreateVision}
                disabled={isCreating}
                className="w-full md:w-auto"
              >
                {isCreating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Creating Draft...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Start Refining
                  </>
                )}
              </Button>
            )}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        </PageHero>

        {/* What is Refinement? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Vision Refinement?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Refinement allows you to evolve your Life Vision without losing what you've already created. We'll create a draft copy of your active vision, where you can edit, enhance, and perfect any category using our powerful refinement interface.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your active vision stays untouched until you're ready. When you commit your refined draft, it becomes your new active vision - seamlessly updating your daily practice, audio versions, and VIVA's understanding of your desired reality.
            </p>
          </Stack>
        </Card>

        {/* How It Works */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Refinement Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Clone Your Active Vision
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  We'll create a draft copy of your active vision. This keeps your original safe while you experiment and refine. Only one draft exists at a time to keep things clean.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Refine with VIVA
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Use the refinement interface to edit any category. Chat with VIVA to explore new ideas, enhance clarity, add sensory details, or completely reimagine sections as you evolve.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Zap className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Track Your Changes
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your draft tracks which categories you've refined. Take your time - refine one category or all 12. Save your progress and come back anytime before committing.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Commit When Ready
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  When your refined vision feels aligned, commit it as your new active vision. Your old version stays in your version history, so you never lose what you've created.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Why Refine? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Refine Your Vision?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your vision should evolve as you do. Here's why regular refinement is powerful:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Align with Growth</span> - As you actualize parts of your vision, refine it to reflect your next level of expansion.
              </p>
              <p>
                • <span className="text-white font-semibold">Clarify What's Changed</span> - Your desires evolve. Refinement lets you honor what's shifted in your heart without starting over.
              </p>
              <p>
                • <span className="text-white font-semibold">Add Richness</span> - Return to categories with fresh eyes and add sensory details, emotional depth, or new dimensions you've discovered.
              </p>
              <p>
                • <span className="text-white font-semibold">Maintain Momentum</span> - Keep your vision alive and current. A static vision loses its activating power over time.
              </p>
              <p>
                • <span className="text-white font-semibold">Safe Experimentation</span> - Try new approaches in draft mode. If it doesn't resonate, simply discard the draft and your active vision remains unchanged.
              </p>
            </Stack>
          </Stack>
        </Card>

        {/* Ready to Begin */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Refine?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Your vision is alive, just like you. Click below to create a refinement draft and give your vision the evolution it deserves. Take your time, play, experiment - and commit only when it feels aligned.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              {isAlreadyCompleted ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push('/life-vision')}
                  className="w-full md:w-auto"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Life Vision
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleCreateVision}
                  disabled={isCreating}
                  className="w-full md:w-auto"
                >
                  {isCreating ? (
                    <>
                      <Spinner variant="primary" size="sm" className="mr-2" />
                      Creating Draft...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Start Refining Your Vision
                    </>
                  )}
                </Button>
              )}
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

