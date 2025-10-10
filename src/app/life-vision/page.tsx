'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, Edit3, Eye, History, Star, ArrowLeft, Trash2, X, Sparkles } from 'lucide-react'
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">My Life Vision</h1>
                {isViewingVersion && getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      Version {getCurrentVersionInfo()?.version_number}
                    </span>
                    {getCurrentVersionInfo()?.status === 'draft' && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        Draft
                      </span>
                    )}
                  </div>
                )}
                {!isViewingVersion && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Active Version
                  </span>
                )}
              </div>
              <p className="text-neutral-400">
                {isViewingVersion 
                  ? (() => {
                      const versionInfo = getCurrentVersionInfo()
                      return versionInfo ? `Viewing saved version from ${new Date(versionInfo.created_at).toLocaleDateString()}` : 'Viewing saved version'
                    })()
                  : 'Complete overview of your current life vision'
                }
              </p>
            </div>
            {isViewingVersion && currentVersionId ? (
              <Button
                onClick={() => {
                  setCurrentVersionId(null)
                  setIsViewingVersion(false)
                  window.history.pushState({}, '', '/life-vision')
                  fetchVision()
                }}
                variant="primary"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Active
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (activeVision?.id) {
                    router.push(`/life-vision/${activeVision.id}/refine`)
                  } else {
                    router.push('/life-vision/new')
                  }
                }}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Refine My Vision
              </Button>
            )}
            <Button
              onClick={() => setShowVersions(!showVersions)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showVersions ? 'Hide' : 'Show'} Versions
            </Button>
            {activeVision && (
              <Button
                onClick={() => router.push(`/life-vision/${activeVision.id}`)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Vision
              </Button>
            )}
          </div>

          {/* Completion Progress */}
          {activeVision && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Vision Completion</h2>
                  {isViewingVersion && getCurrentVersionInfo() && (
                    <p className="text-sm text-neutral-400 mt-1">
                      {(() => {
                        const versionInfo = getCurrentVersionInfo()
                        return versionInfo ? `Version ${versionInfo.version_number} • Saved on ${new Date(versionInfo.created_at).toLocaleDateString()}` : ''
                      })()}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary-500">
                  {completionPercentage}%
                </span>
              </div>
              <ProgressBar 
                value={completionPercentage}
                variant="primary"
                showLabel={false}
              />
              <p className="text-sm text-neutral-400 mt-2">
                {completionPercentage >= 80 
                  ? "Excellent! Your vision is well-defined." 
                  : completionPercentage >= 60 
                  ? "Good progress! A few more sections would be helpful."
                  : "Keep going! Complete more sections to unlock your full potential."
                }
              </p>
            </Card>
          )}

          {/* Versions List */}
          {showVersions && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Vision Versions</h2>
              {versions.length === 0 ? (
                <p className="text-neutral-400">No saved versions yet.</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
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
                          {version.status === 'complete' && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              Complete
                            </span>
                          )}
                          <span className="text-sm text-neutral-400">
                            {version.completion_percent}% complete
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-neutral-500">
                            <span className="font-mono">ID:</span> {version.id}
                          </p>
                          <p className="text-xs text-neutral-500">
                            <span className="font-medium">Version:</span> v{version.version_number}
                          </p>
                          <p className="text-xs text-neutral-500">
                            <span className="font-medium">Created:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.status === 'draft' ? (
                          // Special handling for Viva drafts - offer both Viva and manual editing
                          <>
                            <Button
                              onClick={() => router.push('/life-vision/create-with-viva')}
                              variant="primary"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Continue with Viva
                            </Button>
                            <Button
                              onClick={() => router.push(`/life-vision/${version.id}`)}
                              variant="secondary"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit On My Own
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => window.location.href = `/life-vision?versionId=${version.id}`}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                            {version.status === 'draft' && (
                              <Button
                                onClick={() => router.push(`/life-vision/${version.id}`)}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          onClick={() => deleteVersion(version.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:border-red-400"
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
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Current Version Information */}
        {!currentVersionId && versions.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-green-500" />
              Current Version Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Version ID:</span>
                <span className="font-mono text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                  {versions[0]?.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Last Updated:</span>
                <span className="text-sm text-white">
                  {versions[0]?.created_at 
                    ? `${new Date(versions[0].created_at).toLocaleDateString()} at ${new Date(versions[0].created_at).toLocaleTimeString()}`
                    : 'Date not available'
                  }
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Version Information */}
        {(() => {
          const urlVersionId = new URLSearchParams(window.location.search).get('versionId')
          return urlVersionId && (getCurrentVersionInfo() || urlVersionId)
        })() && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Version Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Version ID:</span>
                <span className="font-mono text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                  {getCurrentVersionInfo()?.id || new URLSearchParams(window.location.search).get('versionId')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Created:</span>
                <span className="text-sm text-white">
                  {(() => {
                    const versionInfo = getCurrentVersionInfo()
                    return versionInfo?.created_at 
                      ? `${new Date(versionInfo.created_at).toLocaleDateString()} at ${new Date(versionInfo.created_at).toLocaleTimeString()}`
                      : 'Date not available'
                  })()}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Active Vision Display with Sidebar */}
        {activeVision ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <LifeVisionSidebar
                activeSection={activeSection}
                onSectionChange={(section) => {
                  setActiveSection(section)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                completedSections={completedSections}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Card className="p-8">
                {(() => {
                  const currentSection = VISION_CATEGORIES.find(s => s.key === activeSection)
                  if (!currentSection) return null

                  const IconComponent = currentSection.icon
                  const value = activeVision[currentSection.key as keyof VisionData] as string

                  return (
                    <div>
                      {/* Section Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-8 h-8 text-primary-500" />
                          <h2 className="text-3xl font-bold text-white">{currentSection.label}</h2>
                        </div>
                        <p className="text-neutral-400 text-sm">
                          {currentSection.description}
                        </p>
                      </div>

                      {/* Section Content */}
                      {value?.trim() ? (
                        <div className="prose prose-invert max-w-none">
                          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-base">
                              {value}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg p-12 text-center">
                          <p className="text-neutral-500 mb-4">
                            No content for this section yet
                          </p>
                          <Button
                            onClick={() => router.push(`/life-vision/${activeVision.id}`)}
                            variant="primary"
                            size="sm"
                            className="flex items-center gap-2 mx-auto"
                          >
                            <Edit3 className="w-4 h-4" />
                            Add Content
                          </Button>
                        </div>
                      )}

                      {/* Section Navigation */}
                      <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-700">
                        <Button
                          onClick={() => {
                            const currentIndex = VISION_SECTIONS.indexOf(activeSection)
                            if (currentIndex > 0) {
                              setActiveSection(VISION_SECTIONS[currentIndex - 1])
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={VISION_SECTIONS.indexOf(activeSection) === 0}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        
                        <div className="text-sm text-neutral-400">
                          {VISION_SECTIONS.indexOf(activeSection) + 1} of {VISION_SECTIONS.length}
                        </div>

                        <Button
                          onClick={() => {
                            const currentIndex = VISION_SECTIONS.indexOf(activeSection)
                            if (currentIndex < VISION_SECTIONS.length - 1) {
                              setActiveSection(VISION_SECTIONS[currentIndex + 1])
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={VISION_SECTIONS.indexOf(activeSection) === VISION_SECTIONS.length - 1}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </Card>
            </div>
          </div>
        ) : (
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

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </Container>
    </PageLayout>
  )
}