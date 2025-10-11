'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, Edit3, Eye, History, Star, ArrowLeft, Trash2, X, Sparkles, Zap, Target, Gem, Volume2, Download, VolumeX, Diamond } from 'lucide-react'
import { PageLayout, Container, Card, Button, Badge, ProgressBar, Spinner, getVisionCategoryKeys, getVisionCategoryIcon, getVisionCategoryLabel, VISION_CATEGORIES } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { LifeVisionSidebar } from './components/LifeVisionSidebar'

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
  romance: string
  health: string
  money: string
  business: string
  social: string
  possessions: string
  giving: string
  spirituality: string
  conclusion: string
  status: 'draft' | 'complete' | string
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
    try {
      // Check if Supabase environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing - please check environment variables')
      }
      
      const supabase = createClient()
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      const { data: { user }, error: authError } = await withTimeout(supabase.auth.getUser(), 4000, 'auth')
      
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/auth/login')
        return
      }

      console.log('User authenticated:', user.id)

      // Get the latest (active) vision version - EXCLUDE drafts
      const activeVisionResult = await withTimeout(
        async () => await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'draft') // Exclude drafts from active vision
          .order('version_number', { ascending: false })
          .limit(1)
          .single(),
        8000,
        'fetch active vision'
      )
      const { data: activeVisionData } = activeVisionResult

      // Get all versions for the versions list
      const versionsResult = await withTimeout(
        async () => await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false }),
        8000,
        'fetch versions list'
      )
      const { data: versionsData } = versionsResult

      if (activeVisionData) {
        const actualCompletion = calculateCompletionPercentage(activeVisionData)
        setActiveVision(activeVisionData)
        setCompletionPercentage(actualCompletion)
        
        // Calculate completed sections
        const completed: string[] = []
        VISION_SECTIONS.forEach(sectionKey => {
          const value = activeVisionData[sectionKey as keyof VisionData]
          if (typeof value === 'string' && value.trim()) {
            completed.push(sectionKey)
          }
        })
        setCompletedSections(completed)
      }
      
      setVersions(versionsData || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching vision:', err)
      const message = err instanceof Error ? err.message : 'Failed to load vision data'
      setError(message)
      
      // If it's an auth timeout, suggest checking network/Supabase
      if (message.includes('auth timed out')) {
        setError('Connection timeout - please check your network connection and try refreshing the page.')
      }
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
  const completedVisions = versions.filter(v => v.status === 'complete').length

  if (loading) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
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
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
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

        {/* Current Version Information Card */}
        {activeVision && (
          <Card className="p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-white mb-3">The Life I Choose</h2>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  V{activeVision.version_number}
                </span>
                {activeVision.status === 'complete' && (
                  <Badge variant="success">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Badge>
                )}
                {activeVision.status === 'draft' && (
                  <Badge variant="warning">
                    <Circle className="w-4 h-4 mr-1" />
                    Draft
                  </Badge>
                )}
              </div>
              
              {/* Metadata */}
              <div className="text-center mb-6">
                <p className="text-xs text-neutral-500 mb-1">Created</p>
                <p className="text-sm text-white">
                  {new Date(activeVision.created_at).toLocaleDateString()} at {new Date(activeVision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>

            {/* Action Buttons - Centered */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => router.push(`/life-vision/${activeVision.id}`)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Vision
              </Button>
              <Button
                onClick={() => alert('PDF download coming soon!')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button
                onClick={() => router.push(`/life-vision/${activeVision.id}/audio`)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <VolumeX className="w-4 h-4" />
                Audio Tracks
              </Button>
              <Button
                onClick={() => router.push(`/life-vision/${activeVision.id}`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={() => router.push(`/life-vision/${activeVision.id}/refine`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Gem className="w-4 h-4" />
                Refine
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        {activeVision && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{versions.length}</p>
                <p className="text-sm text-neutral-400 mb-2">Life Visions</p>
              </div>
            </Card>
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center mb-3">
                  <Gem className="w-6 h-6 text-secondary-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">0</p>
                <p className="text-sm text-neutral-400 mb-2">Refinements</p>
              </div>
            </Card>
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center mb-3">
                  <Volume2 className="w-6 h-6 text-accent-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">0</p>
                <p className="text-sm text-neutral-400 mb-2">Audios Generated</p>
              </div>
            </Card>
          </div>
        )}

        {/* All Versions List */}
        {activeVision && versions.length > 0 && (
          <Card className="p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">All Life Visions</h2>
              <Badge variant="info">{versions.length} {versions.length === 1 ? 'Version' : 'Versions'}</Badge>
            </div>
            <div className="space-y-3">
              {versions.map((version, index) => {
                // Most recent complete version is "Active"
                const isActive = version.id === activeVision?.id
                const isFirstComplete = version.status === 'complete' && index === 0
                
                return (
                  <div 
                    key={version.id} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border transition-colors gap-4 ${
                      isActive 
                        ? 'bg-primary-500/10 border-primary-500/50' 
                        : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-white">
                          Version {version.version_number}
                        </span>
                        {version.status === 'draft' && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Draft
                          </span>
                        )}
                        {version.status === 'complete' && isActive && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                            Active
                          </span>
                        )}
                        {version.status === 'complete' && !isActive && (
                          <span className="px-2 py-1 bg-neutral-600/20 text-neutral-400 rounded text-xs">
                            Complete
                          </span>
                        )}
                        <span className="text-sm text-neutral-400">
                          {version.completion_percent}% complete
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-neutral-500">
                          <span className="font-medium">Created:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                        <p className="text-xs text-neutral-500">
                          <span className="font-mono">ID:</span> {version.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[200px]">
                      {version.status === 'draft' ? (
                        <>
                          <Button
                            onClick={() => router.push('/life-vision/create-with-viva')}
                            variant="primary"
                            size="sm"
                            className="flex items-center justify-center gap-1 w-full sm:w-auto"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span className="whitespace-nowrap">Continue with VIVA</span>
                          </Button>
                          <Button
                            onClick={() => router.push(`/life-vision/${version.id}`)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center justify-center gap-1 w-full sm:w-auto"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="whitespace-nowrap">Edit On My Own</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => router.push(`/life-vision/${version.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 w-full sm:w-auto"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            onClick={() => router.push(`/life-vision/${version.id}`)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center justify-center gap-1 w-full sm:w-auto"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </Button>
                          {!isActive && (
                            <Button
                              onClick={async () => {
                                if (confirm('Make this your active vision? This will replace your current active vision.')) {
                                  try {
                                    const supabase = createClient()
                                    // In the future, we could implement a proper "active" flag
                                    // For now, we'll just navigate to it
                                    window.location.href = `/life-vision/${version.id}`
                                  } catch (error) {
                                    alert('Failed to set active vision')
                                  }
                                }
                              }}
                              variant="primary"
                              size="sm"
                              className="flex items-center justify-center gap-1 w-full sm:w-auto whitespace-nowrap"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Make Active
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        onClick={() => deleteVersion(version.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center gap-1 text-red-400 hover:text-red-300 hover:border-red-400 w-full sm:w-auto"
                        disabled={deletingVersion === version.id}
                      >
                        {deletingVersion === version.id ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
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

      </Container>
    </PageLayout>
  )
}