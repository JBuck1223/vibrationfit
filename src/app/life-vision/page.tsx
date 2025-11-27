'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, Edit3, Eye, History, Star, ArrowLeft, Trash2, X, Sparkles, Zap, Target, Gem, Volume2, Download, VolumeX, Diamond, Copy } from 'lucide-react'
import { Card, Button, Badge, ProgressBar, Spinner, Grid, CreatedDateBadge } from '@/lib/design-system/components'
import { VisionVersionCard } from './components/VisionVersionCard'
import { getVisionCategoryKeys, getVisionCategoryIcon, getVisionCategoryLabel, VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'
import { LifeVisionSidebar } from './components/LifeVisionSidebar'
import { colors } from '@/lib/design-system/tokens'

// Use centralized vision categories
const VISION_SECTIONS = getVisionCategoryKeys()

function calculateCompletionPercentage(vision: Record<string, unknown>) {
  const sections = VISION_SECTIONS.map(section => vision[section] as string)
  const filledSections = sections.filter(section => String(section || '').trim().length > 0).length
  const totalSections = VISION_SECTIONS.length // No longer including title
  return Math.round((filledSections / totalSections) * 100)
}

// Use centralized vision category icon function
const getSectionIcon = getVisionCategoryIcon

interface VisionData {
  id: string
  user_id: string
  title?: string
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
  version_number: number
  created_at: string
  updated_at: string
}

export default function VisionListPage() {
  const router = useRouter()
  const [activeVision, setActiveVision] = useState<VisionData | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<VisionData[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [activeSection, setActiveSection] = useState('forward')
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [refinementsCount, setRefinementsCount] = useState(0)
  const [audiosCount, setAudiosCount] = useState(0)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [versionToClone, setVersionToClone] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Utility: add timeout to any async operation to avoid infinite loading
  const withTimeout = async <T,>(operation: Promise<T> | (() => Promise<T>), ms = 10000, label = 'operation'): Promise<T> => {
    const promise = typeof operation === 'function' ? operation() : operation
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
    ])
  }

  useEffect(() => {
    fetchVision()
  }, [])

  // Safety net: if still loading after 8s, surface a friendly error instead of spinning forever
  useEffect(() => {
    if (!loading) return
    const id = setTimeout(() => {
      setLoading(false)
      if (!activeVision && versions.length === 0 && !error) {
        setError('Taking longer than expected to load your vision. Please try again.')
      }
    }, 8000)
    return () => clearTimeout(id)
  }, [loading, activeVision, versions.length, error])

  // Refresh on tab visibility regain (e.g., after re-auth)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchVision()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Check for version parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const versionId = urlParams.get('versionId')
    if (versionId) {
      setCurrentVersionId(versionId)
      fetchVisionVersion(versionId)
    } else {
      setCurrentVersionId(null)
      setIsViewingVersion(false)
    }
  }, [])

  // Update version viewing state when versions data is available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const versionId = urlParams.get('versionId')
    
    if (!versionId) {
      // No versionId in URL = viewing current version
      setIsViewingVersion(false)
      setCurrentVersionId(null)
    } else if (versions.length > 0) {
      // Check if the versionId matches the latest version (which is the current)
      const latestVersion = versions[0] // versions are ordered by version_number desc
      if (versionId === latestVersion?.id) {
        // This is actually the current version, even though it has a versionId
        setIsViewingVersion(false)
        setCurrentVersionId(versionId) // Keep the versionId so version info card shows
      } else {
        // This is a historical version
        setIsViewingVersion(true)
        setCurrentVersionId(versionId)
      }
    }
  }, [versions])

  const fetchVision = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use API route instead of direct Supabase calls (like profile pages do)
      const response = await fetch('/api/vision?includeVersions=true')
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to login')
          router.push('/auth/login')
          return
        }
        const errorText = await response.text()
        throw new Error(`Failed to fetch vision: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Set active vision
      if (data.vision) {
        const actualCompletion = calculateCompletionPercentage(data.vision)
        setActiveVision(data.vision)
        setCompletionPercentage(actualCompletion)
        setCurrentVersionId(data.vision.id)
        
        // Calculate completed sections
        const completed: string[] = []
        VISION_SECTIONS.forEach(sectionKey => {
          const value = data.vision[sectionKey as keyof VisionData]
          if (typeof value === 'string' && value.trim()) {
            completed.push(sectionKey)
          }
        })
        setCompletedSections(completed)
      } else {
        setActiveVision(null)
        setCurrentVersionId(null)
        setCompletionPercentage(0)
        setCompletedSections([])
      }
      
      // Set versions list
      if (data.versions && Array.isArray(data.versions)) {
        setVersions(data.versions)
      } else {
        setVersions([])
      }
      
      // Fetch refined categories count from draft vision
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get draft vision and count refined_categories
          const { data: draftVision, error } = await supabase
            .from('vision_versions')
            .select('refined_categories')
            .eq('user_id', user.id)
            .eq('is_draft', true)
            .eq('is_active', false)
            .maybeSingle()
          
          if (error) {
            console.warn('Error fetching draft vision for refinements count:', error)
            setRefinementsCount(0)
          } else {
            const refinedCount = draftVision?.refined_categories?.length || 0
            setRefinementsCount(refinedCount)
          }
        } else {
          setRefinementsCount(0)
        }
      } catch (err) {
        console.warn('Could not fetch refined categories count:', err)
        setRefinementsCount(0)
      }
      
      // Fetch audio tracks count (using direct Supabase call for count - lightweight)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { count } = await supabase
            .from('audio_tracks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          setAudiosCount(count || 0)
        }
      } catch (err) {
        console.warn('Could not fetch audio tracks count:', err)
      }
      
    } catch (err) {
      console.error('Error fetching vision:', err)
      const message = err instanceof Error ? err.message : 'Failed to load vision data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchVisionVersion = async (versionId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: version } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', versionId)
        .eq('user_id', user.id)
        .single()

      if (version) {
        const actualCompletion = calculateCompletionPercentage(version)
        setActiveVision(version)
        setCompletionPercentage(actualCompletion)
        setIsViewingVersion(true)
        
        // Calculate completed sections
        const completed: string[] = []
        VISION_SECTIONS.forEach(sectionKey => {
          const value = version[sectionKey as keyof VisionData]
          if (typeof value === 'string' && value.trim()) {
            completed.push(sectionKey)
          }
        })
        setCompletedSections(completed)
      }
    } catch (error) {
      console.error('Error fetching version:', error)
      setError('Failed to load vision version')
    }
  }

  const handleDeleteVersion = (versionId: string) => {
    setVersionToDelete(versionId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!versionToDelete) return
    
    setIsDeleting(true)
    setShowDeleteDialog(false)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vision_versions')
        .delete()
        .eq('id', versionToDelete)

      if (error) throw error

      // Refresh the vision to get updated versions list
      await fetchVision()
    } catch (error) {
      console.error('Error deleting version:', error)
      alert('Failed to delete version. Please try again.')
    } finally {
      setIsDeleting(false)
      setVersionToDelete(null)
    }
  }

  const handleCloneVersion = async (versionId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if a draft already exists
      const { data: existingDraft } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        // Show override dialog
        setVersionToClone(versionId)
        setShowCloneDialog(true)
        return
      }

      // No existing draft, proceed with clone
      await performClone(versionId)
    } catch (error) {
      console.error('Error checking for drafts:', error)
      alert('Failed to check for existing drafts. Please try again.')
    }
  }

  const performClone = async (versionId: string) => {
    setIsCloning(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete existing draft if any
      await supabase
        .from('vision_versions')
        .delete()
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      // Fetch the version to clone
      const { data: sourceVersion, error: fetchError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', versionId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !sourceVersion) {
        alert('Failed to fetch version to clone')
        return
      }

      // Get the highest version number
      const maxVersion = Math.max(...versions.map(v => v.version_number), 0)
      const newVersionNumber = maxVersion + 1

      // Create new version with copied data
      const { data: newVersion, error: insertError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          title: sourceVersion.title || `Vision V${newVersionNumber}`,
          forward: sourceVersion.forward,
          fun: sourceVersion.fun,
          travel: sourceVersion.travel,
          home: sourceVersion.home,
          family: sourceVersion.family,
          love: sourceVersion.love,
          health: sourceVersion.health,
          money: sourceVersion.money,
          work: sourceVersion.work,
          social: sourceVersion.social,
          stuff: sourceVersion.stuff,
          giving: sourceVersion.giving,
          spirituality: sourceVersion.spirituality,
          conclusion: sourceVersion.conclusion,
          version_number: newVersionNumber,
          is_draft: true,
          is_active: false,
          completion_percent: sourceVersion.completion_percent
        })
        .select()
        .single()

      if (insertError) {
        console.error('Clone insert error:', insertError)
        console.error('Insert error details:', JSON.stringify(insertError, null, 2))
        alert(`Failed to clone version: ${insertError.message || 'Unknown error'}`)
        return
      }

      if (!newVersion) {
        console.error('No new version returned from insert')
        alert('Failed to clone version: No data returned')
        return
      }

      // Refresh the vision list
      await fetchVision()
      
      // Navigate to the new draft view page
      router.push(`/life-vision/${newVersion.id}`)
    } catch (error) {
      console.error('Error cloning version:', error)
      alert('Failed to clone version. Please try again.')
    } finally {
      setIsCloning(false)
    }
  }

  const confirmClone = async () => {
    setShowCloneDialog(false)
    if (versionToClone) {
      await performClone(versionToClone)
      setVersionToClone(null)
    }
  }

  const getCurrentVersionInfo = () => {
    if (!isViewingVersion || !currentVersionId) return null
    return versions.find(v => v.id === currentVersionId)
  }

  const visionCount = versions.length
  const completedVisions = versions.filter(v => !v.is_draft).length

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <X className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vision Error</h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <Button onClick={fetchVision} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
        {/* Page Hero - All Life Visions */}
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
                  <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                    All Life Visions
                  </h1>
                </div>
                
                {/* Subtitle */}
                <div className="text-center">
                  <p className="text-xs md:text-lg text-neutral-300">
                    View all of your Life Vision versions below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button (only when no active vision) */}
        {!activeVision && (
          <div className="flex justify-end mb-8">
            <Button
              onClick={() => router.push('/life-vision/new')}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Life Vision
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        {activeVision && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{versions.length}</p>
                  <p className="text-xs text-neutral-400">Vision Versions</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center">
                  <Gem className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{refinementsCount}</p>
                  <p className="text-xs text-neutral-400">Refinements</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{audiosCount}</p>
                  <p className="text-xs text-neutral-400">Audios</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* All Versions List */}
        {activeVision && versions.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white">Life Vision Versions</h3>
            </div>
            <div className="space-y-4">
              {versions.map((version, index) => {
                // Check database is_active field
                const isActive = version.is_active && !version.is_draft
                const isDraftVersion = version.is_draft === true
                
                return (
                  <VisionVersionCard
                    key={`${version.id}-${index}`}
                    version={version}
                    isActive={isActive}
                    onDelete={handleDeleteVersion}
                    actions={
                        <>
                          {isDraftVersion ? (
                            // Draft version - link to draft page with yellow ghost button
                            <Button
                              asChild
                              variant="ghost-yellow"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                            >
                              <Link href={`/life-vision/${version.id.replace('draft-', '')}/refine/draft`}>
                                <Eye className="w-4 h-4" />
                                <span className="ml-1 truncate">View</span>
                              </Link>
                            </Button>
                          ) : isActive ? (
                            <>
                              <Button
                                onClick={() => handleCloneVersion(version.id)}
                                variant="ghost"
                                size="sm"
                                disabled={isCloning}
                                className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Clone
                              </Button>
                              <Button
                                onClick={() => router.push(`/life-vision/${version.id}`)}
                                variant="primary"
                                size="sm"
                                className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleCloneVersion(version.id)}
                                variant="ghost"
                                size="sm"
                                disabled={isCloning}
                                className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Clone
                              </Button>
                              <Button
                                onClick={() => router.push(`/life-vision/${version.id}`)}
                                variant="ghost-blue"
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
            </div>
          </Card>
        )}

        {/* No Vision State */}
        {!activeVision && (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-white mb-4">No vision yet</h3>
              <p className="text-neutral-400 mb-8">
                Start your conscious creation journey by creating your first Life Vision. 
                Define what you want to create across all areas of your life.
              </p>
              <Button asChild size="lg">
                <Link href="/life-vision/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Life Vision
                </Link>
              </Button>
            </Card>
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
                      Cloning...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Clone Version
                    </>
                  )}
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
                  Delete Version?
                </h3>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-neutral-300 mb-6">
                Are you sure you want to delete this vision version? This action cannot be undone.
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
                  className="flex-1 gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Version
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

    </>
  )
}