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
import { ArrowRight, Sparkles, Target, Heart, Zap, Eye, TrendingUp, RefreshCw, Layers, Activity, FlaskConical } from 'lucide-react'

const VISION_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/06-refine-1080p.mp4'

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
      <Stack gap="lg">
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
          subtitle="Create a draft from your active vision, then refine and commit when it feels right."
        >
          {/* Video */}
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={VISION_INTRO_VIDEO}
              context="single"
              className="w-full"
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
              What Is Vision Refinement?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Refinement lets you evolve your Life Vision without touching your live version.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              We create a draft copy of your active vision where you can edit, enhance, and upgrade any section using the refinement tools and VIVA. Your active vision stays exactly as it is until you choose to commit the draft.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              When you commit, your refined draft becomes your new active vision and automatically updates your daily practice, audio, and how VIVA understands your desired reality.
            </p>
          </Stack>
        </Card>

        {/* How It Works */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Refinement Works
            </Text>
            <Stack gap="xl">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">1</div>
                  <Text size="sm" className="text-white font-semibold">
                    Clone Your Active Vision
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  We'll create a draft copy of your current vision. This keeps your original safe while you experiment. Only one draft exists at a time to keep things clean.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">2</div>
                  <Text size="sm" className="text-white font-semibold">
                    Refine with VIVA
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Open any section (Forward, each of the 12 categories, Conclusion) and tell VIVA what to add, remove, or adjust. Use the Refine tools to:
                </p>
                <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed pl-8">
                  <p>• Add new desires or details</p>
                  <p>• Remove what no longer fits</p>
                  <p>• Soften or amplify language</p>
                </Stack>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  And turn on Weave if you want VIVA to connect this category to other areas of your life, so your vision reads like one integrated story instead of 12 separate silos.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">3</div>
                  <Text size="sm" className="text-white font-semibold">
                    Track Your Changes
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Your draft automatically tracks which categories have been refined. You can refine one section or all 12. Save as you go and come back anytime before committing.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">4</div>
                  <Text size="sm" className="text-white font-semibold">
                    Commit When Ready
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  When your refined vision feels aligned, review it and commit it as your new active vision. Your old version moves into your history, so you never lose what you've created.
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
              Your vision should grow as you do. Regular refinement helps you:
            </p>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <TrendingUp className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Align with Growth</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    As parts of your vision become real, update it to reflect your next level.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <RefreshCw className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Clarify What's Changed</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Let your vision match who you are now, not who you were when you first wrote it.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Layers className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Add Richness</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Come back with fresh eyes and add sensory detail, emotional depth, and nuance.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Activity className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Maintain Momentum</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    A current vision stays activating. A stale one becomes wallpaper.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <FlaskConical className="h-5 w-5 text-[#FF0040] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Experiment Safely</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Try new language or ideas in draft mode. If it doesn't land, discard the draft and your active vision stays untouched.
                  </p>
                </div>
              </Inline>
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
              Your vision is a living document. Click below to create a refinement draft and give it an upgrade. Take your time, play, experiment – and only commit when it feels like a full‑body yes.
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

