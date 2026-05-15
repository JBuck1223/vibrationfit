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
  Spinner,
} from '@/lib/design-system/components'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Eye, Sparkles, Target, Compass, Lightbulb, CheckCircle, FileCheck } from 'lucide-react'
import { commitDraft } from '@/lib/life-vision/draft-helpers'
import { VISION_CATEGORIES, META_CATEGORY_KEYS, getCategoryStateField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
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

export default function IntensiveCreateVisionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<CategoryProgress>({})
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()
  const [visionStatus, setVisionStatus] = useState<'none' | 'in_progress' | 'completed'>('none')
  const [completedCategoryKeys, setCompletedCategoryKeys] = useState<string[]>([])
  const [draftVisionId, setDraftVisionId] = useState<string | null>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [isCommittingDraft, setIsCommittingDraft] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)
  
  useEffect(() => {
    if (isAlreadyCompleted && completedAt) setStepCompleted(completedAt)
    return () => setStepCompleted(null)
  }, [isAlreadyCompleted, completedAt, setStepCompleted])

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

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, vision_built, vision_built_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist?.vision_built) {
        setIsAlreadyCompleted(true)
        setCompletedAt(checklist.vision_built_at)
        setVisionStatus('completed')
      }

      const { data: categoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, clarity_keys, get_me_started_text, category_vision_text')
        .eq('user_id', user.id)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()

      const progressMap: CategoryProgress = {}
      
      categoryStates?.forEach(state => {
        progressMap[state.category] = {
          hasClarity: !!(state.clarity_keys && Array.isArray(state.clarity_keys) && state.clarity_keys.length > 0),
          hasImagination: !!state.get_me_started_text,
          hasBlueprint: false
        }
      })
      
      if (profile) {
        VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).forEach(cat => {
          const stateField = getCategoryStateField(cat.key as LifeCategoryKey)
          const hasProfileState = profile[stateField] && String(profile[stateField]).trim().length > 0
          
          if (hasProfileState) {
            if (!progressMap[cat.key]) {
              progressMap[cat.key] = { hasClarity: true, hasImagination: false, hasBlueprint: false }
            } else if (!progressMap[cat.key].hasClarity) {
              progressMap[cat.key].hasClarity = true
            }
          }
        })
      }

      setProgress(progressMap)
      
      const completed: string[] = []
      categoryStates?.forEach(state => {
        const isMeta = (META_CATEGORY_KEYS as readonly string[]).includes(state.category)
        if (isMeta) {
          if (state.get_me_started_text && state.get_me_started_text.trim().length > 0) {
            completed.push(state.category)
          }
        } else {
          if (state.category_vision_text && state.category_vision_text.trim().length > 50) {
            completed.push(state.category)
          }
        }
      })
      setCompletedCategoryKeys(completed)
      
      const { data: existingVision } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: draftVision } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (draftVision) setDraftVisionId(draftVision.id)
      if (existingVision) setActiveVisionId(existingVision.id)

      if (!checklist?.vision_built) {
        if (existingVision) {
          setVisionStatus('completed')
        } else {
          const hasActualVisionProgress = categoryStates && categoryStates.length > 0
          if (hasActualVisionProgress) setVisionStatus('in_progress')
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading progress:', err)
      setLoading(false)
    }
  }

  const handleGetStarted = async () => {
    const lifeCategories = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)
    const firstIncomplete = lifeCategories.find(cat => !completedCategoryKeys.includes(cat.key))
    
    if (firstIncomplete) {
      router.push(`/intensive/life-vision/create/${firstIncomplete.key}`)
    } else {
      router.push('/intensive/life-vision/create/assembly')
    }
  }

  const handleCommitDraft = async () => {
    if (!draftVisionId) return
    setIsCommittingDraft(true)
    setCommitError(null)
    try {
      const vision = await commitDraft(draftVisionId)
      router.push(`/intensive/life-vision/${vision.id}`)
    } catch (err) {
      console.error('Error committing draft:', err)
      setCommitError(err instanceof Error ? err.message : 'Failed to commit draft')
      setIsCommittingDraft(false)
    }
  }

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
        {draftVisionId && activeVisionId && (
          <div className="w-full rounded-xl bg-secondary-500/10 border border-secondary-500/30 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-secondary-300">You have a draft Life Vision ready to activate.</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Commit your draft to make it your active Life Vision.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => router.push(`/life-vision/${draftVisionId}/draft`)} className="flex-1 sm:flex-initial">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />Review
                </Button>
                <Button variant="primary" size="sm" onClick={handleCommitDraft} disabled={isCommittingDraft} className="flex-1 sm:flex-initial">
                  {isCommittingDraft ? (<><Spinner size="sm" className="mr-1.5" />Committing...</>) : (<><CheckCircle className="mr-1.5 h-3.5 w-3.5" />Commit as Active</>)}
                </Button>
              </div>
            </div>
            {commitError && <p className="text-xs text-red-400 mt-2">{commitError}</p>}
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo url={VISION_INTRO_VIDEO} thumbnailUrl={VISION_INTRO_POSTER} context="single" className="w-full" />
        </div>

        <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
          {visionStatus === 'completed' && activeVisionId ? (
            <Button variant="primary" size="sm" onClick={() => router.push(`/intensive/life-vision/${activeVisionId}`)} className="w-full md:w-auto">
              View Life Vision<Eye className="ml-2 h-4 w-4" />
            </Button>
          ) : visionStatus === 'in_progress' ? (
            <Button variant="primary" size="sm" onClick={handleGetStarted} className="w-full md:w-auto">
              Continue Your Vision<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleGetStarted} className="w-full md:w-auto">
              Start Your Vision<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">What is Your Life Vision?</Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">Your Life Vision is the blueprint for the life you choose to create across all 12 life categories. It's not just a list of goals. It's a living declaration of who you are becoming and the reality you're actively calling in.</p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">Think of it as your personal compass – it tells you where you're headed so your choices, actions, and focus can all line up with the life you actually want, not the one you think you "should" want.</p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">What You'll Create</Text>
            <Stack gap="lg">
              <Stack gap="sm"><Inline gap="sm" className="items-start"><Target className="h-5 w-5 text-[#5EC49A]" /><Text size="sm" className="text-white font-semibold">Clarity in Every Life Area</Text></Inline><p className="text-sm text-neutral-300 leading-relaxed">You'll get specific about what you want in each of the 12 categories: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving.</p></Stack>
              <Stack gap="sm"><Inline gap="sm" className="items-start"><Lightbulb className="h-5 w-5 text-[#2DD4BF]" /><Text size="sm" className="text-white font-semibold">Your Ideal State (In Your Own Words)</Text></Inline><p className="text-sm text-neutral-300 leading-relaxed">You'll describe your ideal reality in each area as if it already exists – how it looks, feels, sounds, and functions in your day‑to‑day life.</p></Stack>
              <Stack gap="sm"><Inline gap="sm" className="items-start"><Compass className="h-5 w-5 text-[#8B5CF6]" /><Text size="sm" className="text-white font-semibold">A Unified Blueprint</Text></Inline><p className="text-sm text-neutral-300 leading-relaxed">VIVA takes what you write for each category and assembles it into one cohesive Life Vision – Forward, all 12 categories, and a Conclusion – expressed in language that still feels like you.</p></Stack>
              <Stack gap="sm"><Inline gap="sm" className="items-start"><Sparkles className="h-5 w-5 text-[#FFB701]" /><Text size="sm" className="text-white font-semibold">Activation‑Ready Content</Text></Inline><p className="text-sm text-neutral-300 leading-relaxed">This written vision becomes the source for your audio tracks, vision board images, and daily activation protocol, so everything you do is built from the same clear picture.</p></Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">Why Your Life Vision Matters</Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">Your Life Vision is the foundation for intentional living inside Vibration Fit:</p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>• <span className="text-white font-semibold">Direction</span> – You know exactly where you're going, so decisions get simpler: "Does this move me closer to my vision or not?"</p>
              <p>• <span className="text-white font-semibold">Alignment</span> – Your daily actions, habits, and choices can finally match what you say you want.</p>
              <p>• <span className="text-white font-semibold">Context for VIVA</span> – Your vision gives VIVA the context it needs to personalize prompts, ideas, and guidance to your future, not someone else's.</p>
              <p>• <span className="text-white font-semibold">Manifestation Power</span> – A clear, felt, written vision gives your nervous system something specific to believe in, which makes it far easier to become a vibrational match to the life you're creating.</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed mt-4">This is the document everything else in Vibration Fit plugs into – your audio, your vision board, your Journal, and your 28‑day Activation Plan all start here.</p>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
