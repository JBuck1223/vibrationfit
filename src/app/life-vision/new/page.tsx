'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Container, Stack, PageHero, Spinner, IntensiveCompletionBanner } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, Circle, Clock } from 'lucide-react'
import { VISION_CATEGORIES, getCategoryClarityField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'

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
      setLoading(false)
    } catch (err) {
      console.error('Error loading progress:', err)
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryKey: string) => {
    router.push(`/life-vision/new/category/${categoryKey}`)
  }

  const handleGetStarted = async () => {
    // Find first incomplete category
    const categories = VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13)
    const firstIncomplete = categories.find(cat => !isCompleted(cat.key))
    
    if (firstIncomplete) {
      router.push(`/life-vision/new/category/${firstIncomplete.key}`)
    } else {
      // All complete, go to assembly
      router.push('/life-vision/new/assembly')
    }
  }

  const isCompleted = (categoryKey: string) => {
    const prog = progress[categoryKey]
    return prog?.hasClarity && prog?.hasImagination && prog?.hasBlueprint
  }

  const isInProgress = (categoryKey: string) => {
    const prog = progress[categoryKey]
    return prog && (prog.hasClarity || prog.hasImagination || prog.hasBlueprint) && !isCompleted(categoryKey)
  }

  const getCompletionPercentage = () => {
    const categories = VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13)
    const completed = categories.filter(cat => isCompleted(cat.key)).length
    return Math.round((completed / categories.length) * 100)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner - Shows when step is already complete in intensive mode */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Build Your Life Vision"
            completedAt={completedAt}
          />
        )}

        {/* Hero Section */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 5 OF 14" : "THE LIFE I CHOOSE"}
          title="Create Your Life Vision with VIVA"
          subtitle="Your Vibrational Intelligence Virtual Assistant is here to help you articulate and activate the life you choose. We'll guide you through 12 key life areas, capturing your voice and energy to create a unified vision."
        />

        {/* Progress Overview */}
        {!loading && Object.keys(progress).length > 0 && (
          <Card variant="elevated" className="border-2 border-primary-500/30 bg-primary-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Your Progress</h3>
                <p className="text-sm text-neutral-400">
                  {getCompletionPercentage()}% Complete • {VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).filter(cat => isCompleted(cat.key)).length} of 12 categories
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGetStarted}
              >
                Continue
              </Button>
            </div>
            <div className="mt-4 w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </Card>
        )}

        {/* Category Grid */}
        <Card>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              Life Areas to Explore
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" variant="primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).map((category) => {
                  const IconComponent = category.icon
                  const completed = isCompleted(category.key)
                  const inProgress = isInProgress(category.key)
                  
                  return (
                    <button
                      key={category.key}
                      onClick={() => handleCategoryClick(category.key)}
                      className={`
                        relative rounded-2xl p-4 border-2 transition-all duration-300
                        ${completed 
                          ? 'border-primary-500 bg-primary-500/10 hover:bg-primary-500/20' 
                          : inProgress
                            ? 'border-secondary-500 bg-secondary-500/10 hover:bg-secondary-500/20'
                            : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                        }
                        hover:-translate-y-1 hover:shadow-lg
                      `}
                    >
                      {/* Status Icon */}
                      <div className="absolute top-2 right-2">
                        {completed ? (
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        ) : inProgress ? (
                          <Clock className="w-5 h-5 text-secondary-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-neutral-600" />
                        )}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center mb-3
                          ${completed 
                            ? 'bg-primary-500/20' 
                            : inProgress
                              ? 'bg-secondary-500/20'
                              : 'bg-neutral-800/50'
                          }
                        `}>
                          <IconComponent className={`
                            w-6 h-6
                            ${completed 
                              ? 'text-primary-500' 
                              : inProgress
                                ? 'text-secondary-500'
                                : 'text-white'
                            }
                          `} />
                        </div>
                        <h4 className="font-semibold text-white text-sm mb-1">
                          {category.label}
                        </h4>
                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* How It Works */}
        <Card>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-primary-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-primary-500">1</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">Express Your Clarity</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    Speak or write about what's clear to you in each life area.
                  </p>
                </div>
              </Card>

              {/* Step 2 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-secondary-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-secondary-500">2</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">Unleash Your Imagination</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    Dream freely about your ideal life in each category.
                  </p>
                </div>
              </Card>

              {/* Step 3 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-accent-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-accent-500">3</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">VIVA Creates Your Blueprint</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    AI synthesizes your vision with Being/Doing/Receiving loops.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGetStarted}
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {Object.keys(progress).length > 0 ? 'Continue Your Vision' : 'Get Started'}
          </Button>
          <p className="text-xs md:text-sm text-neutral-400 mt-4">
            You can pause and resume anytime. Your progress is automatically saved.
          </p>
        </div>
      </Stack>
    </Container>
  )
}
