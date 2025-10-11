// /src/app/vision/build/page.tsx
// Main vision building experience with VIVA

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VivaChat from '@/components/viva/VivaChat'
import { Button, Card } from '@/lib/design-system/components'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type BuildPhase = 'contrast' | 'peak' | 'specific'

interface VisionContent {
  category: string
  phase: BuildPhase
  content: string
  completed: boolean
}

export default function VisionBuildPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<BuildPhase>('contrast')
  const [visionContent, setVisionContent] = useState<Record<string, VisionContent>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Get categories (excluding forward/conclusion for now)
  const mainCategories = VISION_CATEGORIES.filter(
    cat => !['forward', 'conclusion'].includes(cat.key)
  )
  const currentCategory = mainCategories[currentCategoryIndex]
  const progress = ((currentCategoryIndex / mainCategories.length) * 100).toFixed(0)

  // Phase progression
  const phases: { key: BuildPhase; title: string; emoji: string }[] = [
    { key: 'contrast', title: 'What You\'re Moving Beyond', emoji: '🔄' },
    { key: 'peak', title: 'Peak Experience Activation', emoji: '✨' },
    { key: 'specific', title: 'Specific Desires', emoji: '🎯' }
  ]

  const currentPhaseIndex = phases.findIndex(p => p.key === currentPhase)

  // Save vision content for current category/phase
  const handleSaveVision = async (content: string) => {
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save to database
      await supabase.from('vision_content').upsert({
        user_id: user.id,
        category: currentCategory.key,
        phase: currentPhase,
        content,
        updated_at: new Date().toISOString()
      })

      // Update local state
      setVisionContent(prev => ({
        ...prev,
        [`${currentCategory.key}-${currentPhase}`]: {
          category: currentCategory.key,
          phase: currentPhase,
          content,
          completed: true
        }
      }))

      toast.success('Progress saved! ✨')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Move to next phase or category
  const handleNext = () => {
    if (currentPhaseIndex < phases.length - 1) {
      // Next phase
      setCurrentPhase(phases[currentPhaseIndex + 1].key)
      toast.success(`Moving to: ${phases[currentPhaseIndex + 1].title}`)
    } else if (currentCategoryIndex < mainCategories.length - 1) {
      // Next category, reset to contrast phase
      setCurrentCategoryIndex(prev => prev + 1)
      setCurrentPhase('contrast')
      toast.success(`Great! Let's explore ${mainCategories[currentCategoryIndex + 1].label}`)
    } else {
      // All done!
      router.push('/vision/complete')
    }
  }

  // Move to previous phase or category
  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhase(phases[currentPhaseIndex - 1].key)
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1)
      setCurrentPhase('specific') // Go to last phase of previous category
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-400">
                Your Vision Journey
              </span>
              <span className="text-sm font-semibold text-primary-500">
                {progress}% Complete
              </span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Category & Phase */}
          <div className="flex items-center justify-between">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 {(() => {
                   const Icon = currentCategory.icon
                   return <Icon className="w-8 h-8 text-primary-500" />
                 })()}
                 {currentCategory.label}
               </h2>
              <p className="text-sm text-neutral-400 mt-1">
                {phases[currentPhaseIndex].emoji} {phases[currentPhaseIndex].title}
              </p>
            </div>

            {/* Phase Indicator */}
            <div className="flex gap-2">
              {phases.map((phase, idx) => (
                <div
                  key={phase.key}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentPhaseIndex
                      ? 'bg-primary-500 scale-125'
                      : idx < currentPhaseIndex
                      ? 'bg-primary-500/50'
                      : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Category Navigator */}
          <Card className="lg:col-span-1 h-fit">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {mainCategories.map((cat, idx) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setCurrentCategoryIndex(idx)
                      setCurrentPhase('contrast')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      idx === currentCategoryIndex
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-neutral-400 hover:bg-neutral-800'
                     }`}
                   >
                     {(() => {
                       const Icon = cat.icon
                       return <Icon className="w-5 h-5" />
                     })()}
                     <span className="text-sm font-medium">{cat.label}</span>
                    {visionContent[`${cat.key}-specific`]?.completed && (
                      <CheckCircle className="w-4 h-4 ml-auto text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 h-[calc(100vh-16rem)]">
            <VivaChat
              visionBuildPhase={currentPhase}
              currentCategory={currentCategory.key}
              onSaveVision={handleSaveVision}
            />
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentCategoryIndex === 0 && currentPhaseIndex === 0}
          >
            ← Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSaving}
            className="gap-2"
          >
            {currentCategoryIndex === mainCategories.length - 1 && currentPhaseIndex === phases.length - 1
              ? 'Complete Vision'
              : currentPhaseIndex === phases.length - 1
              ? 'Next Category'
              : 'Next Phase'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}