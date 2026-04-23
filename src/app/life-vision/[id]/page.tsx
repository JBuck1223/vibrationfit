'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, Edit3, History, Sparkles, Trash2, Download, VolumeX, Gem, Check, Eye, FileText, ArrowUp, CalendarDays, Headphones, Moon, Zap, Music, Mic } from 'lucide-react'
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
  Container,
  Stack,
  Inline,
  StatusBadge,
  VersionBadge,
  Heading,
  Text,
  PageTitles,
  CategoryGrid,
  PageHero,
  WarningConfirmationDialog
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
  household_id?: string | null
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

interface AudioSetOption {
  id: string
  name: string
  variant: string
  voice_id: string
  track_count: number
  created_at: string
  mixRatio?: string
  backgroundTrack?: string
}

const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: 'Alloy',
  shimmer: 'Shimmer',
  ash: 'Ash',
  coral: 'Coral',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  sage: 'Sage',
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
  const [audioTracks, setAudioTracks] = useState<Record<string, { id: string; url: string; title: string; setName?: string; voiceName?: string }>>({})
  const [availableAudioSets, setAvailableAudioSets] = useState<AudioSetOption[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null) // null = "best per section"
  const [isAudioDropdownOpen, setIsAudioDropdownOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ first_name?: string; full_name?: string } | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const sectionToCategory: Record<string, string> = {
    'meta_intro': 'forward',
    'meta_outro': 'conclusion',
    'forward': 'forward',
    'conclusion': 'conclusion',
    health: 'health',
    family: 'family',
    love: 'love',
    romance: 'love',
    social: 'social',
    fun: 'fun',
    travel: 'travel',
    home: 'home',
    money: 'money',
    work: 'work',
    business: 'work',
    stuff: 'stuff',
    possessions: 'stuff',
    giving: 'giving',
    spirituality: 'spirituality',
  }

  // Load available audio sets for the dropdown
  const loadAvailableAudioSets = async (visionId: string) => {
    try {
      const { data: sets } = await supabase
        .from('audio_sets')
        .select(`*, audio_tracks(count)`)
        .eq('vision_id', visionId)
        .order('created_at', { ascending: false })

      if (!sets || sets.length === 0) {
        setAvailableAudioSets([])
        return
      }

      // Check which sets have completed tracks
      const setsWithCounts = await Promise.all(sets.map(async (set: any) => {
        const { count } = await supabase
          .from('audio_tracks')
          .select('*', { count: 'exact', head: true })
          .eq('audio_set_id', set.id)
          .eq('status', 'completed')
          .not('audio_url', 'is', null)

        let mixRatio: string | undefined
        let backgroundTrack: string | undefined
        if (set.metadata) {
          const md = set.metadata
          const voiceVol = md.voice_volume
          const bgVol = md.bg_volume
          if (voiceVol !== undefined && bgVol !== undefined) {
            mixRatio = `${voiceVol}% / ${bgVol}%`
          }
          backgroundTrack = md.background_track_name
        }

        return {
          id: set.id,
          name: set.name,
          variant: set.variant || 'standard',
          voice_id: set.voice_id,
          track_count: count || 0,
          created_at: set.created_at,
          mixRatio,
          backgroundTrack,
        } as AudioSetOption
      }))

      setAvailableAudioSets(setsWithCounts.filter(s => s.track_count > 0))
    } catch (error) {
      console.error('Error loading audio sets:', error)
    }
  }

  // Load audio tracks - either from a specific set or best-per-section across all standard sets
  const loadAudioTracks = async (visionId: string, audioSetId?: string | null) => {
    try {
      let tracks: any[] | null = null

      if (audioSetId) {
        // Load from a specific audio set - query the set's variant directly
        const { data: setData } = await supabase
          .from('audio_sets')
          .select('variant, name, voice_id')
          .eq('id', audioSetId)
          .single()
        const useDirectAudio = !setData || setData.variant === 'standard' || setData.variant === 'personal'
        const setName = setData?.name || 'Audio Set'
        const voiceName = setData?.variant === 'personal' ? 'Personal Recording' : (VOICE_DISPLAY_NAMES[setData?.voice_id || ''] || setData?.voice_id || '')

        const { data } = await supabase
          .from('audio_tracks')
          .select('id, section_key, audio_url, mixed_audio_url, mix_status, created_at')
          .eq('audio_set_id', audioSetId)
          .eq('status', 'completed')
          .not('audio_url', 'is', null)
          .order('created_at', { ascending: false })

        if (data) {
          tracks = data.map(t => ({
            ...t,
            resolved_url: !useDirectAudio && t.mixed_audio_url && t.mix_status === 'completed'
              ? t.mixed_audio_url
              : t.audio_url,
            set_name: setName,
            voice_name: voiceName,
          }))
        }
      } else {
        // Best-per-section across all standard sets
        const { data: audioSets } = await supabase
          .from('audio_sets')
          .select('id, name, voice_id')
          .eq('vision_id', visionId)
          .eq('variant', 'standard')
          .order('created_at', { ascending: false })

        if (!audioSets || audioSets.length === 0) {
          setAudioTracks({})
          return
        }

        const setLookup = new Map(audioSets.map(s => [s.id, s]))

        const { data } = await supabase
          .from('audio_tracks')
          .select('id, section_key, audio_url, audio_set_id, created_at')
          .in('audio_set_id', audioSets.map(s => s.id))
          .eq('status', 'completed')
          .not('audio_url', 'is', null)
          .order('created_at', { ascending: false })

        if (data) {
          tracks = data.map(t => {
            const parentSet = setLookup.get(t.audio_set_id)
            return {
              ...t,
              resolved_url: t.audio_url,
              set_name: parentSet?.name || 'Audio Set',
              voice_name: VOICE_DISPLAY_NAMES[parentSet?.voice_id || ''] || parentSet?.voice_id || '',
            }
          })
        }
      }

      if (!tracks) {
        setAudioTracks({})
        return
      }

      const trackMap: Record<string, { id: string; url: string; title: string; setName?: string; voiceName?: string }> = {}
      tracks.forEach(track => {
        const url = track.resolved_url
        if (url) {
          const categoryKey = sectionToCategory[track.section_key] || track.section_key
          if (!trackMap[categoryKey]) {
            trackMap[categoryKey] = {
              id: track.id,
              url,
              title: VISION_SECTIONS.find(cat => cat.key === categoryKey)?.label || categoryKey,
              setName: track.set_name,
              voiceName: track.voice_name,
            }
          }
        }
      })

      setAudioTracks(trackMap)
    } catch (error) {
      console.error('Error loading audio tracks:', error)
    }
  }

  const handleAudioSetChange = async (audioSetId: string | null) => {
    setSelectedAudioSetId(audioSetId)
    setIsAudioDropdownOpen(false)
    if (vision) {
      await loadAudioTracks(vision.id, audioSetId)
    }
  }

  const getSetIcon = (set: AudioSetOption) => {
    if (set.variant === 'personal') return <Mic className="w-5 h-5" />

    let voiceVolume = 100
    let bgVolume = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVolume = parseInt(m[1]); bgVolume = parseInt(m[2]) }
    }

    if (bgVolume === 0 || set.variant === 'standard') return <Headphones className="w-5 h-5" />
    if (voiceVolume <= 30) return <Moon className="w-5 h-5" />
    if (voiceVolume >= 40 && voiceVolume <= 60) return <Sparkles className="w-5 h-5" />
    return <Zap className="w-5 h-5" />
  }

  const getSetColor = (set: AudioSetOption) => {
    if (set.variant === 'personal') return 'bg-secondary-500/20 text-secondary-500'

    let voiceVolume = 100
    let bgVolume = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVolume = parseInt(m[1]); bgVolume = parseInt(m[2]) }
    }

    if (bgVolume === 0 || set.variant === 'standard') return 'bg-primary-500/20 text-primary-500'
    if (voiceVolume <= 30) return 'bg-blue-500/20 text-blue-400'
    if (voiceVolume >= 40 && voiceVolume <= 60) return 'bg-purple-500/20 text-purple-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }

  // Load vision data
  useEffect(() => {
    let isMounted = true
    let hasLoaded = false
    
    const loadData = async () => {
      // Prevent duplicate calls
      if (hasLoaded) {
        console.log('[Vision Detail] Skipping duplicate load')
        return
      }
      hasLoaded = true
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No authenticated user found')
          router.push('/auth/login')
          return
        }

        const resolvedParams = await params
        if (!isMounted) return
        
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
        
        // Load audio sets and tracks for this vision
        await loadAvailableAudioSets(vision.id)
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
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load vision')
          setLoading(false)
          router.push('/life-vision')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()
    
    return () => {
      isMounted = false
    }
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
  // Show delete confirmation dialog
  const handleDeleteVision = () => {
    if (!vision) {
      alert('No vision to delete')
      return
    }
    setShowDeleteDialog(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!vision) return

    setShowDeleteDialog(false)
    setDeletingVersion(vision.id)

    try {
      // Use API route to delete (bypasses RLS recursion issues)
      const response = await fetch(`/api/vision?id=${vision.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to delete vision: ${errorData.error || 'Unknown error'}`)
        setDeletingVersion(null)
        return
      }

      console.log('Vision deleted successfully')

      // Navigate back to appropriate page (household or personal)
      if (vision.household_id) {
        router.push('/life-vision/household')
      } else {
        router.push('/life-vision')
      }
    } catch (err) {
      console.error('Error deleting vision:', err)
      alert('Failed to delete vision. Please try again.')
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
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
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
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow={vision.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title={displayStatus === 'draft' ? 'Refine Life Vision' : (vision.household_id ? 'The Life We Choose' : 'The Life I Choose')}
          subtitle={displayStatus === 'draft' ? 'Refined categories will show in yellow. Once you are happy with your refinement(s), click "Commit as Active Vision".' : undefined}
        >
          {/* Version Info Badges */}
          <div className="text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
              <VersionBadge 
                versionNumber={vision.version_number} 
                status={displayStatus}
                isHouseholdVision={!!vision.household_id}
              />
              <StatusBadge status={displayStatus} subtle={displayStatus !== 'active'} className="uppercase tracking-[0.25em]" />
              <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                <CalendarDays className="w-4 h-4 text-neutral-500" />
                <span className="font-medium">Created:</span>
                <span>{new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {displayStatus === 'draft' && (
            <div className="flex justify-center">
              <Button
                onClick={commitDraftAsActive}
                disabled={isCommitting || getRefinedCategories(vision).length === 0}
                variant="primary"
                size="sm"
                className="flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
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
          )}
        </PageHero>

        {/* Versions Dropdown */}
        {showVersions && (
            <Card className="p-4 md:p-6">
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

        {/* Compact Category Selection */}
        <Card className="p-4">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Select Life Areas</h3>
                    <p className="text-sm text-neutral-400">
                      Showing {selectedCategories.length} of {VISION_SECTIONS.length}
                    </p>
                </div>

                {/* Category Grid */}
                <CategoryGrid
                  categories={VISION_SECTIONS}
                  selectedCategories={selectedCategories}
                  onCategoryClick={handleCategoryToggle}
                  layout="14-column"
                  mode="selection"
                  showSelectAll
                  onSelectAll={handleSelectAll}
                  variant="outlined"
                  withCard={false}
                />
        </Card>

        {/* Audio Set Selector */}
        {availableAudioSets.length > 0 && (
          <Card className="p-4">
            <div className="text-center mb-3">
              <h3 className="text-lg font-semibold text-white">Attached Audio</h3>
              <p className="text-sm text-neutral-400">{availableAudioSets.length} {availableAudioSets.length === 1 ? 'set' : 'sets'} available</p>
            </div>

            <div className="relative max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setIsAudioDropdownOpen(!isAudioDropdownOpen)}
                className="w-full px-4 py-2.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {selectedAudioSetId === null ? (
                    <>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-500/20 text-primary-500">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">Newest Per Section</div>
                        <div className="text-xs text-neutral-500">Most recent track for each category</div>
                      </div>
                    </>
                  ) : (
                    (() => {
                      const set = availableAudioSets.find(s => s.id === selectedAudioSetId)
                      if (!set) return <span className="text-neutral-400">Select audio set...</span>
                      return (
                        <>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getSetColor(set)}`}>
                            {getSetIcon(set)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{set.name}</div>
                            <div className="text-xs text-neutral-500">{set.track_count} tracks</div>
                          </div>
                        </>
                      )
                    })()
                  )}
                </div>
                <svg className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isAudioDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isAudioDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsAudioDropdownOpen(false)} />
                  <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[50vh] overflow-y-auto">
                    {/* Best Per Section option */}
                    <div
                      onClick={() => handleAudioSetChange(null)}
                      className={`px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors border-b border-[#333] ${selectedAudioSetId === null ? 'bg-primary-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-500/20 text-primary-500">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-white">Newest Per Section</div>
                          <div className="text-xs text-neutral-500">Most recent track for each category across all voice sets</div>
                        </div>
                        {selectedAudioSetId === null && (
                          <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Individual audio sets */}
                    {availableAudioSets.map((set) => (
                      <div
                        key={set.id}
                        onClick={() => handleAudioSetChange(set.id)}
                        className={`px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors border-b border-[#333] last:border-b-0 ${selectedAudioSetId === set.id ? 'bg-primary-500/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getSetColor(set)}`}>
                            {getSetIcon(set)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-white truncate">{set.name}</div>
                            <div className="text-xs text-neutral-500 space-x-2">
                              <span>{set.track_count} tracks</span>
                              <span>·</span>
                              <span>{set.variant === 'personal' ? 'Personal Recording' : VOICE_DISPLAY_NAMES[set.voice_id] || set.voice_id}</span>
                              {set.backgroundTrack && (
                                <>
                                  <span>·</span>
                                  <span>{set.backgroundTrack}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedAudioSetId === set.id && (
                            <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* No audio link */}
                    <div
                      onClick={() => { setAudioTracks({}); setSelectedAudioSetId('none'); setIsAudioDropdownOpen(false) }}
                      className={`px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors ${selectedAudioSetId === 'none' ? 'bg-primary-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-neutral-700/50 text-neutral-500">
                          <VolumeX className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-neutral-400">No Audio</div>
                          <div className="text-xs text-neutral-600">Hide audio players from categories</div>
                        </div>
                        {selectedAudioSetId === 'none' && (
                          <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Vision Cards */}
        {selectedCategories.length > 0 ? (
          <>
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
          </>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-neutral-400 mb-4">Select categories above to view your life vision</p>
            <Button onClick={handleSelectAll} variant="primary">
              Select All Categories
            </Button>
          </Card>
        )}

        {/* Navigation */}
        <div className="text-center space-y-4">
          {/* Delete Button */}
          <div>
            <Button
              onClick={handleDeleteVision}
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

        {/* Delete Confirmation Dialog */}
        <WarningConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Vision?"
          message="Are you sure you want to delete this vision? This action cannot be undone and all your content will be lost."
          confirmText={deletingVersion ? 'Deleting...' : 'Delete Vision'}
          type="delete"
          isLoading={!!deletingVersion}
        />
      </Stack>
    </Container>
  )
}