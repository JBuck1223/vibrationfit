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
import { ArrowRight, Eye, Sparkles, Target, Compass, Lightbulb, CheckCircle } from 'lucide-react'
import { VISION_CATEGORIES, getCategoryStateField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'

const VISION_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/05-vision-builder-1080p.mp4'
const VISION_INTRO_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/05-vision-builder-thumb.0000000.jpg'

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
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
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
        .select('category, clarity_keys, get_me_started_text')
        .eq('user_id', user.id)

      // Also get user profile to check for profile state as fallback
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
          hasImagination: !!state.get_me_started_text,
          hasBlueprint: false
        }
      })
      
      // Then check profile state as fallback for categories without clarity_keys
      if (profile) {
        VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).forEach(cat => {
          const stateField = getCategoryStateField(cat.key as LifeCategoryKey)
          const hasProfileState = profile[stateField] && String(profile[stateField]).trim().length > 0
          
          if (hasProfileState) {
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
      // Match category page logic: completed = has get_me_started_text (hasImagination)
      const completed = Object.entries(progressMap)
        .filter(([_, prog]) => prog.hasImagination)
        .map(([key]) => key)
      setCompletedCategoryKeys(completed)
      
      // Check if a completed vision exists in vision_versions
      const { data: existingVision } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Determine vision status based on actual vision work
      // Only count vision_new_category_state entries (not profile state fallback)
      if (!checklist?.vision_built) {
        if (existingVision) {
          setVisionStatus('completed')
        } else {
          const hasActualVisionProgress = categoryStates && categoryStates.length > 0
          if (hasActualVisionProgress) {
            setVisionStatus('in_progress')
          }
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading progress:', err)
      setLoading(false)
    }
  }

  const allCategoriesCompleted = completedCategoryKeys.length === 12


  const handleGetStarted = async () => {
    // Find first incomplete category
    // Match category page logic: completed = has get_me_started_text (hasImagination)
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
        {/* Ready to Assemble Banner — only shown during intensive flow */}
        {isIntensiveMode && allCategoriesCompleted && (
          <button
            onClick={() => router.push('/life-vision/new/assembly')}
            className="w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-primary-500/15 border border-primary-500/40 hover:bg-primary-500/25 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-primary-400">
                All 12 categories are ready. Create your vision now.
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-primary-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Completion Banner - Shows above PageHero when step is already complete */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Build Your Life Vision"
            completedAt={completedAt}
          />
        )}

        {isIntensiveMode ? (
          <PageHero
            eyebrow="ACTIVATION INTENSIVE • STEP 5 OF 14"
            title="Welcome to Your Life Vision"
            subtitle="Your Life Vision is the blueprint for the life you choose to create."
          >
            <div className="mx-auto w-full max-w-3xl">
              <OptimizedVideo
                url={VISION_INTRO_VIDEO}
                thumbnailUrl={VISION_INTRO_POSTER}
                context="single"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
              {visionStatus === 'completed' ? (
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
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleGetStarted}
                  className="w-full md:w-auto"
                >
                  Start Your Vision
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </PageHero>
        ) : (
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={VISION_INTRO_VIDEO}
              thumbnailUrl={VISION_INTRO_POSTER}
              context="single"
              className="w-full"
            />
          </div>
        )}

        {/* Categories bar - progress tracker under hero */}
        <CategoryGrid
          categories={categoriesWithout}
          selectedCategories={[]}
          completedCategories={completedCategoryKeys}
          onCategoryClick={(key: string) => router.push(`/life-vision/new/category/${key}`)}
          mode="completion"
          fillWidth
        />

        {/* What is a Life Vision? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Your Life Vision?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Life Vision is the blueprint for the life you choose to create across all 12 life categories. It's not just a list of goals. It's a living declaration of who you are becoming and the reality you're actively calling in.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Think of it as your personal compass – it tells you where you're headed so your choices, actions, and focus can all line up with the life you actually want, not the one you think you "should" want.
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
                    Clarity in Every Life Area
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You'll get specific about what you want in each of the 12 categories: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Lightbulb className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Ideal State (In Your Own Words)
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You'll describe your ideal reality in each area as if it already exists – how it looks, feels, sounds, and functions in your day‑to‑day life.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Compass className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    A Unified Blueprint
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  VIVA takes what you write for each category and assembles it into one cohesive Life Vision – Forward, all 12 categories, and a Conclusion – expressed in language that still feels like you.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Activation‑Ready Content
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  This written vision becomes the source for your audio tracks, vision board images, and daily activation protocol, so everything you do is built from the same clear picture.
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
              Your Life Vision is the foundation for intentional living inside Vibration Fit:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Direction</span> – You know exactly where you're going, so decisions get simpler: "Does this move me closer to my vision or not?"
              </p>
              <p>
                • <span className="text-white font-semibold">Alignment</span> – Your daily actions, habits, and choices can finally match what you say you want.
              </p>
              <p>
                • <span className="text-white font-semibold">Context for VIVA</span> – Your vision gives VIVA the context it needs to personalize prompts, ideas, and guidance to your future, not someone else's.
              </p>
              <p>
                • <span className="text-white font-semibold">Manifestation Power</span> – A clear, felt, written vision gives your nervous system something specific to believe in, which makes it far easier to become a vibrational match to the life you're creating.
              </p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed mt-4">
              This is the document everything else in Vibration Fit plugs into – your audio, your vision board, your Journal, and your 28‑day Activation Plan all start here.
            </p>
          </Stack>
        </Card>


      </Stack>

    </Container>
  )
}
