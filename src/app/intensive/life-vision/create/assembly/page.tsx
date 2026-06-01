'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Container, Spinner, IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { CheckCircle, ArrowRight, AlertCircle, Sparkles, ChevronDown, type LucideIcon } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { getBookendTemplate, determineWooLevel } from '@/lib/viva/bookend-templates'

interface CategoryPreview {
  key: VisionCategoryKey
  label: string
  text: string
  ready: boolean
}

export default function IntensiveAssemblyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const isIntensiveMode = true
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryPreview[]>([])
  const [forwardText, setForwardText] = useState('')
  const [conclusionText, setConclusionText] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)

  const categoryKeys = VISION_CATEGORIES
    .filter(c => c.order > 0 && c.order < 13)
    .map(c => c.key)
    .sort((a, b) => {
      const catA = getVisionCategory(a)
      const catB = getVisionCategory(b)
      return (catA?.order || 0) - (catB?.order || 0)
    })

  const readyCount = categories.filter(c => c.ready).length
  const allReady = readyCount === 12

  useEffect(() => {
    loadState()
  }, [])

  const loadState = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      // Intensive mode is always true for this page

      const { data: categoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, category_vision_text, get_me_started_text')
        .eq('user_id', user.id)

      const previews: CategoryPreview[] = categoryKeys.map(key => {
        const cat = getVisionCategory(key)
        const state = categoryStates?.find(cs => cs.category === key)
        const text = state?.category_vision_text || ''
        return {
          key,
          label: cat?.label || key,
          text,
          ready: text.trim().length > 50
        }
      })
      setCategories(previews)

      // Auto-expand all categories
      const allKeys = new Set<string>(['forward', 'conclusion', ...previews.map(p => p.key)])
      setExpandedCategories(allKeys)

      // Resolve Forward and Conclusion
      const { data: voiceProfile } = await supabase
        .from('voice_profiles')
        .select('woo')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const wooLevel = determineWooLevel(voiceProfile?.woo)
      const templates = getBookendTemplate(wooLevel, 'singular')

      const forwardState = categoryStates?.find(cs => cs.category === 'forward')
      const conclusionState = categoryStates?.find(cs => cs.category === 'conclusion')

      setForwardText(
        forwardState?.get_me_started_text?.trim() || templates.forward
      )
      setConclusionText(
        conclusionState?.get_me_started_text?.trim() || templates.conclusion
      )

    } catch (err) {
      console.error('Error loading state:', err)
      setError('Failed to load your vision data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommit = async () => {
    setIsCommitting(true)
    setError(null)

    try {
      const response = await fetch('/api/viva/assemble-vision-from-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perspective: 'singular' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to assemble vision')
      }

      const data = await response.json()

      if (data.visionId) {
        setVisionId(data.visionId)

        if (isIntensiveMode) {
          const { markIntensiveStep } = await import('@/lib/intensive/checklist')
          const success = await markIntensiveStep('vision_built')
          if (success) setShowStepCompleteModal(true)
        }
      }
    } catch (err) {
      console.error('Assembly error:', err)
      setError(err instanceof Error ? err.message : 'Failed to commit your vision')
    } finally {
      setIsCommitting(false)
    }
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" variant="branded" />
      </div>
    )
  }

  return (
    <Container size="xl">
      <div className="-mt-6 md:-mt-8 flex flex-col gap-8 pt-8 pb-8">
        <Card className={allReady ? '!p-8 border-2 border-primary-500/30 bg-gradient-to-br from-primary-500/5 to-secondary-500/5' : '!p-8 border-neutral-800 bg-neutral-900/40'}>
          <div className="flex flex-col items-center gap-6 text-center">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${allReady ? 'bg-primary-500' : 'bg-neutral-800'}`}>
              {allReady
                ? <CheckCircle className="w-6 h-6 text-black" />
                : <Sparkles className="w-6 h-6 text-neutral-400" />}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {allReady ? 'Ready to Commit' : `${readyCount} of 12 Categories Ready`}
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
                {allReady
                  ? 'Forward and Conclusion have been added automatically and can be edited in the next step. It\u2019s time to commit your vision!'
                  : 'Complete the remaining categories, then come back to assemble.'}
              </p>
            </div>
            {!visionId && allReady && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleCommit}
                disabled={isCommitting}
              >
                {isCommitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Assembling...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Commit My Vision
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Missing categories warning */}
        {!allReady && !visionId && (
          <Card className="border-2 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-medium mb-2">Some categories still need to be built</h3>
                <div className="space-y-1">
                  {categories.filter(c => !c.ready).map(c => (
                    <button
                      key={c.key}
                      onClick={() => router.push(`/intensive/life-vision/create/${c.key}`)}
                      className="block text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {c.label} &rarr;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Category previews with Forward and Conclusion */}
        <div className="space-y-3">
          {/* Forward */}
          {forwardText && (
            <Card className="overflow-hidden !p-0 border-primary-500/20">
              <button
                onClick={() => toggleCategory('forward')}
                className="w-full flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/80 px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={2.25} />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white">Forward</h3>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${expandedCategories.has('forward') ? 'rotate-180' : ''}`} />
              </button>
              {expandedCategories.has('forward') && (
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap p-4 md:p-5">{forwardText}</p>
              )}
            </Card>
          )}

          {categories.map(cat => {
            const categoryData = getVisionCategory(cat.key)
            const IconComponent: LucideIcon = categoryData?.icon || Sparkles
            const isExpanded = expandedCategories.has(cat.key)

            return (
              <Card
                key={cat.key}
                className={`overflow-hidden !p-0 ${cat.ready ? 'border-primary-500/20' : 'border-red-500/20 opacity-70'}`}
              >
                <button
                  onClick={() => cat.ready && toggleCategory(cat.key)}
                  className="w-full flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/80 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent className={`h-4 w-4 shrink-0 ${cat.ready ? 'text-[#39FF14]' : 'text-neutral-500'}`} strokeWidth={2.25} />
                    <h3 className={`text-sm font-semibold uppercase tracking-[0.25em] ${cat.ready ? 'text-white' : 'text-neutral-500'}`}>
                      {cat.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.ready && <CheckCircle className="w-3.5 h-3.5 text-primary-500" />}
                    {cat.ready && (
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </button>
                {isExpanded && cat.text && (
                  <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap p-4 md:p-5">{cat.text}</p>
                )}
              </Card>
            )
          })}

          {/* Conclusion */}
          {conclusionText && (
            <Card className="overflow-hidden !p-0 border-primary-500/20">
              <button
                onClick={() => toggleCategory('conclusion')}
                className="w-full flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/80 px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={2.25} />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white">Conclusion</h3>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${expandedCategories.has('conclusion') ? 'rotate-180' : ''}`} />
              </button>
              {expandedCategories.has('conclusion') && (
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap p-4 md:p-5">{conclusionText}</p>
              )}
            </Card>
          )}
        </div>

        {/* Commit / Complete action */}
        {!visionId && allReady && (
          <Card className="!p-8 border-2 border-primary-500/30 bg-gradient-to-br from-primary-500/5 to-secondary-500/5">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500">
                <CheckCircle className="w-6 h-6 text-black" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Ready to Commit</h2>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
                  Forward and Conclusion have been added automatically and can be edited in the next step. It{'\u2019'}s time to commit your vision!
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCommit}
                disabled={isCommitting}
              >
                {isCommitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Assembling...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Commit My Vision
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Success state */}
        {visionId && (
          <Card className="border-2 border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-secondary-500/5">
            <div className="text-center py-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-black" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Your Life Vision is Complete!</h2>
              <p className="text-neutral-300 mb-8 max-w-xl mx-auto">
                All 12 categories have been assembled with Forward and Conclusion into your Life Vision document.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/intensive/life-vision/${visionId}`)}
              >
                View My Vision
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </Card>
        )}
      </div>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="build_vision"
      />
    </Container>
  )
}
