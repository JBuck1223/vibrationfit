'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gem, Copy, Sparkles, X, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDraftVision, commitDraft, getDraftCategories } from '@/lib/life-vision/draft-helpers'
import { calculateVersionNumber } from '@/lib/life-vision/version-helpers'
import { 
  Button, 
  Card, 
  Spinner,
  Icon,
  VersionBadge,
  StatusBadge,
  Badge,
  Container,
  Stack,
  CategoryGrid,
  FullBleed,
  ProgressBar,
  IntensiveStepCompleteModal
} from '@/lib/design-system/components'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import { VersionActionToolbar } from '@/components/VersionActionToolbar'
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
  household_id?: string | null
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
  const [activeVision, setActiveVision] = useState<VisionData | null>(null)
  const [refinedCategories, setRefinedCategories] = useState<string[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [committedVisionId, setCommittedVisionId] = useState<string | null>(null)
  const [isNotDraft, setIsNotDraft] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [deletingDraft, setDeletingDraft] = useState(false)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    VISION_SECTIONS.map(cat => cat.key)
  )

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => {
      // If all are selected, clicking one category isolates that category.
      if (prev.length === VISION_SECTIONS.length) {
        return [categoryKey]
      }
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

  const hasActiveVision = !!activeVision

  // Page copy renders in the Life Vision area bar instead of an in-page hero
  useLifeVisionStudioAreaChrome(
    draftVision
      ? {
          contextEyebrow: draftVision.household_id ? 'The Life We Choose' : undefined,
          contextText: 'Refined categories show in yellow. Once you are happy with your refinements, commit this draft as your active vision.',
        }
      : null
  )

  // Confirm commit (confirmation handled by VersionActionToolbar's dialog)
  const confirmCommit = async () => {
    if (!draftVision) return

    // Only require refined categories when there's an active vision to compare against
    if (hasActiveVision && refinedCategories.length === 0) {
      alert('No refined categories to commit')
      return
    }

    setIsCommitting(true)

    try {
      const committedVision = await commitDraft(draftVision.id)
      
      // Navigate to the new active vision
      router.push(`/life-vision/${committedVision.id}`)
    } catch (err) {
      console.error('Error committing draft:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to commit draft as active vision: ${errorMessage}`)
    } finally {
      setIsCommitting(false)
    }
  }

  // Confirm delete (confirmation handled by VersionActionToolbar's dialog)
  const confirmDelete = async () => {
    if (!draftVision) return

    setDeletingDraft(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to delete a draft')
        setDeletingDraft(false)
        return
      }

      console.log('Attempting to delete draft:', draftVision.id, 'for user:', user.id)

      // Use API route to delete (bypasses RLS recursion issues)
      const response = await fetch(`/api/vision?id=${draftVision.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to delete draft: ${errorData.error || 'Unknown error'}`)
        setDeletingDraft(false)
        return
      }

      console.log('Draft deleted successfully')
      // Navigate back to appropriate page (household or personal)
      if (draftVision.household_id) {
        router.push('/life-vision/household')
      } else {
        router.push('/life-vision')
      }
    } catch (err) {
      console.error('Error deleting draft:', err)
      alert('Failed to delete draft. Please try again.')
      setDeletingDraft(false)
    }
  }

  // Load draft vision. No user_id filter: RLS scopes access to the user's own
  // visions plus household visions, so household drafts created by another
  // member load too.
  const loadDraftVision = useCallback(async (draftId: string, userId: string) => {
    try {
      console.log('Loading draft vision:', draftId)
      
      // Fetch the draft
      const { data: draftData, error: draftError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', draftId)
        .single()

      if (draftError || !draftData || !draftData.is_draft) {
        // Try to fetch as active vision to show "create draft" prompt
        const { data: activeVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', draftId)
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

      // Check if in intensive mode
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
      }

      // Fetch the active vision for comparison — from the same document group
      // (household drafts compare against the active household vision).
      let activeQuery = supabase
        .from('vision_versions')
        .select('*')
        .eq('is_active', true)
        .eq('is_draft', false)
      activeQuery = draftData.household_id
        ? activeQuery.eq('household_id', draftData.household_id)
        : activeQuery.eq('user_id', userId).is('household_id', null)
      const { data: activeVisionData } = await activeQuery.maybeSingle()
      
      if (activeVisionData) {
        const activeVersion = await calculateVersionNumber(activeVisionData.id)
        const activeWithVersion = { ...activeVisionData, version_number: activeVersion }
        setActiveVision(activeWithVersion)
        console.log('Active vision loaded for comparison:', activeVisionData.id, 'Version:', activeVersion)
      }

      const completion = calculateCompletionPercentage(visionWithVersion)
      setCompletionPercentage(completion)
    } catch (err) {
      console.error('Error loading draft vision:', err)
      setError('Failed to load draft vision')
    }
  }, [supabase])

  // Calculate refined categories when both visions are loaded
  useEffect(() => {
    if (draftVision && activeVision) {
      const calculated = getDraftCategories(draftVision, activeVision)
      setRefinedCategories(calculated)
      console.log('Calculated refined categories:', calculated)
    } else if (draftVision && draftVision.refined_categories) {
      // Fallback if no active vision loaded
      setRefinedCategories(draftVision.refined_categories)
    }
  }, [draftVision, activeVision])

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

  // Handle creating a draft from active vision (with clone dialog if draft exists)
  const handleCreateDraft = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    console.log('handleCreateDraft called', { user: !!user })
    
    // Get user if not already set
    let currentUser = user
    if (!currentUser) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser()
      if (!fetchedUser) {
        console.error('User not found')
        alert('You must be logged in to create a draft')
        return
      }
      currentUser = fetchedUser
      setUser(fetchedUser)
    }

    try {
      console.log('Checking for existing drafts...')
      // Check if a draft already exists
      const { data: existingDraft } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        console.log('Existing draft found, showing dialog')
        // Show override dialog
        setShowCloneDialog(true)
        return
      }

      console.log('No existing draft, proceeding with clone')
      // No existing draft, proceed with clone
      await performClone()
    } catch (error) {
      console.error('Error checking for drafts:', error)
      alert('Failed to check for existing drafts. Please try again.')
    }
  }

  // Perform the actual clone operation
  const performClone = async () => {
    console.log('performClone called', { user: !!user })
    
    // Get user if not already set
    let currentUser = user
    if (!currentUser) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser()
      if (!fetchedUser) {
        console.error('User not found in performClone')
        alert('You must be logged in to create a draft')
        return
      }
      currentUser = fetchedUser
      setUser(fetchedUser)
    }

    setIsCloning(true)
    try {
      // Get vision ID from URL params
      const resolvedParams = await params
      const versionId = resolvedParams.id
      console.log('Cloning vision with ID:', versionId)

      // The create API replaces any existing draft in the same document group
      // (personal or household) and copies household_id from the source.
      const response = await fetch('/api/vision/draft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: versionId, replaceExisting: true }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }))
        alert(`Failed to clone version: ${errorData.error || 'Unknown error'}`)
        setIsCloning(false)
        return
      }

      const { draft: newVersion } = await response.json()

      if (!newVersion) {
        console.error('No new version returned from draft create')
        alert('Failed to clone version: No data returned')
        setIsCloning(false)
        return
      }

      // Navigate directly to the draft page to avoid redirect bounce
      // No need to refresh since we're navigating away
      router.push(`/life-vision/${newVersion.id}/draft`)
      // Don't set isCloning(false) - keep loading overlay visible during navigation
    } catch (error) {
      console.error('Error cloning version:', error)
      alert('Failed to clone version. Please try again.')
      setIsCloning(false)
    }
  }

  // Confirm clone from dialog
  const confirmClone = async () => {
    // Set isCloning to true BEFORE dismissing dialog to prevent flash
    setIsCloning(true)
    setShowCloneDialog(false)
    await performClone()
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
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error && isNotDraft && vision) {
    return (
      <>
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
            <Button 
              onClick={(e) => {
                console.log('Button clicked')
                handleCreateDraft(e)
              }} 
              variant="primary"
              disabled={isCloning}
            >
              {isCloning ? 'Creating...' : 'Create Draft'}
            </Button>
            <Button onClick={() => router.push('/life-vision')} variant="outline">
              Back to Life Vision
            </Button>
          </div>
        </Card>

        {/* Clone Override Dialog */}
        {showCloneDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Override Existing Draft?
                </h3>
                <button
                  onClick={() => setShowCloneDialog(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-neutral-300 mb-6">
                Only one draft at a time. This will override any existing draft and create a new draft from the selected version.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCloneDialog(false)}
                  disabled={isCloning}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmClone}
                  disabled={isCloning}
                  className="flex-1 gap-2"
                >
                  {isCloning ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Create Draft
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Cloning Loading Overlay */}
        {isCloning && !showCloneDialog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <Card className="max-w-md w-full">
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Creating Draft...</h3>
                <p className="text-neutral-400">
                  Cloning your vision as a draft
                </p>
              </div>
            </Card>
          </div>
        )}
      </>
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

  const refinedCount = refinedCategories.length

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Version badges */}
        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            <VersionBadge 
              versionNumber={vision.version_number} 
              status="draft"
              isHouseholdVision={!!vision.household_id}
            />
            <StatusBadge status="draft" subtle={true} className="uppercase tracking-[0.25em]" />
            <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
              <Calendar className="w-3.5 h-3.5" />
              Created: {new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {refinedCount > 0 && (
              <Badge 
                variant="warning" 
                className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
              >
                {refinedCount} of {VISION_CATEGORIES.length} Refined
              </Badge>
            )}
          </div>
        </div>

        {/* Draft actions — same toolbar as the vision detail draft view */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            asChild
            variant="outline-purple"
            size="sm"
            className="gap-2"
          >
            <Link href={`/life-vision/${vision.id}/refine`}>
              <Icon icon={Gem} size="sm" className="shrink-0" />
              <span>Refine with VIVA</span>
            </Link>
          </Button>
          <VersionActionToolbar
            versionId={vision.id}
            versionNumber={vision.version_number ?? 1}
            isActive={false}
            isDraft={true}
            onCommitAsActive={confirmCommit}
            onDelete={confirmDelete}
            isLoading={isCommitting || deletingDraft}
          />
        </div>

      {/* Category Filter Strip — refined categories show a yellow check */}
      <FullBleed>
        <CategoryGrid
          categories={VISION_SECTIONS}
          selectedCategories={selectedCategories}
          refinedCategories={refinedCategories}
          mode="draft"
          onCategoryClick={handleCategoryToggle}
          showSelectAll
          onSelectAll={handleSelectAll}
          lifeVisionCategoryStrip
          pillLabel="Life Areas"
        />
      </FullBleed>

      {/* Refinement Progress */}
      {hasActiveVision && (
        <div className="flex items-center gap-3">
          <ProgressBar
            value={Math.round((refinedCount / VISION_SECTIONS.length) * 100)}
            variant="accent"
            className="h-2 flex-1"
          />
          <span className="text-xs text-neutral-400 whitespace-nowrap">
            {refinedCount} of {VISION_SECTIONS.length} refined · {Math.round((refinedCount / VISION_SECTIONS.length) * 100)}%
          </span>
        </div>
      )}

      {/* Vision Cards */}
      {selectedCategories.length > 0 ? (
        <>
          {selectedCategories.map((categoryKey) => {
            const category = VISION_SECTIONS.find(cat => cat.key === categoryKey)
            if (!category) return null

            const originalContent = vision[categoryKey as keyof VisionData] as string
            const isEditing = editingCategory === categoryKey
            const content = isEditing ? editContent : originalContent
            const isDraft = refinedCategories.includes(categoryKey)

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
        </>
      ) : (
        <div className="text-center py-8 text-neutral-500 text-sm">
          Tap a category above to view it.
        </div>
      )}

      {/* Clone Override Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Override Existing Draft?
              </h3>
              <button
                onClick={() => setShowCloneDialog(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-neutral-300 mb-6">
              Only one draft at a time. This will override any existing draft and create a new draft from the selected version.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloneDialog(false)}
                disabled={isCloning}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmClone}
                disabled={isCloning}
                className="flex-1 gap-2"
              >
                {isCloning ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Create Draft
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cloning Loading Overlay */}
      {isCloning && !showCloneDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Creating Draft...</h3>
              <p className="text-neutral-400">
                Cloning your vision as a draft
              </p>
            </div>
          </Card>
        </div>
      )}

      </Stack>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="refine_vision"
        onStayHere={() => {
          if (committedVisionId) {
            router.push(`/life-vision/${committedVisionId}`)
          }
        }}
      />
    </Container>
  )
}
