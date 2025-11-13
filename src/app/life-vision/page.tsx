'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, Edit3, Eye, History, Star, ArrowLeft, Trash2, X, Sparkles, Zap, Target, Gem, Volume2, Download, VolumeX, Diamond } from 'lucide-react'
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

  const deleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    setDeletingVersion(versionId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vision_versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      // Refresh the vision to get updated versions list
      await fetchVision()
    } catch (error) {
      console.error('Error deleting version:', error)
      alert('Failed to delete version. Please try again.')
    } finally {
      setDeletingVersion(null)
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
            <div className="relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              
              <div className="relative z-10">
                {/* Eyebrow */}
                <div className="text-center mb-3">
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
                  <h4 className="text-xs md:text-xl text-neutral-300 max-w-3xl mx-auto font-normal">
                    View all of your Life Vision versions below.
                  </h4>
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
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-2 md:mb-3">
                  <Target className="w-4 h-4 md:w-6 md:h-6 text-primary-500" />
                </div>
                <p className="text-xl md:text-3xl font-bold text-white mb-1">{versions.length}</p>
                <p className="text-xs md:text-sm text-neutral-400 mb-2">Visions</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary-500/20 rounded-full flex items-center justify-center mb-2 md:mb-3">
                  <Gem className="w-4 h-4 md:w-6 md:h-6 text-secondary-500" />
                </div>
                <p className="text-xl md:text-3xl font-bold text-white mb-1">{refinementsCount}</p>
                <p className="text-xs md:text-sm text-neutral-400 mb-2">Categories Refined</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-accent-500/20 rounded-full flex items-center justify-center mb-2 md:mb-3">
                  <Volume2 className="w-4 h-4 md:w-6 md:h-6 text-accent-500" />
                </div>
                <p className="text-xl md:text-3xl font-bold text-white mb-1">{audiosCount}</p>
                <p className="text-xs md:text-sm text-neutral-400 mb-2">Audios</p>
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
                // Most recent complete version is "Active"
                const isActive = version.id === activeVision?.id
                const isDraftVersion = version.id?.startsWith('draft-') || (version as any).isDraft
                
                return (
                  <VisionVersionCard
                    key={version.id}
                    version={version}
                    isActive={isActive}
                    actions={
                        <>
                          {isDraftVersion ? (
                            // Draft version - link to draft page with yellow button matching badge
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                              style={{
                                backgroundColor: `${colors.energy.yellow[500]}33`,
                                color: colors.energy.yellow[500]
                              }}
                            >
                              <Link href={`/life-vision/${version.id.replace('draft-', '')}/refine/draft`}>
                                <Eye className="w-4 h-4" />
                                <span className="ml-1 truncate">View</span>
                              </Link>
                            </Button>
                          ) : isActive ? (
                            <Button
                              onClick={() => router.push(`/life-vision/${version.id}`)}
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 bg-[#39FF14] text-black hover:bg-[#39FF14]/90 border-0"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          ) : (
                            <Button
                              onClick={() => router.push(`/life-vision/${version.id}`)}
                              variant="ghost"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
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

    </>
  )
}