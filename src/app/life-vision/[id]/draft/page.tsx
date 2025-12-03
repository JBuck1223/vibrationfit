'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Eye, Gem, Download, VolumeX, Edit3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDraftVision, commitDraft, getRefinedCategories, isCategoryRefined } from '@/lib/life-vision/draft-helpers'
import { calculateVersionNumber } from '@/lib/life-vision/version-helpers'
import { 
  Button, 
  Card, 
  Spinner,
  Icon,
  VersionBadge,
  StatusBadge,
  CreatedDateBadge,
  WarningConfirmationDialog
} from '@/lib/design-system/components'
import { VisionCategoryCard } from '../../components/VisionCategoryCard'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { colors } from '@/lib/design-system/tokens'

// Use centralized vision categories
const VISION_SECTIONS = VISION_CATEGORIES

// Neon Yellow from design tokens
const NEON_YELLOW = colors.energy.yellow[500]

interface VisionData {
  id: string
  user_id: string
  version_number: number
  forward: string
  conclusion: string
  perspective: string
  title: string
  is_active: boolean
  is_draft: boolean
  completion_percent?: number
  created_at: string
  updated_at: string
  refined_categories?: string[]
  // Vision category fields
  fun: string
  health: string
  travel: string
  love: string
  family: string
  social: string
  home: string
  work: string
  money: string
  stuff: string
  giving: string
  spirituality: string
}

function calculateCompletionPercentage(vision: VisionData) {
  const sections = VISION_SECTIONS.map(section => vision[section.key as keyof VisionData] as string)
  const filledSections = sections.filter(section => String(section || '').trim().length > 0).length
  const totalSections = VISION_SECTIONS.length
  return Math.round((filledSections / totalSections) * 100)
}

export default function VisionDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [draftVision, setDraftVision] = useState<VisionData | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [isNotDraft, setIsNotDraft] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

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

  // Confirm commit
  const confirmCommit = async () => {
    if (!draftVision) return

    setShowCommitDialog(false)
    setIsCommitting(true)

    try {
      const committedVision = await commitDraft(draftVision.id)
      
      // Navigate to the new active vision
      router.push(`/life-vision/${committedVision.id}`)
    } catch (err) {
      console.error('Error committing draft:', err)
      alert('Failed to commit draft as active vision')
    } finally {
      setIsCommitting(false)
    }
  }

  // Load draft vision
  const loadDraftVision = useCallback(async (draftId: string, userId: string) => {
    try {
      console.log('Loading draft vision:', draftId)
      
      // Fetch the draft
      const { data: draftData, error: draftError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', userId)
        .single()

      if (draftError || !draftData || !draftData.is_draft) {
        // Try to fetch as active vision to show "create draft" prompt
        const { data: activeVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', draftId)
          .eq('user_id', userId)
          .single()

        if (activeVision && !activeVision.is_draft) {
          setError('This Life Vision ID is not a draft.')
          setIsNotDraft(true)
          setVision(activeVision)
          return
        }

        throw new Error('Draft vision not found')
      }

      console.log('Draft vision loaded:', draftData)
      
      // Calculate the actual version number based on creation order
      const calculatedVersion = await calculateVersionNumber(draftData.id)
      const visionWithVersion = { ...draftData, version_number: calculatedVersion }
      
      setDraftVision(visionWithVersion)
      setVision(visionWithVersion)

      const completion = calculateCompletionPercentage(visionWithVersion)
      setCompletionPercentage(completion)
    } catch (err) {
      console.error('Error loading draft vision:', err)
      setError('Failed to load draft vision')
    }
  }, [supabase])

  useEffect(() => {
    const loadVisionById = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)

        // Resolve params
        const resolvedParams = await params
        const visionId = resolvedParams.id

        console.log('Loading vision by ID:', visionId)

        // Load the draft vision
        await loadDraftVision(visionId, currentUser.id)
      } catch (err) {
        console.error('Error in loadVisionById:', err)
        setError('Failed to load vision')
      } finally {
        setLoading(false)
      }
    }

    loadVisionById()
  }, [params, router, supabase, loadDraftVision])

  // Handle creating a draft from active vision
  const handleCreateDraft = async () => {
    if (!vision || !user) return

    try {
      setLoading(true)
      
      // Check if draft already exists
      const { data: existingDraft } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        router.push(`/life-vision/${existingDraft.id}/draft`)
        return
      }

      // Clone this vision as a draft
      const { data: newDraft, error } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          parent_id: vision.id, // Track where this draft came from
          title: vision.title,
          perspective: vision.perspective,
          forward: vision.forward,
          conclusion: vision.conclusion,
          fun: vision.fun,
          health: vision.health,
          travel: vision.travel,
          love: vision.love,
          family: vision.family,
          social: vision.social,
          home: vision.home,
          work: vision.work,
          money: vision.money,
          stuff: vision.stuff,
          giving: vision.giving,
          spirituality: vision.spirituality,
          is_draft: true,
          is_active: false
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/life-vision/${newDraft.id}/draft`)
    } catch (err) {
      console.error('Error creating draft:', err)
      alert('Failed to create draft')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit category
  const handleEditCategory = (categoryKey: string) => {
    if (!vision) return
    const content = vision[categoryKey as keyof VisionData] as string
    setEditContent(content || '')
    setEditingCategory(categoryKey)
  }

  // Handle update content
  const handleUpdateContent = (content: string) => {
    setEditContent(content)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!vision || !editingCategory) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('vision_versions')
        .update({ [editingCategory]: editContent })
        .eq('id', vision.id)

      if (error) throw error

      // Reload the draft vision to get updated refined_categories from database trigger
      const { data: updatedDraft } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', vision.id)
        .single()

      if (updatedDraft) {
        setVision(updatedDraft)
        setDraftVision(updatedDraft)
        
        // Recalculate completion
        const completion = calculateCompletionPercentage(updatedDraft)
        setCompletionPercentage(completion)
      }

      setEditingCategory(null)
      setEditContent('')
    } catch (err) {
      console.error('Error saving edit:', err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditContent('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (error && isNotDraft && vision) {
    return (
      <Card className="text-center py-16">
        <div className="text-secondary-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">This Life Vision is Not a Draft</h2>
        <p className="text-neutral-400 mb-6">{error}</p>
        <p className="text-neutral-400 mb-6">Would you like to create a draft from this vision?</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleCreateDraft} variant="primary">
            Create Draft
          </Button>
          <Button onClick={() => router.push('/life-vision')} variant="outline">
            Back to Life Vision
          </Button>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-16">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Error Loading Draft</h2>
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
    )
  }

  if (!vision || !draftVision) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Draft not found</h2>
        <p className="text-neutral-400 mb-6">This draft doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/life-vision">Back to Life Visions</Link>
        </Button>
      </Card>
    )
  }

  const refinedCount = getRefinedCategories(draftVision).length

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        {/* Subtle Gradient Background */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          {/* Modern Enhanced Layout with Card Container */}
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  DRAFT VISION
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                  Refine Your Life Vision
                </h1>
                <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                  Refined categories will show in yellow. Once you are happy with your refinement(s), click "Commit as Active Vision"
                </p>
              </div>
              
              {/* Centered Version Info with Enhanced Styling */}
              <div className="text-center mb-6">
                {/* Version, Status & Date Badges */}
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <VersionBadge 
                    versionNumber={vision.version_number} 
                    status="draft" 
                  />
                  <CreatedDateBadge createdAt={vision.created_at} />
                  <StatusBadge status="draft" subtle={false} />
                  {refinedCount > 0 && (
                    <div 
                      className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: `${NEON_YELLOW}20`, color: NEON_YELLOW }}
                    >
                      {refinedCount} Refined
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Enhanced with Hover Effects */}
              <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                <Button
                  onClick={() => router.push('/life-vision')}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Eye} size="sm" className="shrink-0" />
                  <span>All Visions</span>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm bg-[#FFFF00]/20 text-[#FFFF00] hover:bg-[#FFFF00]/30"
                >
                  <Link href={`/life-vision/${vision.id}/refine`}>
                    <Icon icon={Gem} size="sm" className="shrink-0" />
                    <span>Refine with VIVA</span>
                  </Link>
                </Button>
                <Button
                  onClick={handleCommitAsActive}
                  disabled={isCommitting || refinedCount === 0}
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

      {/* Vision Categories Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {VISION_SECTIONS.map((category) => {
          const categoryKey = category.key
          const originalContent = vision[categoryKey as keyof VisionData] as string
          const isEditing = editingCategory === categoryKey
          const content = isEditing ? editContent : originalContent
          const isDraft = isCategoryRefined(draftVision, categoryKey)
          
          return (
            <VisionCategoryCard
              key={categoryKey}
              category={category}
              content={content}
              isEditing={isEditing}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onUpdate={handleUpdateContent}
              saving={saving}
              onEditCategory={handleEditCategory}
              vision={vision}
              editable={true}
              isRefined={isDraft}
            />
          )
        })}
      </div>

      {/* Commit Confirmation Dialog */}
      <WarningConfirmationDialog
        isOpen={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        onConfirm={confirmCommit}
        title="Commit Draft as Active Vision?"
        message={`Are you sure you want to commit this draft vision with ${refinedCount} refined ${refinedCount === 1 ? 'category' : 'categories'} as your active vision? This will create a new version.`}
        confirmText={isCommitting ? 'Committing...' : 'Commit as Active Vision'}
        type="commit"
        isLoading={isCommitting}
      />
    </>
  )
}
