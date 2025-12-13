'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  Spinner,
  AutoResizeTextarea,
  WarningConfirmationDialog,
  Icon,
  Container,
  Stack,
  PageHero
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  Save,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface VisionData {
  id?: string
  user_id?: string
  version_number?: number
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
  is_draft: boolean
  is_active: boolean
  completion_percent: number
}

export default function ManualLifeVisionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('forward')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [completedSections, setCompletedSections] = useState<string[]>([])

  // Vision data state
  const [visionData, setVisionData] = useState<VisionData>({
    forward: '',
    fun: '',
    travel: '',
    home: '',
    family: '',
    love: '',
    health: '',
    money: '',
    work: '',
    social: '',
    stuff: '',
    giving: '',
    spirituality: '',
    conclusion: '',
    completion_percent: 0,
    is_draft: true,
    is_active: false
  })

  // Define sections in order (matching profile edit pattern)
  const visionSections = [
    { id: 'forward', title: 'Forward', description: 'Opening invocation', icon: Circle },
    ...VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).map(cat => ({
      id: cat.key,
      title: cat.label,
      description: cat.description,
      icon: cat.icon
    })),
    { id: 'conclusion', title: 'Conclusion', description: 'Closing statement', icon: Circle }
  ]

  // Calculate completion percentage
  const calculateCompletion = (data: VisionData): number => {
    const fields = [
      'forward', 'fun', 'travel', 'home', 'family', 'love', 'health',
      'money', 'work', 'social', 'stuff', 'giving', 'spirituality', 'conclusion'
    ]
    const completed = fields.filter(field => (data[field as keyof VisionData] as string)?.trim().length > 0).length
    return Math.round((completed / fields.length) * 100)
  }

  // Check if section is completed
  const isSectionCompleted = (sectionId: string): boolean => {
    return (visionData[sectionId as keyof VisionData] as string)?.trim().length > 0
  }

  // Calculate completed sections
  const getCompletedSections = useCallback(() => {
    const fields = [
      'forward', 'fun', 'travel', 'home', 'family', 'love', 'health',
      'money', 'work', 'social', 'stuff', 'giving', 'spirituality', 'conclusion'
    ]
    return fields.filter(field => (visionData[field as keyof VisionData] as string)?.trim().length > 0)
  }, [visionData])

  // Update completed sections when vision data changes
  useEffect(() => {
    setCompletedSections(getCompletedSections())
  }, [visionData, getCompletedSections])

  // Initialize selected categories to all categories
  useEffect(() => {
    setSelectedCategories(visionSections.map(s => s.id))
  }, [])

  // Navigation helpers
  const getCurrentSectionIndex = () => visionSections.findIndex(s => s.id === activeSection)
  const isFirstSection = () => getCurrentSectionIndex() === 0
  const isLastSection = () => getCurrentSectionIndex() === visionSections.length - 1

  const goToPreviousSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex > 0) {
      setActiveSection(visionSections[currentIndex - 1].id)
    }
  }

  const goToNextSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex < visionSections.length - 1) {
      setActiveSection(visionSections[currentIndex + 1].id)
    }
  }

  // Get category info
  const getCategoryInfo = (sectionId: string) => {
    const section = visionSections.find(s => s.id === sectionId)
    return section || visionSections[0]
  }

  // Load existing draft if any
  useEffect(() => {
    async function loadDraft() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Check for existing draft using the helper
        const { data: existingDraft, error: fetchError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_draft', true)
          .eq('is_active', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (existingDraft) {
          setVisionData({
            id: existingDraft.id,
            user_id: existingDraft.user_id,
            version_number: existingDraft.version_number,
            forward: existingDraft.forward || '',
            fun: existingDraft.fun || '',
            travel: existingDraft.travel || '',
            home: existingDraft.home || '',
            family: existingDraft.family || '',
            love: existingDraft.love || '',
            health: existingDraft.health || '',
            money: existingDraft.money || '',
            work: existingDraft.work || '',
            social: existingDraft.social || '',
            stuff: existingDraft.stuff || '',
            giving: existingDraft.giving || '',
            spirituality: existingDraft.spirituality || '',
            conclusion: existingDraft.conclusion || '',
            completion_percent: existingDraft.completion_percent || 0,
            is_draft: true,
            is_active: false
          })
        }
      } catch (err) {
        console.error('Error loading draft:', err)
        setError('Failed to load draft')
      } finally {
        setLoading(false)
      }
    }

    loadDraft()
  }, [supabase, router])

  // Handle field change
  const handleFieldChange = (field: keyof VisionData, value: string) => {
    setVisionData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Save draft - saves all categories at once
  const handleSaveDraft = async () => {
    setSaving(true)
    setSaveStatus('saving')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const completion = calculateCompletion(visionData)

      // If we already have a draft ID, update it via API
      if (visionData.id) {
        console.log('Updating existing draft:', visionData.id)
        
        // Update all categories via API
        const response = await fetch('/api/vision/draft/update-all', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId: visionData.id,
            visionData: {
              forward: visionData.forward || '',
              fun: visionData.fun || '',
              travel: visionData.travel || '',
              home: visionData.home || '',
              family: visionData.family || '',
              love: visionData.love || '',
              health: visionData.health || '',
              money: visionData.money || '',
              work: visionData.work || '',
              social: visionData.social || '',
              stuff: visionData.stuff || '',
              giving: visionData.giving || '',
              spirituality: visionData.spirituality || '',
              conclusion: visionData.conclusion || ''
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update draft')
        }

        const { draft } = await response.json()
        setVisionData(draft)
      } else {
        // Create new draft via API
        console.log('Creating new draft for user:', user.id)
        
        const response = await fetch('/api/vision/draft/create-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visionData: {
              forward: visionData.forward || '',
              fun: visionData.fun || '',
              travel: visionData.travel || '',
              home: visionData.home || '',
              family: visionData.family || '',
              love: visionData.love || '',
              health: visionData.health || '',
              money: visionData.money || '',
              work: visionData.work || '',
              social: visionData.social || '',
              stuff: visionData.stuff || '',
              giving: visionData.giving || '',
              spirituality: visionData.spirituality || '',
              conclusion: visionData.conclusion || ''
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('API error response:', errorData)
          throw new Error(errorData.error || 'Failed to create draft')
        }

        const { draft } = await response.json()
        console.log('Draft created successfully:', draft.id)
        setVisionData(draft)
      }

      setLastSaved(new Date())
      setSaveStatus('saved')

      // Clear save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('Error saving draft:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft'
      setError(errorMessage)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  // Commit as active
  const handleCommitAsActive = async () => {
    if (!visionData.id) {
      setError('Please save draft first')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Use the commit draft API route
      const response = await fetch('/api/vision/draft/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: visionData.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to commit draft')
      }

      const { vision } = await response.json()
      console.log('Draft committed successfully:', vision.id)

      // Redirect to the newly committed vision
      router.push(`/life-vision/${vision.id}`)
    } catch (err) {
      console.error('Error committing vision:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to commit vision'
      setError(errorMessage)
    } finally {
      setSaving(false)
      setShowCommitDialog(false)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const currentSection = getCategoryInfo(activeSection)
  const currentSectionIndex = getCurrentSectionIndex()
  const completionPercentage = visionData.completion_percent

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Manual Life Vision"
          subtitle="Create your life vision from scratch"
        >
          {visionData.id && (
            <div className="text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <StatusBadge 
                  status={visionData.is_draft ? 'draft' : 'active'}
                  subtle={!visionData.is_active}
                />
                <span className="text-xs md:text-sm font-semibold text-[#39FF14]">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          )}
        </PageHero>

        <div>
        {/* Mobile Header */}
        <div className="md:hidden space-y-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">Manual Life Vision</h1>
            </div>
            {visionData.id && (
              <div className="text-center mb-2">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <StatusBadge 
                    status={visionData.is_draft ? 'draft' : 'active'}
                    subtle={!visionData.is_active}
                  />
                  <span className="text-xs md:text-sm font-semibold text-[#39FF14]">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
            )}
            <p className="text-neutral-400 text-sm text-center">
              Create your life vision from scratch
            </p>
          </div>
        </div>

        {/* Save Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm text-primary-500">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Save failed</span>
              </>
            )}
            {lastSaved && saveStatus === 'idle' && (
              <span className="text-sm text-neutral-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold text-primary-500">{completionPercentage}% Complete</span>
            <div className="w-full bg-neutral-700 rounded-full h-3 border border-neutral-600">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-primary-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
        )}

        {/* Select Life Areas Bar */}
        <div>
        <Card>
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-white mb-1">Select Life Areas</h3>
            <p className="text-sm text-neutral-400">
              Showing {selectedCategories.length} of {visionSections.length} areas
              {completedSections.length > 0 && (
                <span className="ml-2 text-[#39FF14]">
                  • {completedSections.length} completed
                </span>
              )}
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
            {visionSections.map((section) => {
              const IconComponent = section.icon
              const isCompleted = completedSections.includes(section.id)
              const isActive = activeSection === section.id

              return (
                <Card 
                  key={section.id}
                  variant="outlined" 
                  hover 
                  className={`cursor-pointer aspect-square transition-all duration-300 relative ${
                    isActive 
                      ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' 
                      : '!bg-transparent !border-2 !border-[#333]'
                  } ${isCompleted && !isActive ? 'bg-green-500/10' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 border-[#39FF14] flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-[#39FF14]" strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1 justify-center h-full">
                    <Icon 
                      icon={IconComponent} 
                      size="sm" 
                      color={isActive ? '#39FF14' : '#FFFFFF'} 
                    />
                    <span className="text-xs font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
                      {section.title}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
        </div>

        {/* Main Content - Full Width */}
        <div>
        <div className="space-y-6">
          {/* Text Editor Section */}
          <Card className="p-6 md:p-8">
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                {currentSection.title}
              </h2>
              <p className="text-sm text-neutral-400">{currentSection.description}</p>
            </div>

            <AutoResizeTextarea
              value={(visionData[activeSection as keyof VisionData] as string) || ''}
              onChange={(value) => handleFieldChange(activeSection as keyof VisionData, value)}
              placeholder={`Enter your ${currentSection.title.toLowerCase()} text here...`}
              minHeight={300}
              className="w-full bg-neutral-800 border-2 border-neutral-700 text-white rounded-xl p-4 focus:border-primary-500 focus:outline-none"
            />
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1 flex justify-start">
              <Button
                onClick={goToPreviousSection}
                disabled={isFirstSection()}
                variant="outline"
                size="sm"
                className="w-24 md:w-auto"
              >
                <ChevronsLeft className="w-4 h-4 flex-shrink-0 md:hidden" />
                <ChevronLeft className="w-4 h-4 flex-shrink-0 hidden md:block" />
                <span className="hidden md:inline">Previous</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span>{currentSectionIndex + 1} of {visionSections.length}</span>
              <span>•</span>
              <span>{currentSection.title}</span>
            </div>
            
            <div className="flex-1 flex justify-end">
              <Button
                onClick={goToNextSection}
                disabled={isLastSection()}
                variant="outline"
                size="sm"
                className="w-24 md:w-auto"
              >
                <span className="hidden md:inline">Next</span>
                <ChevronsRight className="w-4 h-4 flex-shrink-0 md:hidden" />
                <ChevronRight className="w-4 h-4 flex-shrink-0 hidden md:block" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-6">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveDraft}
              loading={saving}
              disabled={saving}
              className="flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            {visionData.id && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCommitDialog(true)}
                disabled={saving || completionPercentage < 100}
                className="flex-1 sm:flex-initial"
              >
                <Check className="w-4 h-4 mr-2" />
                Commit as Active
              </Button>
            )}
          </div>
        </div>
        </div>
      </Stack>

      {/* Commit Confirmation Dialog */}
      <WarningConfirmationDialog
        isOpen={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        onConfirm={handleCommitAsActive}
        title="Commit as Active Vision?"
        message="This will make this vision your active life vision and deactivate any other active visions. Are you sure?"
        confirmText="Commit as Active"
        type="commit"
        isLoading={saving}
      />
    </Container>
  )
}

