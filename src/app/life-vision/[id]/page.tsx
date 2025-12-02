'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, Edit3, History, Sparkles, Trash2, Download, VolumeX, Gem, Check, Eye, FileText, ArrowUp } from 'lucide-react'
import { commitDraft, getRefinedCategories } from '@/lib/life-vision/draft-helpers'
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
  StatusBadge,
  VersionBadge,
  Heading,
  Text,
  PageTitles
} from '@/lib/design-system/components'
import { VersionCard } from '@/app/profile/components/VersionCard'
import { VisionVersionCard } from '../components/VisionVersionCard'
import { VisionCategoryCard } from '../components/VisionCategoryCard'
import { CategoryCard } from '@/lib/design-system'
import { VISION_CATEGORIES, assessmentToVisionKey } from '@/lib/design-system/vision-categories'
import { colors } from '@/lib/design-system/tokens'
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
  const [isCommitting, setIsCommitting] = useState(false)

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
        // Map all other keys 1:1, with legacy assessment key support
        health: 'health',
        family: 'family',
        love: 'love',
        romance: assessmentToVisionKey('romance'), // Legacy support: map romance to love
        social: 'social',
        fun: 'fun',
        travel: 'travel',
        home: 'home',
        money: 'money',
        work: 'work',
        business: assessmentToVisionKey('business'), // Legacy support: map business to work
        stuff: 'stuff',
        possessions: assessmentToVisionKey('possessions'), // Legacy support: map possessions to stuff
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

        // Redirect drafts to the draft route
        if (vision.is_draft === true) {
          router.push(`/life-vision/${vision.id}/draft`)
          return
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
        is_draft: isDraft,
        is_active: !isDraft  // Active if not a draft
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

  // Commit draft vision as active version
  const commitDraftAsActive = async () => {
    if (!vision) {
      alert('No draft vision to commit')
      return
    }

    const refinedCount = getRefinedCategories(vision).length
    if (refinedCount === 0) {
      alert('No refined categories to commit')
      return
    }

    if (!confirm(`Are you sure you want to commit this draft vision with ${refinedCount} refined ${refinedCount === 1 ? 'category' : 'categories'} as your active vision? This will create a new version.`)) {
      return
    }

    setIsCommitting(true)
    try {
      // Use the commitDraft helper
      const newActive = await commitDraft(vision.id)
      
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

  // Determine display status based on is_active and is_draft
  const getDisplayStatus = () => {
    // Explicitly check for true values (handle null/undefined)
    const isActive = vision.is_active === true
    const isDraft = vision.is_draft === true
    
    if (isActive && !isDraft) {
      return 'active'
    } else if (!isActive && isDraft) {
      return 'draft'
    } else {
      return 'complete'
    }
  }

  const displayStatus = getDisplayStatus()

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
                    THE LIFE I CHOOSE
                  </div>
                </div>
                
                {/* Title Section */}
                <div className="text-center mb-4">
                  <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                    {displayStatus === 'draft' ? 'Refine Life Vision' : 'The Life I Choose'}
                  </h1>
                  {displayStatus === 'draft' && (
                    <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                      Refined categories will show in yellow. Once you are happy with your refinement(s), click "Commit as Active Vision".
                    </p>
                  )}
                </div>
                
                {/* Centered Version Info with Enhanced Styling */}
                <div className="text-center mb-6">
                  {/* Version, Status & Date Badges */}
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                    <VersionBadge 
                      versionNumber={vision.version_number} 
                      status={displayStatus} 
                    />
                    <StatusBadge status={displayStatus} subtle={displayStatus !== 'active'} />
                    <span className="text-neutral-300 text-xs md:text-sm">
                      Created: {new Date(vision.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Enhanced with Hover Effects */}
                <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                  {displayStatus === 'draft' ? (
                    <>
                      <Button
                        onClick={() => router.push('/life-vision/active')}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                      >
                        <Icon icon={Eye} size="sm" className="shrink-0" />
                        <span>View Active</span>
                      </Button>
                      <Button
                        onClick={() => router.push(`/life-vision/${vision.id}/refine`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm bg-[#FFFF00]/20 text-[#FFFF00] hover:bg-[#FFFF00]/30"
                      >
                        <Icon icon={Gem} size="sm" className="shrink-0" />
                        <span>Continue Refining</span>
                      </Button>
                      <Button
                        onClick={commitDraftAsActive}
                        disabled={isCommitting || getRefinedCategories(vision).length === 0}
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
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push(`/life-vision/${vision.id}/audio`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                      >
                        <Icon icon={VolumeX} size="sm" className="shrink-0" />
                        <span>Audio Tracks</span>
                      </Button>
                      <Button
                        onClick={() => router.push(`/life-vision/${vision.id}/print`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                      >
                        <Icon icon={Download} size="sm" className="shrink-0" />
                        <span>Download PDF</span>
                      </Button>
                      <Button
                        onClick={async () => {
                          // Check if a draft already exists for this vision
                          const { data: existingDraft } = await supabase
                            .from('vision_versions')
                            .select('id')
                            .eq('parent_id', vision.id)
                            .eq('is_draft', true)
                            .eq('is_active', false)
                            .maybeSingle()
                          
                          if (existingDraft) {
                            // Open existing draft
                            router.push(`/life-vision/${existingDraft.id}/refine`)
                          } else {
                            // Create new draft
                            router.push(`/life-vision/${vision.id}/refine`)
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                      >
                        <Icon icon={Gem} size="sm" className="shrink-0" />
                        <span>Refine</span>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                      >
                        <Link href="/life-vision">
                          <Icon icon={Eye} size="sm" className="shrink-0" />
                          <span>All Visions</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Versions Dropdown */}
        {showVersions && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <Heading level={3} className="text-white text-lg md:text-xl">Version History</Heading>
                <Badge variant="info">{versions.length} {versions.length === 1 ? 'Version' : 'Versions'}</Badge>
              </div>
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <Text size="sm" className="text-neutral-400 mb-2">No saved versions yet</Text>
                  <Text size="xs" className="text-neutral-500">Create your first version to get started</Text>
                </div>
              ) : (
                <Stack gap="md">
                  {versions.map((version) => {
                    const isDraftVersion = version.id?.startsWith('draft-') || version.isDraft
                    
                    return (
                      <VisionVersionCard
                        key={version.id}
                        version={version}
                        isActive={version.id === vision?.id}
                        actions={
                            <>
                              {version.id?.startsWith('draft-') ? (
                                // Draft version - link to draft page with neon yellow button
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                                  style={{
                                    backgroundColor: colors.energy.yellow[500],
                                    color: '#000000',
                                    border: `2px solid ${colors.energy.yellow[500]}`
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${colors.energy.yellow[500]}E6`
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.energy.yellow[500]
                                  }}
                                >
                                  <Link href={`/life-vision/${version.id}/draft`}>
                                    <Eye className="w-4 h-4" />
                                    <span className="ml-1 truncate">View Draft</span>
                                  </Link>
                                </Button>
                              ) : version.status === 'draft' ? (
                                <>
                                  <Button
                                    onClick={() => router.push('/life-vision/new')}
                                    variant="primary"
                                    size="sm"
                                    className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="ml-1 truncate">Continue with VIVA</span>
                                  </Button>
                                  <Button
                                    onClick={() => router.push(`/life-vision/${version.id}`)}
                                    variant="secondary"
                                    size="sm"
                                    className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    <span className="ml-1 truncate">Edit On My Own</span>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => router.push(`/life-vision/${version.id}`)}
                                    variant="primary"
                                    size="sm"
                                    className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Button>
                                </>
                              )}
                            </>
                          }
                        />
                      )
                    })}
                </Stack>
              )}
            </Card>
          )}

        {/* Vision Cards */}
        <div className="space-y-6">
            {/* Compact Category Selection */}
            <div className="mb-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Select Life Areas</h3>
                    <p className="text-sm text-neutral-400">
                      Showing {selectedCategories.length} of {VISION_SECTIONS.length}
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
                  {VISION_SECTIONS.map((category) => {
                    const isSelected = selectedCategories.includes(category.key)
                    return (
                      <CategoryCard 
                        key={category.key} 
                        category={category} 
                        selected={isSelected} 
                        onClick={() => handleCategoryToggle(category.key)}
                        variant="outlined"
                        selectionStyle="border"
                        iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                        selectedIconColor="#39FF14"
                        className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
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
                  
                  const originalContent = vision?.[categoryKey as keyof VisionData] as string || ''
                  const isEditing = editingCategory === categoryKey
                  const content = isEditing ? editingContent : originalContent
                  const isRefined = displayStatus === 'draft' && vision.refined_categories?.includes(categoryKey)
                  
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
                      audioTrack={audioTracks[categoryKey]}
                      editable={!isViewingVersion}
                      isRefined={isRefined}
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
          {/* Delete Button */}
          <div>
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