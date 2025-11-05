'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, Edit3, History, Sparkles, Trash2, Download, VolumeX, Gem, Check, Eye } from 'lucide-react'
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge, 
  Spinner,
  Input,
  Textarea,
  AutoResizeTextarea,
  Icon,
  AudioPlayer,
  Stack,
  Inline,
  CreatedDateBadge
} from '@/lib/design-system/components'
import { VisionVersionCard } from '../components/VisionVersionCard'
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
  status: 'draft' | 'complete' | string
  completion_percent: number
  created_at: string
  updated_at: string
}

// Use centralized vision categories
const VISION_SECTIONS = VISION_CATEGORIES

// VisionCard component moved outside to prevent re-creation on every render
const VisionCard = ({ 
  category, 
  content, 
  isEditing, 
  onSave, 
  onCancel, 
  onUpdate, 
  saving,
  onEditCategory,
  vision,
  audioTrack
}: { 
  category: any, 
  content: string, 
  isEditing: boolean, 
  onSave: () => void, 
  onCancel: () => void, 
  onUpdate: (content: string) => void, 
  saving: boolean,
  onEditCategory: (categoryKey: string) => void,
  vision: any,
  audioTrack?: { url: string; title: string }
}) => {
  const isCompleted = content?.trim().length > 0
  
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <div className="px-1 py-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-primary-500' : 'bg-neutral-700'}`}>
            <Icon icon={category.icon} size="sm" color={isCompleted ? '#FFFFFF' : '#14B8A6'} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{category.label}</h3>
            <p className="text-sm text-neutral-400">{category.description}</p>
          </div>
        </div>

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            <AutoResizeTextarea
              value={content || ''}
              onChange={onUpdate}
              placeholder={`Describe your vision for ${category.label.toLowerCase()}...`}
              className="w-full bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none"
              minHeight={200}
            />
            <div className="flex justify-end gap-3">
              <Button
                onClick={onCancel}
                variant="ghost"
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
                    onClick={() => onEditCategory(category.key)}
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

            {/* Audio Player */}
            {audioTrack?.url && !isEditing && (
              <div className="mb-4">
                <AudioPlayer 
                  track={{
                    id: category.key,
                    title: audioTrack.title || category.label,
                    artist: '',
                    duration: 180,
                    url: audioTrack.url,
                    thumbnail: ''
                  }}
                  showInfo={false}
                />
              </div>
            )}

            {/* Action Buttons */}
            {content?.trim() && (
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => onEditCategory(category.key)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Link href={`/life-vision/${vision?.id}/refine?category=${category.key}`}>
                    <Gem className="w-4 h-4" />
                    Refine
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export default function VisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [audioTracks, setAudioTracks] = useState<Record<string, { url: string; title: string }>>({})
  const [userProfile, setUserProfile] = useState<{ first_name?: string; full_name?: string } | null>(null)

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

  const handleEditCategory = (categoryKey: string) => {
    const content = vision?.[categoryKey as keyof VisionData] as string || ''
    setEditingCategory(categoryKey)
    setEditingContent(content)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditingContent('')
  }

  const handleSaveEdit = async () => {
    if (!vision || !editingCategory) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('vision_versions')
        .update({ 
          [editingCategory]: editingContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', vision.id)

      if (error) throw error

      setVision(prev => prev ? { ...prev, [editingCategory]: editingContent } : null)
      setLastSaved(new Date())
      setEditingCategory(null)
      setEditingContent('')
    } catch (error) {
      console.error('Error saving vision:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateContent = (content: string) => {
    setEditingContent(content)
  }

  // Calculate completion percentage
  const calculateCompletion = useCallback((data: VisionData) => {
    const sections = VISION_SECTIONS.map(section => data[section.key as keyof VisionData] as string)
    const filledSections = sections.filter(section => section?.trim().length > 0).length
    const totalSections = VISION_SECTIONS.length // No longer including title
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

  // Load audio tracks for vision
  const loadAudioTracks = async (visionId: string) => {
    try {
      // Get the standard (voice-only) audio set for this vision
      const { data: audioSets } = await supabase
        .from('audio_sets')
        .select('id, variant')
        .eq('vision_id', visionId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!audioSets || audioSets.length === 0) return

      // Get audio tracks for the standard audio set
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('section_key, audio_url')
        .eq('audio_set_id', audioSets[0].id)
        .eq('status', 'completed')

      if (!tracks) return

      // Map tracks by section_key
      // Map audio section_keys to vision category keys
      const sectionToCategory: Record<string, string> = {
        'meta_intro': 'forward',
        'meta_outro': 'conclusion',
        // Map all other keys 1:1
        health: 'health',
        family: 'family',
        love: 'love',
        romance: 'love', // Legacy support: map romance to love
        social: 'social',
        fun: 'fun',
        travel: 'travel',
        home: 'home',
        money: 'money',
        work: 'work',
        business: 'work', // Legacy support: map business to work
        stuff: 'stuff',
        possessions: 'stuff', // Legacy support: map possessions to stuff
        giving: 'giving',
        spirituality: 'spirituality',
      }
      
      const trackMap: Record<string, { url: string; title: string }> = {}
      tracks.forEach(track => {
        // Always use voice-only audio_url for standard version
        const url = track.audio_url
        if (url) {
          // Map section_key (meta_intro) to category key (forward)
          const categoryKey = sectionToCategory[track.section_key] || track.section_key
          trackMap[categoryKey] = {
            url,
            title: VISION_SECTIONS.find(cat => cat.key === categoryKey)?.label || categoryKey
          }
        }
      })

      setAudioTracks(trackMap)
    } catch (error) {
      console.error('Error loading audio tracks:', error)
    }
  }

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
        console.log('Loading vision with ID:', resolvedParams.id)
        console.log('User ID:', user.id)
        
        // Use API route instead of direct Supabase queries
        const response = await fetch(`/api/vision?id=${resolvedParams.id}&includeVersions=true&t=${Date.now()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load vision')
        }
        
        const data = await response.json()
        const { vision, versions } = data
        
        if (!vision) {
          throw new Error('Vision not found')
        }

        const actualCompletion = calculateCompletion(vision)
        const completed = getCompletedSections(vision)

        console.log('Loaded vision data:', {
          id: vision.id,
          status: vision.status,
          completion_percent: vision.completion_percent,
          actualCompletion,
          completed,
          user_id: vision.user_id,
          version_number: vision.version_number,
          created_at: vision.created_at,
          updated_at: vision.updated_at
        })

        // Log all vision fields to see what we're working with
        console.log('All vision fields:', Object.keys(vision))
        console.log('Vision field types:', Object.entries(vision).map(([key, value]) => ({
          key,
          type: typeof value,
          value: value === null ? 'null' : value === undefined ? 'undefined' : String(value).substring(0, 50)
        })))

        setVision(vision)
        setCompletionPercentage(actualCompletion)

        // Fetch user profile for PDF generation
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, full_name')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
        setCompletedSections(completed)
        setVersions(versions || [])
        
        // Initialize with all categories selected
        setSelectedCategories(VISION_SECTIONS.map(cat => cat.key))
        
        // Load audio tracks for this vision
        await loadAudioTracks(vision.id)
      } catch (error) {
        console.error('Error loading vision:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          error: error
        })
        
        // Check if it's a Supabase error
        if (error && typeof error === 'object' && 'code' in error) {
          console.error('Supabase error code:', error.code)
          console.error('Supabase error message:', (error as any).message)
          console.error('Supabase error details:', (error as any).details)
          console.error('Supabase error hint:', (error as any).hint)
        }
        
        // Set error state but don't crash the app
        setError(error instanceof Error ? error.message : 'Failed to load vision')
        setLoading(false)
        
        router.push('/life-vision')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, supabase, calculateCompletion, getCompletedSections])

  // Fetch specific version (kept for backwards compatibility, but versions now navigate directly)
  const fetchVisionVersion = async (versionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: version, error } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', versionId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      const actualCompletion = calculateCompletion(version)
      const completed = getCompletedSections(version)

      setVision(version)
      setCompletionPercentage(actualCompletion)
      setCompletedSections(completed)
      setIsViewingVersion(true)
    } catch (error) {
      console.error('Error fetching version:', error)
    }
  }

  // Delete version
  const deleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    setDeletingVersion(versionId)
    try {
      const { error } = await supabase
        .from('vision_versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      // Refresh versions list
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: versionsData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        // Calculate version numbers for all versions
        if (versionsData) {
          const versionsWithCalculatedNumbers = await Promise.all(
            versionsData.map(async (v: VisionData) => {
              const { data: calculatedVersionNumber } = await supabase
                .rpc('get_vision_version_number', { p_vision_id: v.id })
              
              const versionNumber = calculatedVersionNumber || v.version_number || 1
              
              return {
                ...v,
                version_number: versionNumber
              }
            })
          )
          
          setVersions(versionsWithCalculatedNumbers)
        } else {
          setVersions([])
        }
      }

      // If we deleted the current version, go back to main vision
      if (currentVersionId === versionId) {
        setCurrentVersionId(null)
        setIsViewingVersion(false)
        // Reload main vision data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting version:', error)
      alert('Failed to delete version')
    } finally {
      setDeletingVersion(null)
    }
  }

  // Save vision
  const saveVision = useCallback(async () => {
    if (!vision) return

    setSaving(true)
    try {
      const completionPercentage = calculateCompletion(vision)
      const completed = getCompletedSections(vision)

      // Use API route for saving
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visionId: vision.id,
          vision: vision,
          versionNumber: vision.version_number
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save vision')
      }

      const result = await response.json()
      console.log('Vision saved successfully:', result)
      
      setCompletionPercentage(completionPercentage)
      setCompletedSections(completed)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving vision:', error)
      alert(`Failed to save vision: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    } finally {
      setSaving(false)
    }
  }, [vision, calculateCompletion, getCompletedSections])

  // Save as version
  const saveAsVersion = useCallback(async (isDraft = true) => {
    if (!vision) return

    setSaving(true)
    try {
      const completionPercentage = calculateCompletion(vision)
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to save a version')
        return
      }
      
      // Create new version - version_number will be calculated by database function
      const insertData = {
        user_id: user.id,
        version_number: 1, // Placeholder - will be recalculated
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
        completion_percent: completionPercentage,
        status: isDraft ? 'draft' : 'complete'
      }

      const { data: newVersion, error } = await supabase
        .from('vision_versions')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        throw error
      }

      // Calculate version number for the newly created vision
      const { data: calculatedVersionNumber } = await supabase
        .rpc('get_vision_version_number', { p_vision_id: newVersion.id })
      
      const actualVersionNumber = calculatedVersionNumber || newVersion.version_number || 1

      // Refresh versions list
      const { data: versionsData } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Calculate version numbers for all versions
      let versionsWithCalculatedNumbers: VisionData[] = []
      if (versionsData) {
        versionsWithCalculatedNumbers = await Promise.all(
          versionsData.map(async (v: VisionData) => {
            const { data: calculatedVersionNumber } = await supabase
              .rpc('get_vision_version_number', { p_vision_id: v.id })
            
            const versionNumber = calculatedVersionNumber || v.version_number || 1
            
            return {
              ...v,
              version_number: versionNumber
            }
          })
        )
      }
      
      setVersions(versionsWithCalculatedNumbers)
      setLastSaved(new Date())
      
      alert(isDraft ? `Vision saved as draft version ${actualVersionNumber}!` : `Vision saved as new version ${actualVersionNumber}!`)
    } catch (error) {
      console.error('Error saving version:', error)
      alert('Failed to save version. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [vision, supabase, calculateCompletion])

  // Update vision data
  const updateVision = useCallback((updates: Partial<VisionData>) => {
    if (!vision) return
    setVision({ ...vision, ...updates })
  }, [vision])

  // Download Vision as PDF
  const downloadVisionPDF = useCallback(async () => {
    if (!vision) {
      alert('No vision data available')
      return
    }

    try {
      console.log('Starting PDF download for vision:', vision.id)
      // Call the PDF generation function
      await generateVisionPDF(vision, userProfile || undefined, false)
      console.log('PDF download initiated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
      alert(`PDF Generation Failed\n\n${errorMessage}\n\nPlease check the browser console for details.`)
    }
  }, [vision, userProfile])

  // Auto-resize textarea when content or section changes
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
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Vision</h2>
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

  if (!vision) {
    return (
      <>
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Vision not found</h2>
          <p className="text-neutral-400 mb-6">This vision doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/life-vision">Back to Life Visions</Link>
          </Button>
        </Card>
      </>
    )
  }

  // Card-based view components
  const CategoryCard = ({ category, selected, onClick, className = '' }: { 
    category: any, 
    selected: boolean, 
    onClick: () => void, 
    className?: string 
  }) => {
    const IconComponent = category.icon
    return (
      <Card 
        variant="outlined" 
        hover 
        className={`cursor-pointer aspect-square transition-all duration-300 ${selected ? 'border border-primary-500' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-1 justify-center h-full">
          <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#14B8A6'} />
          <span className="text-xs font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
            {category.label}
          </span>
        </div>
      </Card>
    )
  }


  return (
    <>
        {/* Header */}
        <div className="mb-8">
          {/* Title Section */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              The Life I Choose
            </h1>
          </div>
          
          {/* Centered Version Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                V{vision.version_number}
              </span>
              {vision.status === 'complete' ? (
                <Badge variant="success">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Circle className="w-4 h-4 mr-1" />
                  Draft
                </Badge>
              )}
            </div>
            
            {/* Created Date & History */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {/* Created Date Badge */}
              <CreatedDateBadge createdAt={vision.created_at} />
              
              {/* Version History Button */}
              {versions.length > 0 && (
                <Button
                  onClick={() => setShowVersions(!showVersions)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded-lg hover:border-neutral-600"
                >
                  <Icon icon={History} size="sm" />
                  {showVersions ? 'Hide' : 'Show'} History
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons - Responsive Grid 2x2 on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-center mb-6">
            <Button
              onClick={() => router.push(`/life-vision/${vision.id}/audio`)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Icon icon={VolumeX} size="sm" />
              Audio Tracks
            </Button>
            <Button
              onClick={() => router.push(`/life-vision/${vision.id}/print`)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Icon icon={Download} size="sm" />
              Download PDF
            </Button>
            <Button
              asChild
              variant="primary"
              className="flex items-center gap-2"
            >
              <Link href={`/life-vision/${vision.id}/refine`}>
                <Icon icon={Gem} size="sm" />
                Refine
              </Link>
            </Button>
          </div>



          {/* Versions Dropdown */}
          {showVersions && versions.length > 0 && (
            <div className="mt-6">
              <Card className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-4">Version History</h3>
                <Stack gap="sm">
                  {versions.map((version) => (
                    <VisionVersionCard
                      key={version.id}
                      version={version}
                      isActive={version.id === vision?.id}
                      actions={
                        <>
                          {version.id?.startsWith('draft-') ? (
                            // Draft version - link to draft page
                            // Extract vision ID from draft version ID (format: draft-{visionId})
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-xs md:text-sm flex-1 min-w-0 shrink md:flex-none flex items-center justify-center gap-2"
                            >
                              <Link href={`/life-vision/${version.id.replace('draft-', '')}/refine/draft`}>
                                <Icon icon={Eye} size="sm" />
                                <span className="ml-1 truncate">View Draft</span>
                              </Link>
                            </Button>
                          ) : version.status === 'draft' ? (
                            <>
                              <Button
                                onClick={() => router.push('/life-vision/new')}
                                variant="primary"
                                size="sm"
                                className="text-xs md:text-sm flex-1 min-w-0 shrink md:flex-none flex items-center justify-center gap-2"
                              >
                                <Icon icon={Sparkles} size="sm" color="#000000" />
                                <span className="ml-1 truncate">Continue with VIVA</span>
                              </Button>
                              <Button
                                onClick={() => router.push(`/life-vision/${version.id}`)}
                                variant="secondary"
                                size="sm"
                                className="text-xs md:text-sm flex-1 min-w-0 shrink md:flex-none flex items-center justify-center gap-2"
                              >
                                <Icon icon={Edit3} size="sm" />
                                <span className="ml-1 truncate">Edit On My Own</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => router.push(`/life-vision/${version.id}`)}
                                variant="outline"
                                size="sm"
                                className="text-xs md:text-sm flex-1 min-w-0 shrink md:flex-none flex items-center justify-center gap-2"
                              >
                                <Icon icon={Eye} size="sm" />
                                <span className="ml-1">View</span>
                              </Button>
                            </>
                          )}
                        </>
                      }
                    />
                  ))}
                </Stack>
              </Card>
            </div>
          )}
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
                  
                  const originalContent = vision?.[categoryKey as keyof VisionData] as string || ''
                  const isEditing = editingCategory === categoryKey
                  const content = isEditing ? editingContent : originalContent
                  
                  return (
                    <VisionCard
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
                      audioTrack={audioTracks[categoryKey]}
                    />
                  )
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-neutral-400 mb-4">Select categories above to view your life vision</p>
                <Button onClick={handleSelectAll} variant="primary">
                  Select All Categories
                </Button>
              </Card>
            )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center space-y-4">
          <Link 
            href="/life-vision" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Life Visions
          </Link>
          
          {/* Delete Button */}
          <div className="pt-6 border-t border-neutral-800">
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this vision? This action cannot be undone.')) {
                  deleteVersion(vision.id)
                }
              }}
              variant="danger"
              size="sm"
              className="flex items-center gap-2 mx-auto"
              disabled={deletingVersion === vision.id}
            >
              {deletingVersion === vision.id ? (
                <>
                  <Spinner variant="primary" size="sm" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Vision
                </>
              )}
            </Button>
          </div>
        </div>
    </>
  )
}