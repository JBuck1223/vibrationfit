'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, Edit3, History, Sparkles, Trash2, Gem, Check, Eye } from 'lucide-react'
import { 
  Button, 
  Card, 
  Badge, 
  Spinner,
  Icon,
  CategoryCard as SharedCategoryCard
} from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

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
  status: 'draft' | 'complete' | string
  completion_percent: number
  created_at: string
  updated_at: string
}

// Use centralized vision categories
const VISION_SECTIONS = VISION_CATEGORIES

// Neon Yellow from design tokens
const NEON_YELLOW = colors.energy.yellow[500]

// VisionCard component for draft view
const VisionCard = ({ 
  category, 
  content, 
  isDraft,
  vision
}: { 
  category: any, 
  content: string,
  isDraft: boolean,
  vision: any
}) => {
  const isCompleted = content?.trim().length > 0
  
  return (
    <Card 
      className="transition-all duration-300 hover:shadow-lg"
      style={isDraft ? { border: `2px solid ${NEON_YELLOW}` } : undefined}
    >
      <div className="px-1 py-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDraft ? '' : isCompleted ? 'bg-primary-500' : 'bg-neutral-700'
            }`}
            style={isDraft ? { backgroundColor: `${NEON_YELLOW}33`, border: `2px solid ${NEON_YELLOW}` } : undefined}
          >
            <Icon 
              icon={category.icon} 
              size="sm" 
              color={isDraft ? NEON_YELLOW : isCompleted ? '#FFFFFF' : '#14B8A6'} 
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{category.label}</h3>
            <p className="text-sm text-neutral-400">{category.description}</p>
          </div>
        </div>

        {/* Content Display */}
        <div className="mb-4">
          {content?.trim() ? (
            <div 
              className={`bg-neutral-800/50 border rounded-lg px-1 py-3 md:p-4 ${!isDraft ? 'border-neutral-700' : ''}`}
              style={isDraft ? { border: `2px solid ${NEON_YELLOW}80` } : undefined}
            >
              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                {content}
              </p>
            </div>
          ) : (
            <div className="bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg px-2 py-4 md:p-8 text-center">
              <p className="text-neutral-500 mb-3">No content for this section yet</p>
              <Button
                asChild
                variant="primary"
                size="sm"
                className="flex items-center gap-2 mx-auto"
              >
                <Link href={`/life-vision/${vision?.id}/refine?category=${category.key}`}>
                  <Edit3 className="w-4 h-4" />
                  Add Content
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {content?.trim() && (
          <div className="flex justify-end gap-2">
            <Button
              asChild
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
              style={isDraft ? {
                backgroundColor: NEON_YELLOW,
                color: '#000000',
                border: '2px solid transparent'
              } : undefined}
              onMouseEnter={(e) => {
                if (isDraft && e.currentTarget) {
                  e.currentTarget.style.backgroundColor = `${NEON_YELLOW}E6`
                  e.currentTarget.style.borderColor = NEON_YELLOW
                }
              }}
              onMouseLeave={(e) => {
                if (isDraft && e.currentTarget) {
                  e.currentTarget.style.backgroundColor = NEON_YELLOW
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <Link href={`/life-vision/${vision?.id}/refine?category=${category.key}`}>
                <Gem className="w-4 h-4" />
                {isDraft ? 'Edit Draft' : 'Refine'}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function VisionDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [draftVision, setDraftVision] = useState<VisionData | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [draftCategories, setDraftCategories] = useState<string[]>([])
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isCommitting, setIsCommitting] = useState(false)

  // Commit draft vision as active version
  const commitDraftAsActive = async () => {
    if (!draftVision || !vision || draftCategories.length === 0) {
      alert('No draft changes to commit')
      return
    }

    if (!confirm('Are you sure you want to commit this draft vision as your active vision? This will create a new version.')) {
      return
    }

    setIsCommitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to commit your vision')
        return
      }

      // Create new vision version with draft refinements
      const { data: newVersion, error: versionError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          forward: draftVision.forward || '',
          fun: draftVision.fun || '',
          travel: draftVision.travel || '',
          home: draftVision.home || '',
          family: draftVision.family || '',
          love: draftVision.love || '',
          health: draftVision.health || '',
          money: draftVision.money || '',
          work: draftVision.work || '',
          social: draftVision.social || '',
          stuff: draftVision.stuff || '',
          giving: draftVision.giving || '',
          spirituality: draftVision.spirituality || '',
          conclusion: draftVision.conclusion || '',
          version_number: (vision.version_number || 0) + 1,
          status: 'complete',
          completion_percent: completionPercentage
        })
        .select()
        .single()

      if (versionError) {
        console.error('Error creating new version:', versionError)
        throw versionError
      }

      // Delete all committed refinements
      const { error: deleteError } = await supabase
        .from('refinements')
        .delete()
        .eq('user_id', user.id)
        .eq('vision_id', vision.id)
        .eq('operation_type', 'refine_vision')

      if (deleteError) {
        console.error('Error deleting refinements:', deleteError)
        // Don't throw - the version was created successfully
      }

      // Redirect to the new active vision
      router.push(`/life-vision/${newVersion.id}`)
    } catch (error) {
      console.error('Error committing draft:', error)
      alert(`Failed to commit draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCommitting(false)
    }
  }

  // Card-based view functions
  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === VISION_SECTIONS.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(VISION_SECTIONS.map(cat => cat.key))
    }
  }

  // Calculate completion percentage
  const calculateCompletion = useCallback((data: VisionData) => {
    const sections = VISION_SECTIONS.map(section => data[section.key as keyof VisionData] as string)
    const filledSections = sections.filter(section => section?.trim().length > 0).length
    const totalSections = VISION_SECTIONS.length
    return Math.round((filledSections / totalSections) * 100)
  }, [])

  // Get completed sections
  const getCompletedSections = useCallback((data: VisionData) => {
    const completed: string[] = []
    
    VISION_SECTIONS.forEach(section => {
      const value = data[section.key as keyof VisionData]
      if (typeof value === 'string' && value.trim()) {
        completed.push(section.key)
      }
    })
    
    return completed
  }, [])


  // Load draft vision data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No authenticated user found')
          router.push('/auth/login')
          return
        }

        const resolvedParams = await params
        console.log('Loading draft vision with ID:', resolvedParams.id)
        
        // Load the active vision first
        const visionResponse = await fetch(`/api/vision?id=${resolvedParams.id}&includeVersions=true&t=${Date.now()}`)
        
        if (!visionResponse.ok) {
          const errorData = await visionResponse.json()
          throw new Error(errorData.error || 'Failed to load vision')
        }
        
        const visionData = await visionResponse.json()
        const { vision: activeVision } = visionData
        
        if (!activeVision) {
          throw new Error('Vision not found')
        }

        setVision(activeVision)

        // Load draft vision (combines active + refinements)
        const draftResponse = await fetch(`/api/vision/draft?id=${resolvedParams.id}&t=${Date.now()}`)
        
        if (!draftResponse.ok) {
          const errorData = await draftResponse.json()
          throw new Error(errorData.error || 'Failed to load draft vision')
        }
        
        const draftData = await draftResponse.json()
        const { draftVision: combinedDraft, draftCategories, activeCategories } = draftData

        console.log('Loaded draft vision data:', {
          draftCount: draftCategories.length,
          activeCount: activeCategories.length,
          totalCategories: VISION_SECTIONS.length
        })

        const actualCompletion = calculateCompletion(combinedDraft)
        const completed = getCompletedSections(combinedDraft)

        setDraftVision(combinedDraft)
        setCompletionPercentage(actualCompletion)
        setCompletedSections(completed)
        setDraftCategories(draftCategories || [])
        setActiveCategories(activeCategories || [])
        
        // Initialize with all categories selected
        setSelectedCategories(VISION_SECTIONS.map(cat => cat.key))
      } catch (error) {
        console.error('Error loading draft vision:', error)
        setError(error instanceof Error ? error.message : 'Failed to load draft vision')
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, supabase, calculateCompletion, getCompletedSections])


  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Card className="text-center py-16">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Draft Vision</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => router.push('/life-vision')} variant="outline">
              Back to Life Vision
            </Button>
          </div>
        </Card>
      </>
    )
  }

  if (!draftVision) {
    return (
      <>
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Draft Vision not found</h2>
          <p className="text-neutral-400 mb-6">This draft vision doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/life-vision">Back to Life Visions</Link>
          </Button>
        </Card>
      </>
    )
  }

  // CategoryCard with draft indicator support
  const CategoryCard = ({ category, selected, onClick, className = '' }: { 
    category: any, 
    selected: boolean, 
    onClick: () => void, 
    className?: string 
  }) => {
    const isDraft = draftCategories.includes(category.key)
    return (
      <SharedCategoryCard
        category={category}
        selected={!isDraft && selected}
        onClick={onClick}
        variant="outlined"
        selectionStyle="border"
        iconColor={isDraft ? NEON_YELLOW : '#14B8A6'}
        selectedIconColor="#39FF14"
        className={`${isDraft ? '!border-2' : ''} ${className}`}
        style={isDraft ? { borderColor: NEON_YELLOW } : undefined}
      />
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white">
            Draft Life Vision
          </h1>
          <p className="text-neutral-400 mt-2">
            Preview your refined vision with {draftCategories.length} draft {draftCategories.length === 1 ? 'category' : 'categories'} and {activeCategories.length} active {activeCategories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        
        {/* Version Info */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${NEON_YELLOW}33`, color: NEON_YELLOW }}>
              Draft Preview
            </span>
            <Badge variant="warning">
              <Circle className="w-4 h-4 mr-1" />
              {draftCategories.length} of {VISION_SECTIONS.length} Categories Drafted
            </Badge>
          </div>
          
          {/* Created Date */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <div className="text-xs md:text-sm">
                <p className="text-white font-medium">
                  Based on version {vision?.version_number || 1} • {new Date(vision?.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-center mb-6">
          <Button
            onClick={() => router.push(`/life-vision/${vision?.id}`)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Active
          </Button>
          <Button
            onClick={() => router.push(`/life-vision/${vision?.id}/refine`)}
            variant="outline"
            className="flex items-center gap-2 font-semibold"
            style={{
              backgroundColor: NEON_YELLOW,
              color: '#000000',
              border: `2px solid ${NEON_YELLOW}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${NEON_YELLOW}E6`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = NEON_YELLOW
            }}
          >
            <Gem className="w-4 h-4" />
            Continue Refining
          </Button>
          <Button
            onClick={commitDraftAsActive}
            disabled={isCommitting || draftCategories.length === 0}
            variant="primary"
            className="flex items-center gap-2"
          >
            {isCommitting ? (
              <>
                <Spinner variant="primary" size="sm" />
                Committing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Commit as Active Vision
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Vision Cards */}
      <div className="space-y-6">
        {/* Compact Category Selection */}
        <div className="mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Select Life Areas</h3>
                <p className="text-sm text-neutral-400">
                  Showing {selectedCategories.length} of {VISION_SECTIONS.length} areas
                  {draftCategories.length > 0 && (
                    <span className="ml-2" style={{ color: NEON_YELLOW }}>
                      • {draftCategories.length} in draft
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={handleSelectAll}
                variant={selectedCategories.length === VISION_SECTIONS.length ? "primary" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {selectedCategories.length === VISION_SECTIONS.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-4 md:grid-cols-7 lg:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
              {VISION_SECTIONS.map((category) => (
                <CategoryCard 
                  key={category.key} 
                  category={category} 
                  selected={selectedCategories.includes(category.key)} 
                  onClick={() => handleCategoryToggle(category.key)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Vision Cards */}
        {selectedCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {selectedCategories.map((categoryKey) => {
              const category = VISION_SECTIONS.find(cat => cat.key === categoryKey)
              if (!category) return null
              
              const content = draftVision?.[categoryKey as keyof VisionData] as string || ''
              const isDraft = draftCategories.includes(categoryKey)
              
              return (
                <VisionCard
                  key={categoryKey}
                  category={category}
                  content={content}
                  isDraft={isDraft}
                  vision={vision}
                />
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-neutral-400 mb-4">Select categories above to view your draft vision</p>
            <Button onClick={handleSelectAll} variant="primary">
              Select All Categories
            </Button>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Link 
          href={`/life-vision/${vision?.id}`} 
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ← Back to Active Vision
        </Link>
      </div>
    </>
  )
}
