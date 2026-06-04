'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Stack,
  Spinner,
  Card,
  Button,
  FullBleed,
} from '@/lib/design-system/components'
import { CategoryGrid } from '@/lib/design-system'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'

const VISION_SECTIONS = VISION_CATEGORIES

interface VisionData {
  id: string
  user_id: string
  version_number: number
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  love: string
  health: string
  money: string
  work: string
  social: string
  stuff: string
  giving: string
  spirituality: string
  conclusion: string
  is_active: boolean
  is_draft: boolean
  completion_percent: number
  refined_categories?: string[]
  created_at: string
  updated_at: string
}

export default function IntensiveVisionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => {
      if (prev.length === VISION_SECTIONS.length) return [categoryKey]
      return prev.includes(categoryKey)
        ? prev.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    })
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === VISION_SECTIONS.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(VISION_SECTIONS.map(cat => cat.key))
    }
  }


  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      const supabase = createClient()

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        const resolvedParams = await params
        if (!isMounted) return

        const response = await fetch(`/api/vision?id=${resolvedParams.id}&t=${Date.now()}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load vision')
        }

        const data = await response.json()
        if (!data.vision) throw new Error('Vision not found')

        if (isMounted) {
          setVision(data.vision)
          setSelectedCategories(VISION_SECTIONS.map(cat => cat.key))

          const { data: checklist } = await supabase
            .from('intensive_checklist')
            .select('vision_built, vision_built_at')
            .eq('user_id', session.user.id)
            .in('status', ['pending', 'in_progress'])
            .maybeSingle()

          if (checklist?.vision_built && checklist.vision_built_at) {
            setStepCompleted(checklist.vision_built_at)
          }
        }
      } catch (err) {
        console.error('Error loading vision:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load vision')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
      setStepCompleted(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !vision) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            {error ? 'Error Loading Vision' : 'Vision not found'}
          </h2>
          <p className="text-neutral-400 mb-6">
            {error || "This vision doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => router.push('/intensive/life-vision/create')} variant="primary">
            Back to Life Vision
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <div className="pb-6">
      <Stack gap="md">
        <FullBleed>
          <CategoryGrid
            categories={VISION_SECTIONS}
            selectedCategories={selectedCategories}
            onCategoryClick={handleCategoryToggle}
            showSelectAll
            onSelectAll={handleSelectAll}
            lifeVisionCategoryStrip
            pillLabel="Life Areas"
          />
        </FullBleed>

        {selectedCategories.length > 0 ? (
          <>
            {selectedCategories.map((categoryKey) => {
              const categoryData = getVisionCategory(categoryKey as any)
              if (!categoryData) return null

              const content = (vision[categoryKey as keyof VisionData] as string) || ''
              const IconComponent: LucideIcon = categoryData.icon || Sparkles

              return (
                <Card key={categoryKey} className="overflow-hidden !p-0 border-primary-500/20">
                  <div className="flex items-center gap-2.5 border-b border-neutral-800 bg-neutral-900/80 px-4 py-3">
                    <IconComponent className="h-4 w-4 shrink-0 text-[#39FF14]" strokeWidth={2.25} />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white">
                      {categoryData.label}
                    </h3>
                  </div>
                  <div className="px-5 py-4">
                    {content?.trim() ? (
                      <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                        {content}
                      </p>
                    ) : (
                      <p className="text-neutral-500 text-sm text-center py-4">No content for this section yet.</p>
                    )}
                  </div>
                </Card>
              )
            })}
          </>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Tap a category above to view it.
          </div>
        )}
      </Stack>
    </div>
  )
}
