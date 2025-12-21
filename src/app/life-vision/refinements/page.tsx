'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock,
  CheckCircle,
  Edit,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react'
import { 
  Card, 
  Button, 
  Badge, 
  Spinner,
  Container,
  PageHero,
  Stack,
  CategoryCard
} from '@/lib/design-system'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VisionRefinement } from '@/lib/life-vision/refinement-helpers'

interface RefinementWithVision extends VisionRefinement {
  vision?: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    created_at: string
  }
}

export default function RefinementsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [refinements, setRefinements] = useState<RefinementWithVision[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'pending'>('all')

  useEffect(() => {
    loadRefinements()
  }, [])

  const loadRefinements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch all refinements with vision data
      const { data, error } = await supabase
        .from('vision_refinements')
        .select(`
          *,
          vision:vision_versions!vision_refinements_vision_id_fkey (
            id,
            version_number,
            is_draft,
            is_active,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRefinements(data as RefinementWithVision[])
    } catch (error) {
      console.error('Error loading refinements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRefinements = refinements.filter(ref => {
    if (filterCategory && ref.category !== filterCategory) return false
    if (filterStatus === 'applied' && !ref.applied) return false
    if (filterStatus === 'pending' && ref.applied) return false
    return true
  })

  const handleRefinementClick = (refinement: RefinementWithVision) => {
    // Only clickable if it's for a draft vision
    if (refinement.vision?.is_draft) {
      router.push(`/life-vision/${refinement.vision_id}/refine?category=${refinement.category}`)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="REFINEMENT HISTORY"
          title="Vision Refinements"
          subtitle="View your complete history of VIVA refinements across all visions"
        />

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-300">Filters:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  size="sm"
                >
                  All ({refinements.length})
                </Button>
                <Button
                  onClick={() => setFilterStatus('applied')}
                  variant={filterStatus === 'applied' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Applied ({refinements.filter(r => r.applied).length})
                </Button>
                <Button
                  onClick={() => setFilterStatus('pending')}
                  variant={filterStatus === 'pending' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Pending ({refinements.filter(r => !r.applied).length})
                </Button>
              </div>

              {/* Category Filter */}
              {filterCategory && (
                <Button
                  onClick={() => setFilterCategory(null)}
                  variant="outline"
                  size="sm"
                >
                  Clear Category Filter
                </Button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {VISION_CATEGORIES.map(cat => {
              const count = refinements.filter(r => r.category === cat.key).length
              if (count === 0) return null
              
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilterCategory(cat.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterCategory === cat.key
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  <cat.icon className="w-3 h-3 inline mr-1" />
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>
        </Card>

        {/* Refinements List */}
        {filteredRefinements.length === 0 ? (
          <Card className="text-center py-16">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No Refinements Found</h3>
            <p className="text-neutral-400 mb-6">
              {filterCategory || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Start refining your vision to see your history here'}
            </p>
            <Button
              onClick={() => router.push('/life-vision')}
              variant="primary"
            >
              Go to Vision
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRefinements.map((refinement) => {
              const categoryInfo = getVisionCategory(refinement.category as any)
              const isClickable = refinement.vision?.is_draft
              const hasWeave = refinement.weave_settings?.enabled
              
              return (
                <Card
                  key={refinement.id}
                  className={`${
                    isClickable 
                      ? 'cursor-pointer hover:border-primary-500 transition-all hover:translate-y-[-2px]' 
                      : 'opacity-75'
                  }`}
                  onClick={() => isClickable && handleRefinementClick(refinement)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Category & Status */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      {categoryInfo && (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center flex-shrink-0">
                          <categoryInfo.icon className="w-6 h-6 text-primary-500" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {categoryInfo?.label || refinement.category}
                          </h3>
                          
                          {refinement.applied ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Applied
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          )}
                          
                          {hasWeave && (
                            <Badge variant="accent" className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Weave
                            </Badge>
                          )}
                        </div>

                        {/* Vision Info */}
                        <div className="flex items-center gap-3 text-sm text-neutral-400 mb-3">
                          <span>
                            {refinement.vision?.is_draft && <span className="text-yellow-500">Draft </span>}
                            {refinement.vision?.is_active && <span className="text-green-500">Active </span>}
                            Vision V{refinement.vision?.version_number || '?'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(refinement.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Output Preview */}
                        <p className="text-sm text-neutral-300 line-clamp-2">
                          {refinement.output_text}
                        </p>
                      </div>
                    </div>

                    {/* Right: Action */}
                    {isClickable && (
                      <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}

