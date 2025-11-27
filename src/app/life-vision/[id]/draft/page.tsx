'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, Edit3, History, Sparkles, Trash2, Gem, Check, Eye, X } from 'lucide-react'
import { getDraftVision, commitDraft, getRefinedCategories, isCategoryRefined } from '@/lib/life-vision/draft-helpers'
import { 
  Button, 
  Card, 
  Badge, 
  Spinner,
  Icon,
  CategoryCard as SharedCategoryCard,
  VersionBadge,
  StatusBadge,
  CreatedDateBadge
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
  status?: 'draft' | 'complete' | string
  is_active: boolean
  is_draft: boolean
  completion_percent: number
  refined_categories?: string[]
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
              color={isDraft ? NEON_YELLOW : isCompleted ? '#000000' : '#14B8A6'} 
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCommitDialog, setShowCommitDialog] = useState(false)

  // Show commit confirmation dialog
  const handleCommitAsActive = () => {
    if (!draftVision) {
      alert('No draft vision to commit')
      return
    }

    const refinedCount = getRefinedCategories(draftVision).length
    if (refinedCount === 0) {
      alert('No refined categories to commit')
      return
    }

    setShowCommitDialog(true)
  }

  // Commit draft vision as active version
  const confirmCommit = async () => {
    if (!draftVision) return

    setShowCommitDialog(false)
    setIsCommitting(true)
    try {
      // Use the commitDraft helper
      const newActive = await commitDraft(draftVision.id)
      
      console.log('Draft committed successfully:', newActive.id)
      
      // Redirect to the new active vision
      router.push(`/life-vision/${newActive.id}`)
    } catch (error) {
      console.error('Error committing draft:', error)
      alert(`Failed to commit draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCommitting(false)
    }
  }

  // Delete draft vision
  const handleDeleteVersion = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!draftVision) return
    
    setIsDeleting(true)
    setShowDeleteDialog(false)
    
    try {
      const { error } = await supabase
        .from('vision_versions')
        .delete()
        .eq('id', draftVision.id)

      if (error) throw error

      // Redirect back to main vision page
      router.push('/life-vision')
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
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


  // State for non-draft handling
  const [isNonDraft, setIsNonDraft] = useState(false)
  const [nonDraftVision, setNonDraftVision] = useState<VisionData | null>(null)
  const [isCloning, setIsCloning] = useState(false)

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
        console.log('Loading vision for user:', user.id)
        
        // First, load the vision without draft filter to check if it's a draft
        const { data: visionCheck, error: checkError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single()

        if (checkError || !visionCheck) {
          throw new Error('Vision not found')
        }

        // Check if this is actually a draft
        if (visionCheck.is_draft !== true) {
          console.log('Vision is not a draft, showing clone option')
          setIsNonDraft(true)
          setNonDraftVision(visionCheck)
          setLoading(false)
          return
        }

        // It's a draft, proceed normally
        const draftData = visionCheck

        console.log('Loaded draft vision:', {
          id: draftData.id,
          refinedCount: getRefinedCategories(draftData).length,
          refinedCategories: getRefinedCategories(draftData)
        })

        const actualCompletion = calculateCompletion(draftData)
        const completed = getCompletedSections(draftData)
        const refined = getRefinedCategories(draftData)

        setDraftVision(draftData)
        setVision(draftData)
        setCompletionPercentage(actualCompletion)
        setCompletedSections(completed)
        setDraftCategories(refined)
        setActiveCategories(VISION_SECTIONS.map(cat => cat.key).filter(key => !refined.includes(key)))
        
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

  // Handle non-draft vision
  const handleCloneToDraft = async () => {
    if (!nonDraftVision) return
    
    setIsCloning(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get the next version number
      const { data: latestVersion } = await supabase
        .from('vision_versions')
        .select('version_number')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const newVersionNumber = (latestVersion?.version_number || 0) + 1

      // Clone the vision as a draft
      const { data: newDraft, error: insertError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          forward: nonDraftVision.forward,
          fun: nonDraftVision.fun,
          travel: nonDraftVision.travel,
          home: nonDraftVision.home,
          family: nonDraftVision.family,
          love: nonDraftVision.love,
          health: nonDraftVision.health,
          money: nonDraftVision.money,
          work: nonDraftVision.work,
          social: nonDraftVision.social,
          stuff: nonDraftVision.stuff,
          giving: nonDraftVision.giving,
          spirituality: nonDraftVision.spirituality,
          conclusion: nonDraftVision.conclusion,
          version_number: newVersionNumber,
          is_draft: true,
          is_active: false,
          completion_percent: nonDraftVision.completion_percent
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to the new draft
      router.push(`/life-vision/${newDraft.id}/draft`)
    } catch (err) {
      console.error('Error cloning to draft:', err)
      alert('Failed to create draft. Please try again.')
    } finally {
      setIsCloning(false)
    }
  }

  if (isNonDraft && nonDraftVision) {
    return (
      <>
        <Card className="text-center py-16 max-w-2xl mx-auto">
          <div className="text-yellow-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">This Life Vision ID is not a draft</h2>
          <p className="text-neutral-400 mb-6">
            This is an active or completed vision. The draft view is only available for draft visions.
          </p>
          <p className="text-neutral-300 mb-8">
            Would you like to create a draft from this vision to refine it?
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push('/life-vision')} 
              variant="outline"
              disabled={isCloning}
            >
              Back to Visions
            </Button>
            <Button 
              onClick={handleCloneToDraft} 
              variant="primary"
              disabled={isCloning}
              loading={isCloning}
            >
              {isCloning ? 'Creating Draft...' : 'Create Draft'}
            </Button>
          </div>
        </Card>
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

  // Determine display status based on is_active and is_draft
  const getDisplayStatus = () => {
    if (!vision) return 'draft'
    
    const isActive = vision.is_active === true
    const isDraft = vision.is_draft === true
    
    if (isActive && !isDraft) return 'active'
    else if (!isActive && isDraft) return 'draft'
    else return 'complete'
  }

  const displayStatus = getDisplayStatus()

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  THE LIFE I CHOOSE
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                  Draft Life Vision
                </h1>
                <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                  Refined categories will show in yellow. Once you are happy with your refinement(s), click "Commit as Active Vision"
                </p>
              </div>
              
              {/* Version Info & Status Badges */}
              <div className="text-center mb-6">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  
                  {/* Version Circle Badge */}
                  {vision && (
                    <VersionBadge 
                      versionNumber={vision.version_number} 
                      status={displayStatus} 
                    />
                  )}
                  
                  {/* Created Date Badge */}
                  {vision && (
                    <CreatedDateBadge createdAt={vision.created_at} />
                  )}
                  
                  {/* Status Badge */}
                  <StatusBadge 
                    status={displayStatus} 
                    subtle={displayStatus !== 'active'}
                  />
                  
                  {/* Draft Categories Count */}
                  {draftCategories.length > 0 && (
                    <Badge 
                      variant="warning" 
                      className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
                    >
                      {draftCategories.length} of {VISION_SECTIONS.length} Refined
                    </Badge>
                  )}
                  
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-3xl mx-auto">
                <Button
                  onClick={() => router.push(`/life-vision/${vision?.id}/refine`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm bg-[#FFFF00]/20 text-[#FFFF00] hover:bg-[#FFFF00]/30"
                >
                  <Icon icon={Gem} size="sm" className="shrink-0" />
                  <span>Continue Refining</span>
                </Button>
                
                <Button
                  onClick={handleCommitAsActive}
                  disabled={isCommitting || draftCategories.length === 0}
                  variant="primary"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  {isCommitting ? (
                    <>
                      <Spinner variant="primary" size="sm" />
                      <span>Committing...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={CheckCircle} size="sm" className="shrink-0" />
                      <span>Commit as Active Vision</span>
                    </>
                  )}
                </Button>
              </div>
              
            </div>
          </div>
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
                    <span className="md:ml-2 block md:inline" style={{ color: NEON_YELLOW }}>
                      <span className="hidden md:inline">• </span>{draftCategories.length} refined
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

            {/* Category Grid - Matches design system template pattern exactly */}
            <div className="grid grid-cols-4 md:grid-cols-7 lg:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
              {VISION_SECTIONS.map((category) => {
                const isRefined = draftVision ? isCategoryRefined(draftVision, category.key) : false
                const isSelected = selectedCategories.includes(category.key)
                
                return (
                  <CategoryCard 
                    key={category.key}
                    category={category} 
                    selected={isSelected}
                    onClick={() => handleCategoryToggle(category.key)}
                    className={isSelected ? (isRefined ? '!bg-[rgba(255,255,0,0.2)] !border-[rgba(255,255,0,0.2)] hover:!bg-[rgba(255,255,0,0.1)]' : '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]') : ''}
                  />
                )
              })}
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
              const isDraft = draftVision ? isCategoryRefined(draftVision, categoryKey) : false
              
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

      {/* Delete Vision Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleDeleteVersion}
          variant="danger"
          size="sm"
          disabled={isDeleting}
          className="flex items-center gap-2 mx-auto"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Deleting...' : 'Delete Vision'}
        </Button>
      </div>

      {/* Commit Confirmation Dialog */}
      {showCommitDialog && draftVision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Commit Draft as Active Vision?
              </h3>
              <button
                onClick={() => setShowCommitDialog(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-neutral-300 mb-4">
              Are you sure you want to commit this draft vision as your active vision? 
            </p>
            <p className="text-neutral-400 text-sm mb-6">
              This will create a new version with {getRefinedCategories(draftVision).length} refined {getRefinedCategories(draftVision).length === 1 ? 'category' : 'categories'}.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCommitDialog(false)}
                disabled={isCommitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmCommit}
                disabled={isCommitting}
                className="flex-1"
              >
                {isCommitting ? 'Committing...' : 'Commit as Active'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Delete Draft Vision?
              </h3>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-neutral-300 mb-6">
              Are you sure you want to delete this draft vision? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

