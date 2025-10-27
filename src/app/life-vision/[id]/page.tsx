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
  AudioPlayer
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface VisionData {
  id: string
  user_id: string
  version_number: number
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

  // Load audio tracks for vision
  const loadAudioTracks = async (visionId: string) => {
    try {
      // Get the latest audio set for this vision
      const { data: audioSets } = await supabase
        .from('audio_sets')
        .select('id, variant')
        .eq('vision_id', visionId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!audioSets || audioSets.length === 0) return

      // Get audio tracks for the latest audio set
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('section_key, audio_url, mixed_audio_url, mix_status')
        .eq('audio_set_id', audioSets[0].id)
        .eq('status', 'completed')

      if (!tracks) return

      // Map tracks by section_key
      const trackMap: Record<string, { url: string; title: string }> = {}
      tracks.forEach(track => {
        const url = track.mixed_audio_url && track.mix_status === 'completed' 
          ? track.mixed_audio_url 
          : track.audio_url
        if (url) {
          trackMap[track.section_key] = {
            url,
            title: VISION_SECTIONS.find(cat => cat.key === track.section_key)?.label || track.section_key
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

  // Fetch specific version
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
          .order('version_number', { ascending: false })
        
        setVersions(versionsData || [])
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
      
      // Get the highest version number for this user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: latestVersion } = await supabase
        .from('vision_versions')
        .select('version_number')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const newVersionNumber = (latestVersion?.version_number || 0) + 1

      // Create new version with only the necessary fields
      const insertData = {
        user_id: user.id,
        version_number: newVersionNumber,
        forward: vision.forward || '',
        fun: vision.fun || '',
        travel: vision.travel || '',
        home: vision.home || '',
        family: vision.family || '',
        romance: vision.romance || '',
        health: vision.health || '',
        money: vision.money || '',
        business: vision.business || '',
        social: vision.social || '',
        possessions: vision.possessions || '',
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

      // Refresh versions list
      const { data: versionsData } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
      
      setVersions(versionsData || [])
      setLastSaved(new Date())
      
      alert(isDraft ? 'Vision saved as draft version!' : 'Vision saved as new version!')
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
  const downloadVisionPDF = useCallback(() => {
    if (!vision) return

    // Create a new window for PDF generation
    const pdfWindow = window.open('', '_blank')
    if (!pdfWindow) return

    // Get the current section content or all sections
    const currentSection = VISION_SECTIONS.find(s => s.key === 'fun')
    const currentContent = currentSection ? vision[currentSection.key as keyof VisionData] as string : ''

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>The Life I Choose - Version ${vision.version_number}</title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background: #000000;
              color: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            /* Cover Page Styles */
            .cover-page {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              padding: 60px 40px;
              page-break-after: always;
            }
            .cover-title {
              font-size: 48px;
              font-weight: bold;
              color: white;
              margin-bottom: 20px;
              line-height: 1.2;
            }
            .cover-subtitle {
              font-size: 24px;
              color: white;
              margin-bottom: 40px;
              font-weight: 300;
            }
            .cover-divider {
              width: 200px;
              height: 3px;
              background: #39FF14;
              margin: 0 auto 40px auto;
            }
            .cover-version {
              font-size: 20px;
              color: white;
              margin-bottom: 80px;
            }
            .cover-footer {
              position: absolute;
              bottom: 60px;
              left: 50%;
              transform: translateX(-50%);
              text-align: center;
            }
            .barbell-logo {
              width: 40px;
              height: 40px;
              margin: 0 auto 15px auto;
              background: #39FF14;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 20px;
            }
            .barbell-logo::before {
              content: "🏋";
              font-size: 24px;
            }
            .cover-created {
              font-size: 14px;
              color: white;
            }
            
            /* Content Pages Styles */
            .content-page {
              background: white;
              color: #333;
              padding: 40px;
              min-height: calc(100vh - 80px);
            }
            .content-header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #00CC44;
              padding-bottom: 20px;
            }
            .content-title {
              font-size: 32px;
              font-weight: bold;
              color: #00CC44;
              margin-bottom: 10px;
            }
            .content-version {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .content-created {
              font-size: 14px;
              color: #888;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 24px;
              font-weight: bold;
              color: #00CC44;
              margin-bottom: 15px;
              border-left: 4px solid #00CC44;
              padding-left: 15px;
            }
            .section-content {
              font-size: 16px;
              line-height: 1.8;
              color: #444;
              white-space: pre-wrap;
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
            }
            .empty-section {
              font-style: italic;
              color: #888;
              text-align: center;
              padding: 40px;
              background: #f5f5f5;
              border-radius: 8px;
              border: 2px dashed #ccc;
            }
            .completion {
              text-align: center;
              margin-top: 40px;
              padding: 20px;
              background: #39FF14;
              color: white;
              border-radius: 8px;
            }
            .completion-text {
              font-size: 18px;
              font-weight: bold;
            }
            
            @media print {
              .cover-page { 
                page-break-after: always;
                min-height: 100vh;
              }
              .content-page { 
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-title">The Life I Choose</div>
            <div class="cover-subtitle">My Conscious Creation Blueprint</div>
            <div class="cover-divider"></div>
            <div class="cover-version">Version ${vision.version_number}</div>
            <div class="cover-footer">
              <div class="barbell-logo">⚡</div>
              <div class="cover-created">Created at VibrationFit.com</div>
            </div>
          </div>
          
          <!-- Content Pages -->
          <div class="content-page">
            <div class="content-header">
              <div class="content-title">The Life I Choose</div>
              <div class="content-version">Version ${vision.version_number} ${vision.status === 'complete' ? '(Active)' : '(Draft)'}</div>
              <div class="content-created">Created: ${new Date(vision.created_at).toLocaleDateString()} at ${new Date(vision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
            </div>

            ${VISION_SECTIONS.map(section => {
              const content = vision[section.key as keyof VisionData] as string
              const hasContent = content && content.trim().length > 0
              
              return `
                <div class="section">
                  <div class="section-title">${section.label}</div>
                  <div class="section-content">
                    ${hasContent ? content.trim() : '<div class="empty-section">No content for this section yet</div>'}
                  </div>
                </div>
              `
            }).join('')}

            <div class="completion">
              <div class="completion-text">${completionPercentage}% Life Vision Complete</div>
            </div>
          </div>
        </body>
      </html>
    `

    // Write content to the new window
    pdfWindow.document.write(htmlContent)
    pdfWindow.document.close()

    // Wait for content to load, then trigger print
    setTimeout(() => {
      pdfWindow.print()
    }, 500)
  }, [vision, completionPercentage])

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
              <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                <div className="text-xs md:text-sm">
                  <p className="text-white font-medium">
                    {new Date(vision.created_at).toLocaleDateString()} at {new Date(vision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
              
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
              onClick={() => downloadVisionPDF()}
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
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Version History</h3>
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
                          <>
                            <Button
                              onClick={() => router.push('/life-vision/create-with-viva')}
                              variant="primary"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Continue with VIVA
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
                              onClick={() => {
                                const url = new URL(window.location.href)
                                url.searchParams.set('versionId', version.id)
                                window.history.pushState({}, '', url.toString())
                                fetchVisionVersion(version.id)
                              }}
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
        <div className="mt-8 text-center">
          <Link 
            href="/life-vision" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Life Visions
          </Link>
        </div>
    </>
  )
}