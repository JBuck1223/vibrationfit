'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  CategoryGrid,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Eye, Sparkles, Target, Compass, Lightbulb } from 'lucide-react'
import { VISION_CATEGORIES, getCategoryClarityField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'

// Placeholder video URL - user will replace this later
const VISION_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

interface CategoryProgress {
  [key: string]: {
    hasClarity: boolean
    hasImagination: boolean
    hasBlueprint: boolean
  }
}

export default function VIVALifeVisionLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<CategoryProgress>({})
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  // 3-state: none (no progress), in_progress (has progress, not complete), completed
  const [visionStatus, setVisionStatus] = useState<'none' | 'in_progress' | 'completed'>('none')
  // Track completed categories for the CategoryGrid
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  
  // Categories without forward and conclusion for the grid
  const categoriesWithout = VISION_CATEGORIES.filter(
    c => c.key !== 'forward' && c.key !== 'conclusion'
  )

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Check if in intensive mode and step completion
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, vision_built, vision_built_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.vision_built) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.vision_built_at)
          setVisionStatus('completed')
        }
      }

      // Get all category states
      const { data: categoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, clarity_keys, ideal_state, blueprint_data')
        .eq('user_id', user.id)

      // Also get user profile to check for profile clarity as fallback
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()

      const progressMap: CategoryProgress = {}
      
      // First, populate from category states
      categoryStates?.forEach(state => {
        progressMap[state.category] = {
          hasClarity: !!(state.clarity_keys && Array.isArray(state.clarity_keys) && state.clarity_keys.length > 0),
          hasImagination: !!state.ideal_state,
          hasBlueprint: !!state.blueprint_data
        }
      })
      
      // Then check profile clarity as fallback for categories without clarity_keys
      if (profile) {
        VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).forEach(cat => {
          const clarityField = getCategoryClarityField(cat.key as LifeCategoryKey)
          const hasProfileClarity = profile[clarityField] && String(profile[clarityField]).trim().length > 0
          
          // If we don't have clarity in category state but we have it in profile, mark as having clarity
          if (hasProfileClarity) {
            if (!progressMap[cat.key]) {
              progressMap[cat.key] = {
                hasClarity: true,
                hasImagination: false,
                hasBlueprint: false
              }
            } else if (!progressMap[cat.key].hasClarity) {
              progressMap[cat.key].hasClarity = true
            }
          }
        })
      }

      setProgress(progressMap)
      
      // Set completed category keys for the CategoryGrid
      // Match category page logic: completed = has ideal_state (hasImagination)
      const completed = Object.entries(progressMap)
        .filter(([_, prog]) => prog.hasImagination)
        .map(([key]) => key)
      setCompletedCategoryKeys(completed)
      
      // Determine vision status based on progress
      if (!checklist?.vision_built) {
        const hasAnyProgress = Object.keys(progressMap).length > 0
        if (hasAnyProgress) {
          setVisionStatus('in_progress')
        }
        // Otherwise remains 'none'
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading progress:', err)
      setLoading(false)
    }
  }

  const handleGetStarted = async () => {
    // Find first incomplete category
    // Match category page logic: completed = has ideal_state (hasImagination)
    const categories = VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13)
    const firstIncomplete = categories.find(cat => {
      const prog = progress[cat.key]
      return !prog?.hasImagination
    })
    
    if (firstIncomplete) {
      router.push(`/life-vision/new/category/${firstIncomplete.key}`)
    } else {
      // All complete, go to assembly
      router.push('/life-vision/new/assembly')
    }
  }


  // Show loading spinner while checking status
  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner - Shows above PageHero when step is already complete */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Build Your Life Vision"
            completedAt={completedAt}
          />
        )}

        {/* Page Hero - Always shows, with intensive eyebrow when in intensive mode */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 5 OF 14" : undefined}
          title="Welcome to Your Life Vision"
          subtitle="Your Life Vision is the blueprint for the life you choose to create."
        >
          {/* Video */}
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={VISION_INTRO_VIDEO}
              context="single"
              className="w-full"
            />
          </div>

          {/* Category Grid - Progress Tracker */}
          <div className="mb-6">
            <CategoryGrid
              categories={categoriesWithout}
              selectedCategories={[]}
              completedCategories={completedCategoryKeys}
              onCategoryClick={(key: string) => router.push(`/life-vision/new/category/${key}`)}
              mode="completion"
              layout="12-column"
              withCard={true}
              className="!bg-black/40 backdrop-blur-sm"
            />
          </div>

          {/* Action Button - Different for intensive vs non-intensive */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isIntensiveMode ? (
              // Intensive mode: 3-state button
              visionStatus === 'completed' ? (
                // State 3: View Vision (completed)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push('/life-vision')}
                  className="w-full md:w-auto"
                >
                  View Life Vision
                  <Eye className="ml-2 h-4 w-4" />
                </Button>
              ) : visionStatus === 'in_progress' ? (
                // State 2: Continue Vision (in progress)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleGetStarted}
                  className="w-full md:w-auto"
                >
                  Continue Your Vision
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                // State 1: Start Vision (no progress)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleGetStarted}
                  className="w-full md:w-auto"
                >
                  Start Your Vision
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )
            ) : (
              // Non-intensive mode: Just show Life Vision Hub button
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/life-vision')}
                className="w-full md:w-auto"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Life Vision Hub
              </Button>
            )}
          </div>
        </PageHero>

        {/* What is a Life Vision? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Your Life Vision?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Life Vision is a comprehensive articulation of the life you choose to create across all 12 categories. It's not just a list of goals - it's a living, breathing declaration of who you are becoming and the life you are actively manifesting.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Think of it as your personal compass - guiding every decision, every action, and every moment toward the life you truly desire. Your vision isn't about what you think you should want; it's about what genuinely lights you up.
            </p>
          </Stack>
        </Card>

        {/* What You'll Create */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Create
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Clarity in Each Life Area
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Get crystal clear on what you truly want in each of the 12 life categories: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Lightbulb className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Ideal State
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Dream freely and articulate your ideal life without limitations. This is where you unleash your imagination and connect with what genuinely excites you.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Compass className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Personal Blueprint
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  VIVA synthesizes your clarity and imagination into actionable Being/Doing/Receiving loops - a framework for living your vision every day.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    A Unified Vision
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  All 12 category visions are assembled into one cohesive Life Vision - a complete picture of the life you are creating, expressed in your own voice and energy.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Why It Matters */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Your Life Vision Matters
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Life Vision is the foundation for intentional living. Here's why it's so transformative:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Direction</span> - Know exactly where you're heading, so every choice moves you toward the life you want.
              </p>
              <p>
                • <span className="text-white font-semibold">Alignment</span> - Your daily actions become aligned with your deepest desires, creating momentum and flow.
              </p>
              <p>
                • <span className="text-white font-semibold">Context for VIVA</span> - Your vision gives VIVA the context to provide personalized guidance tailored to your unique aspirations.
              </p>
              <p>
                • <span className="text-white font-semibold">Manifestation Power</span> - A clear vision, felt deeply, activates the vibrational alignment that draws your desires to you.
              </p>
            </Stack>
          </Stack>
        </Card>


      </Stack>
    </Container>
  )
}
