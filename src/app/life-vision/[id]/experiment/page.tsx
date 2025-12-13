'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, ArrowLeft, Edit3, Eye, Plus, History, Sparkles, Trash2, Download, VolumeX, Gem, ChevronDown, Check } from 'lucide-react'
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge, 
  Spinner,
  Input,
  Textarea,
  CategoryCard,
  Icon
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { generateVisionPDF } from '@/lib/pdf'

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
  is_draft: boolean
  is_active: boolean
  completion_percent: number
  created_at: string
  updated_at: string
}

// VisionCard component for displaying vision content
const VisionCard = ({ category, content, isCompleted, isEditing, onEdit, onSave, onCancel, onUpdate, saving }: any) => {
  const IconComponent = category.icon
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea function
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }, [])

  // Auto-resize textarea when content or editing state changes
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (textareaRef.current) {
          autoResizeTextarea(textareaRef.current)
        }
      }, 50)
    }
  }, [content, isEditing, autoResizeTextarea])
  
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <div className="px-1 py-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-primary-500' : 'bg-neutral-700'}`}>
            <Icon icon={IconComponent} size="sm" color={isCompleted ? '#FFFFFF' : '#14B8A6'} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{category.label}</h3>
            <p className="text-sm text-neutral-400">{category.description}</p>
          </div>
        </div>

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={content || ''}
              onChange={(e) => {
                onUpdate(e.target.value)
                if (textareaRef.current) {
                  autoResizeTextarea(textareaRef.current)
                }
              }}
              placeholder={`Describe your vision for ${category.label.toLowerCase()}...`}
              className="w-full min-h-[200px] px-1 py-3 md:p-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none resize-none"
              style={{ overflow: 'hidden' }}
            />
            <div className="flex justify-end gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                variant="primary"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Content Display */}
            <div className="mb-4">
              {content?.trim() ? (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-1 py-3 md:p-4">
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {content}
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg px-2 py-4 md:p-8 text-center">
                  <p className="text-neutral-500 mb-3">No content for this section yet</p>
                  <Button
                    onClick={() => onEdit(category.key)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Edit3 className="w-4 h-4" />
                    Add Content
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
              <div className="text-xs text-neutral-500">
                {isCompleted ? 'Completed' : 'In Progress'}
              </div>
              <Button
                onClick={() => onEdit(category.key)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {content?.trim() ? 'Edit' : 'Add'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default function VisionExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ first_name?: string; full_name?: string } | null>(null)

  // Calculate completion percentage
  const calculateCompletion = useCallback((data: VisionData) => {
    const sections = VISION_CATEGORIES.map(section => data[section.key as keyof VisionData] as string)
    const filledSections = sections.filter(section => section?.trim().length > 0).length
    const totalSections = VISION_CATEGORIES.length
    return Math.round((filledSections / totalSections) * 100)
  }, [])

  // Get completed sections
  const getCompletedSections = useCallback((data: VisionData) => {
    const completed: string[] = []
    
    VISION_CATEGORIES.forEach(section => {
      const value = data[section.key as keyof VisionData]
      if (typeof value === 'string' && value.trim()) {
        completed.push(section.key)
      }
    })
    
    return completed
  }, [])

  // Load vision data
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
        
        // Load main vision data
        const { data: vision, error } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }

        if (!vision) {
          console.error('No vision found with ID:', resolvedParams.id)
          throw new Error(`Vision with ID ${resolvedParams.id} not found`)
        }

        // Load versions
        const { data: versionsData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false })

        const actualCompletion = calculateCompletion(vision)
        const completed = getCompletedSections(vision)

        setVision(vision)
        setCompletionPercentage(actualCompletion)
        setCompletedSections(completed)
        setVersions(versionsData || [])
        
        // Fetch user profile for PDF generation
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, full_name')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
        
        // Initialize with all categories selected
        setSelectedCategories(VISION_CATEGORIES.map(cat => cat.key))
      } catch (error) {
        console.error('Error loading vision:', error)
        router.push('/life-vision')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, supabase, calculateCompletion, getCompletedSections])

  // Category selection handlers
  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === VISION_CATEGORIES.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(VISION_CATEGORIES.map(cat => cat.key))
    }
  }

  const handleEditCategory = (categoryKey: string) => {
    setEditingCategory(categoryKey)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingCategory(null)
  }

  const handleSaveEdit = async () => {
    await saveVision()
    setIsEditing(false)
    setEditingCategory(null)
  }

  const handleUpdateContent = (value: string) => {
    if (!vision || !editingCategory) return
    updateVision({ [editingCategory]: value })
  }

  // Save vision
  const saveVision = useCallback(async () => {
    if (!vision) return

    setSaving(true)
    try {
      const completionPercentage = calculateCompletion(vision)
      const completed = getCompletedSections(vision)

      const updateData = {
        forward: vision.forward || '',
        fun: vision.fun || '',
        travel: vision.travel || '',
        home: vision.home || '',
        family: vision.family || '',
        love: vision.love || '',
        health: vision.health || '',
        money: vision.money || '',
        work: vision.work || '',
        social: vision.social || '',
        stuff: vision.stuff || '',
        giving: vision.giving || '',
        spirituality: vision.spirituality || '',
        conclusion: vision.conclusion || '',
        completion_percent: completionPercentage
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('vision_versions')
        .update(updateData)
        .eq('id', vision.id)
        .select()
      
      if (error) throw error
      
      setCompletionPercentage(completionPercentage)
      setCompletedSections(completed)
      setLastSaved(new Date())
      setIsEditing(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving vision:', error)
      alert('Failed to save vision')
    } finally {
      setSaving(false)
    }
  }, [vision, supabase, calculateCompletion, getCompletedSections])

  // Update vision data
  const updateVision = useCallback((updates: Partial<VisionData>) => {
    if (!vision) return
    setVision({ ...vision, ...updates })
  }, [vision])

  // Get filtered categories based on selection
  const filteredCategories = VISION_CATEGORIES.filter(category => 
    selectedCategories.includes(category.key)
  )

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!vision) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Vision not found</h2>
        <p className="text-neutral-400 mb-6">This vision doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/life-vision">Back to Life Visions</Link>
        </Button>
      </Card>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Life Vision Experiment"
          subtitle={`Version ${vision.version_number} • ${completionPercentage}% Complete`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <VersionBadge versionNumber={vision.version_number} status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'} />
              <StatusBadge status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'} />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => router.push(`/life-vision/${vision.id}`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Original
            </Button>
            <Button
              onClick={() => router.push(`/life-vision/${vision.id}/audio`)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <VolumeX className="w-4 h-4" />
              Audio Tracks
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={async () => {
                if (!vision) return
                try {
                  await generateVisionPDF(vision, userProfile || undefined, false)
                } catch (error) {
                  console.error('Error generating PDF:', error)
                  alert('Failed to generate PDF. Please try again.')
                }
              }}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </PageHero>

      {/* Category Selection */}
      <div className="mb-8">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Select Life Areas</h2>
            <p className="text-neutral-400">
              Choose which life areas to display below. Use "Select All" to show everything.
            </p>
          </div>

          {/* Select All Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleSelectAll}
              variant={selectedCategories.length === VISION_CATEGORIES.length ? "primary" : "outline"}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {selectedCategories.length === VISION_CATEGORIES.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {VISION_CATEGORIES.map((category) => (
              <CategoryCard 
                key={category.key} 
                category={category} 
                selected={selectedCategories.includes(category.key)} 
                onClick={() => handleCategoryToggle(category.key)}
              />
            ))}
          </div>

          {/* Selection Summary */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Showing {filteredCategories.length} of {VISION_CATEGORIES.length} life areas
            </p>
          </div>
        </Card>
      </div>

      {/* Vision Cards */}
      <div className="space-y-6">
        {filteredCategories.map((category) => {
          const content = vision[category.key as keyof VisionData] as string
          const isCompleted = completedSections.includes(category.key)
          const isCurrentlyEditing = isEditing && editingCategory === category.key
          
          return (
            <VisionCard
              key={category.key}
              category={category}
              content={content}
              isCompleted={isCompleted}
              isEditing={isCurrentlyEditing}
              onEdit={handleEditCategory}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onUpdate={handleUpdateContent}
              saving={saving}
            />
          )
        })}
      </div>


      {/* Navigation */}
      <div className="mt-8 text-center">
        <Link 
          href="/life-vision" 
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ← Back to Life Visions
        </Link>
      </div>
      </Stack>
    </Container>
  )
}
