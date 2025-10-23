'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, ArrowLeft, Edit3, Eye, Plus, History, Sparkles, Trash2, Download, VolumeX, Gem, ChevronDown, Check, Layers } from 'lucide-react'
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge, 
  Spinner,
  Input,
  Textarea,
  Icon
} from '@/lib/design-system/components'
import { LifeVisionSidebar } from '../components/LifeVisionSidebar'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'sidebar' | 'cards'>('sidebar')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // Ref for textarea auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Ref for main content section to scroll to
  const mainContentRef = useRef<HTMLDivElement>(null)
  // Ref for mobile dropdown to scroll above it
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  // Scroll to appropriate section based on screen size (responsive)
  const scrollToMainContent = useCallback(() => {
    const isMobile = window.innerWidth < 1024 // lg breakpoint
    
    if (isMobile && mobileDropdownRef.current) {
      // Mobile: scroll above the dropdown
      const headerHeight = 80 // Approximate header height
      const elementTop = mobileDropdownRef.current.offsetTop
      const scrollPosition = elementTop - headerHeight - 10 // Header height + padding
      
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    } else if (mainContentRef.current) {
      // Desktop: scroll to main content section
      const headerHeight = 80 // Approximate header height
      const elementTop = mainContentRef.current.offsetTop
      const scrollPosition = elementTop - headerHeight - 10 // Header height + padding
      
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }
  }, [])

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }, [])

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
        }
        
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
      <>
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
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
        className={`cursor-pointer aspect-square transition-all duration-300 ${selected ? 'border border-primary-500 md:ring-2 md:ring-primary-500' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-2 p-2 justify-center h-full">
          <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#14B8A6'} />
          <span className="text-xs font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
            {category.label}
          </span>
        </div>
      </Card>
    )
  }

  const VisionCard = ({ 
    category, 
    content, 
    isEditing, 
    onSave, 
    onCancel, 
    onUpdate, 
    saving 
  }: { 
    category: any, 
    content: string, 
    isEditing: boolean, 
    onSave: () => void, 
    onCancel: () => void, 
    onUpdate: (content: string) => void, 
    saving: boolean 
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    
    const autoResizeTextarea = useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [])

    useEffect(() => {
      if (isEditing) {
        autoResizeTextarea()
      }
    }, [isEditing, autoResizeTextarea])

    useEffect(() => {
      if (isEditing && content) {
        autoResizeTextarea()
      }
    }, [content, isEditing, autoResizeTextarea])

    return (
      <Card variant="elevated" className="px-1 py-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
            <Icon icon={category.icon} size="sm" color="#199D67" />
          </div>
          <h3 className="text-lg font-semibold text-white">{category.label}</h3>
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                onUpdate(e.target.value)
                autoResizeTextarea()
              }}
              placeholder={`Describe your vision for ${category.label.toLowerCase()}...`}
              className="w-full min-h-[200px] px-1 py-3 md:p-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 resize-none"
            />
            <div className="flex gap-2">
              <Button 
                onClick={onSave} 
                disabled={saving}
                size="sm"
                className="flex items-center gap-2"
              >
                {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                onClick={onCancel} 
                variant="outline" 
                size="sm"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {content ? (
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-1 py-3 md:p-4">
                <p className="text-neutral-300 whitespace-pre-wrap">{content}</p>
              </div>
            ) : (
              <div className="bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg px-2 py-4 md:p-8 text-center">
                <p className="text-neutral-400 mb-4">No content yet</p>
                <Button 
                  onClick={() => handleEditCategory(category.key)}
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Add Content
                </Button>
              </div>
            )}
            {content && (
              <Button 
                onClick={() => handleEditCategory(category.key)}
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        )}
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
              {isEditing ? 'Edit Life Vision' : 'The Life I Choose'}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center mb-6">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Icon icon={Edit3} size="sm" />
              {isEditing ? 'View' : 'Edit'}
            </Button>
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
              variant="outline"
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

        {/* Mobile Dropdown Navigation */}
        <div ref={mobileDropdownRef} className="lg:hidden mb-6">
          <Card className="p-4">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const currentSection = VISION_SECTIONS.find(s => s.key === activeSection)
                  if (!currentSection) return null
                  const IconComponent = currentSection.icon
                  return <IconComponent className="w-5 h-5 text-primary-400" />
                })()}
                <span className="font-medium text-white">
                  {VISION_SECTIONS.find(s => s.key === activeSection)?.label || 'Select Section'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="mt-3 space-y-1">
                {VISION_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.key
                  const isCompleted = completedSections.includes(section.key)

                  return (
                    <button
                      key={section.key}
                      onClick={() => {
                        setActiveSection(section.key)
                        setIsDropdownOpen(false)
                        setTimeout(() => scrollToMainContent(), 50)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                          : 'hover:bg-neutral-800 border border-transparent text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-neutral-500'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {section.label}
                            </span>
                            {isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 truncate">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">View Mode</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('sidebar')}
                  variant={viewMode === 'sidebar' ? 'primary' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Sidebar
                </Button>
                <Button
                  onClick={() => setViewMode('cards')}
                  variant={viewMode === 'cards' ? 'primary' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Cards
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Card-based View */}
        {viewMode === 'cards' ? (
          <div className="space-y-6">
            {/* Category Selection */}
            <Card className="p-4 md:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Select Categories</h3>
                <p className="text-sm text-neutral-400">Choose which life vision categories to display</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                <CategoryCard
                  category={{ key: 'all', label: 'Select All', icon: Check }}
                  selected={selectedCategories.length === VISION_SECTIONS.length}
                  onClick={handleSelectAll}
                />
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

            {/* Vision Cards */}
            {selectedCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCategories.map((categoryKey) => {
                  const category = VISION_SECTIONS.find(cat => cat.key === categoryKey)
                  if (!category) return null
                  
                  const content = vision?.[categoryKey as keyof VisionData] as string || ''
                  const isEditing = editingCategory === categoryKey
                  
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
        ) : (
          /* Original Sidebar Layout */
          <div ref={mainContentRef}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-1">
              <LifeVisionSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                completedSections={completedSections}
                onScrollToContent={scrollToMainContent}
              />
            </div>

            {/* Main Content Area - Full width on mobile */}
            <div className="col-span-1 lg:col-span-3">
            <Card className="p-4 md:p-8">
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
                        <div className="mb-4 md:mb-6">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-primary-500" />
                            <h2 className="text-2xl md:text-3xl font-bold text-white">{currentSection.label}</h2>
                          </div>
                          <p className="text-neutral-400 text-xs md:text-sm">
                            {currentSection.description}
                          </p>
                        </div>

                        {/* Section Content */}
                        {value?.trim() ? (
                          <div className="prose prose-invert max-w-none">
                            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 md:p-6">
                              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
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
                                setTimeout(() => scrollToMainContent(), 50)
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
                                setTimeout(() => scrollToMainContent(), 50)
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
          </div>
        )}

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