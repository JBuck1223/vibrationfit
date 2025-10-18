'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, ArrowLeft, Edit3, Eye, Plus, History, Sparkles, Trash2, Download, VolumeX, Gem } from 'lucide-react'
import { 
  Button, 
  GradientButton,
  Card, 
  ProgressBar, 
  Badge, 
  PageLayout, 
  Container,
  Spinner,
  Input,
  Textarea
} from '@/lib/design-system/components'
import { LifeVisionSidebar } from '../components/LifeVisionSidebar'
import { VISION_CATEGORIES } from '@/lib/design-system'

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

export default function VisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [activeSection, setActiveSection] = useState('forward')
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)

  // Ref for textarea auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }, [])

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

  // Load vision data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
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

        if (error) throw error

        // Load versions
        const { data: versionsData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false })

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
        setVersions(versionsData || [])
      } catch (error) {
        console.error('Error loading vision:', error)
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

      // Only update the fields that should be updated
      // Ensure all fields are strings and not null/undefined
      const updateData = {
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
        completion_percent: completionPercentage
        // Note: updated_at is automatically handled by database trigger
      }

      // Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error:', authError)
        throw new Error('User not authenticated')
      }

      // Test basic Supabase connection
      console.log('Testing Supabase connection...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('vision_versions')
        .select('id, title, completion_percent')
        .limit(1)

      console.log('Connection test result:', { connectionTest, connectionError })

      if (connectionError) {
        console.error('Supabase connection failed:', connectionError)
        console.error('Connection error type:', typeof connectionError)
        console.error('Connection error keys:', connectionError && typeof connectionError === 'object' ? Object.keys(connectionError) : 'Not an object')
        console.error('Connection error stringified:', JSON.stringify(connectionError))
        throw new Error(`Database connection failed: ${connectionError.message || JSON.stringify(connectionError) || 'Unknown error'}`)
      }

      console.log('Attempting to save vision with data:', {
        userId: user.id,
        visionId: vision.id,
        visionUserId: vision.user_id,
        updateData,
        completionPercentage
      })

      // Verify the vision belongs to the current user
      if (vision.user_id !== user.id) {
        console.error('Vision ownership mismatch:', {
          visionUserId: vision.user_id,
          currentUserId: user.id
        })
        throw new Error('You do not have permission to edit this vision')
      }

      // Verify the vision exists and has a valid ID
      if (!vision.id) {
        console.error('Vision ID is missing:', vision)
        throw new Error('Invalid vision data - missing ID')
      }

      // Try a different approach - check if we can even read the record first
      console.log('Testing if we can read the vision record...')
      const { data: readData, error: readError } = await supabase
        .from('vision_versions')
        .select('id, title, completion_percent')
        .eq('id', vision.id)
        .eq('user_id', user.id)
        .single()

      console.log('Read test result:', { readData, readError })

      if (readError) {
        console.error('Cannot read vision record:', readError)
        throw new Error(`Cannot access vision record: ${readError.message || 'Unknown error'}`)
      }

      // Try a simple update without the user_id filter (RLS should handle this)
      console.log('Testing simple update with just completion_percent...')
      const { data: testData, error: testError } = await supabase
        .from('vision_versions')
        .update({ completion_percent: completionPercentage })
        .eq('id', vision.id)
        .select()

      console.log('Test update result:', { testData, testError })

      if (testError) {
        console.error('Simple update failed:', testError)
        console.error('Error type:', typeof testError)
        console.error('Error keys:', testError && typeof testError === 'object' ? Object.keys(testError) : 'Not an object')
        console.error('Error stringified:', JSON.stringify(testError))
        throw new Error(`Update failed: ${testError.message || JSON.stringify(testError) || 'Unknown error'}`)
      }

      // If simple update works, try the full update
      console.log('Simple update successful, trying full update...')
      const { data, error } = await supabase
        .from('vision_versions')
        .update(updateData)
        .eq('id', vision.id)
        .select()
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('Vision saved successfully:', data)
      setCompletionPercentage(completionPercentage)
      setCompletedSections(completed)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving vision:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'Not an object')
      console.error('Error stringified:', JSON.stringify(error))
      alert(`Failed to save vision: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    } finally {
      setSaving(false)
    }
  }, [vision, supabase, calculateCompletion, getCompletedSections])

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
    const currentSection = VISION_SECTIONS.find(s => s.key === activeSection)
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
  }, [vision, activeSection, completionPercentage])

  // Auto-resize textarea when content or section changes
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (textareaRef.current) {
          autoResizeTextarea(textareaRef.current)
        }
      }, 50)
    }
  }, [vision, activeSection, isEditing, autoResizeTextarea])

  // Render section content
  const renderSection = () => {
    if (!vision) return null

    const currentSection = VISION_SECTIONS.find(s => s.key === activeSection)
    if (!currentSection) return null

    const value = vision[currentSection.key as keyof VisionData] as string || ''

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{currentSection.label}</h3>
          <p className="text-neutral-400 mb-6">{currentSection.description}</p>
          
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              updateVision({ [currentSection.key]: e.target.value })
              if (textareaRef.current) {
                autoResizeTextarea(textareaRef.current)
              }
            }}
            placeholder={`Describe your vision for ${currentSection.label.toLowerCase()}...`}
            className="w-full min-h-[200px] p-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none resize-none"
            style={{ overflow: 'hidden' }}
          />
        </div>
        
        {/* Section Save Button Container */}
        <div className="bg-neutral-800/30 border border-neutral-700 rounded-lg p-6">
          <div className="flex justify-center gap-3">
            <Button
              onClick={saveVision}
              variant="primary"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => saveAsVersion(true)}
              variant="secondary"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

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

  if (!vision) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <Card className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Vision not found</h2>
            <p className="text-neutral-400 mb-6">This vision doesn't exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link href="/life-vision">Back to Life Visions</Link>
            </Button>
          </Card>
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
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          {/* Centered Title Section */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-3">
              {isEditing ? 'Edit Life Vision' : 'The Life I Choose'}
            </h1>
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
            
            {/* Created Date */}
            <div className="text-center mb-6">
              <p className="text-xs text-neutral-500 mb-1">Created</p>
              <p className="text-sm text-white">
                {new Date(vision.created_at).toLocaleDateString()} at {new Date(vision.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          {/* Action Buttons - Centered */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Button
              onClick={() => downloadVisionPDF()}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
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
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href={`/life-vision/${vision.id}/refine`}>
                <Gem className="w-4 h-4" />
                Refine
              </Link>
            </Button>
          </div>

          {/* Progress Bar */}
          <ProgressBar 
            value={completionPercentage}
            variant="primary"
            label="Vision Completion"
            showLabel
          />

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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <LifeVisionSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              completedSections={completedSections}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              {isEditing ? (
                <div className="space-y-6">
                  {/* Section Content */}
                  {renderSection()}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Section View */}
                  {(() => {
                    const currentSection = VISION_SECTIONS.find(s => s.key === activeSection)
                    if (!currentSection) return null

                    const IconComponent = currentSection.icon
                    const value = vision[currentSection.key as keyof VisionData] as string

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
                              onClick={() => setIsEditing(true)}
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
                              const currentIndex = VISION_SECTIONS.findIndex(s => s.key === activeSection)
                              if (currentIndex > 0) {
                                setActiveSection(VISION_SECTIONS[currentIndex - 1].key)
                                // Scroll to top of page
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            disabled={VISION_SECTIONS.findIndex(s => s.key === activeSection) === 0}
                            className="flex items-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          
                          <div className="text-sm text-neutral-400">
                            {VISION_SECTIONS.findIndex(s => s.key === activeSection) + 1} of {VISION_SECTIONS.length}
                          </div>

                          <Button
                            onClick={() => {
                              const currentIndex = VISION_SECTIONS.findIndex(s => s.key === activeSection)
                              if (currentIndex < VISION_SECTIONS.length - 1) {
                                setActiveSection(VISION_SECTIONS[currentIndex + 1].key)
                                // Scroll to top of page
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            disabled={VISION_SECTIONS.findIndex(s => s.key === activeSection) === VISION_SECTIONS.length - 1}
                            className="flex items-center gap-2"
                          >
                            Next
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </Card>
          </div>
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
      </Container>
    </PageLayout>
  )
}