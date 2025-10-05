'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, ArrowLeft, Edit3 } from 'lucide-react'
import { 
  Button, 
  GradientButton,
  Card, 
  ProgressBar, 
  Badge, 
  PageLayout, 
  Container,
  Spinner,
  Input
} from '@/lib/design-system/components'

interface VisionData {
  id: string
  title: string
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
  completion_percentage: number
  created_at: string
  updated_at: string
}

const VISION_SECTIONS = [
  { key: 'forward', label: 'Forward', description: 'A short opening statement that sets your intention, energy, and focus before describing your vision.', icon: '✨' },
  { key: 'fun', label: 'Fun / Recreation', description: 'The hobbies, play, and joyful activities that make life light, exciting, and fun.', icon: '🎉' },
  { key: 'travel', label: 'Variety / Travel / Adventure', description: 'The places you want to explore, cultures to experience, and adventures to embark on.', icon: '✈️' },
  { key: 'home', label: 'Home / Environment', description: 'Your ideal living space, environment, and the feeling you want to create at home.', icon: '🏡' },
  { key: 'family', label: 'Family / Parenting', description: 'Your relationships with family members and the family life you want to cultivate.', icon: '👨‍👩‍👧‍👦' },
  { key: 'romance', label: 'Love / Romance / Partner', description: 'Your ideal romantic relationship and the love life you want to experience.', icon: '💕' },
  { key: 'health', label: 'Health / Body / Vitality', description: 'Your physical, mental, and emotional well-being goals and lifestyle.', icon: '💪' },
  { key: 'money', label: 'Money / Wealth / Investments', description: 'Your financial goals, relationship with money, and economic freedom.', icon: '💰' },
  { key: 'business', label: 'Business / Career / Work', description: 'Your career, professional goals, and the work you want to do.', icon: '💼' },
  { key: 'social', label: 'Social / Friends', description: 'Your friendships, social connections, and community involvement.', icon: '🤝' },
  { key: 'possessions', label: 'Things / Belongings / Stuff', description: 'The material things that would enhance your life and bring you joy.', icon: '🎁' },
  { key: 'giving', label: 'Giving / Contribution / Legacy', description: 'How you want to contribute to others and make a positive impact.', icon: '🌟' },
  { key: 'spirituality', label: 'Expansion / Spirituality', description: 'Your spiritual beliefs, practices, and connection to something greater.', icon: '🙏' },
  { key: 'conclusion', label: 'Conclusion', description: 'A closing statement that summarizes your vision and sets your intention.', icon: '🎯' }
]

export default function VisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [visionData, setVisionData] = useState<VisionData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication and load vision data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Await params to get the id
      const resolvedParams = await params
      
      // Load vision data
      const { data: vision, error } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        setError('Vision not found')
        setLoading(false)
        return
      }

      // Calculate the actual completion percentage based on current data
      const sections = VISION_SECTIONS.map(section => vision[section.key as keyof VisionData] as string)
      const filledSections = sections.filter(section => section?.trim().length > 0).length
      const titleFilled = vision.title?.trim().length > 0 ? 1 : 0
      const totalSections = VISION_SECTIONS.length + 1 // +1 for title
      const actualCompletion = Math.round(((filledSections + titleFilled) / totalSections) * 100)

      // Update the vision data with the correct completion percentage
      const visionWithCorrectCompletion = {
        ...vision,
        completion_percentage: actualCompletion
      }

      // If the completion percentage in the database is different, update it
      if (vision.completion_percentage !== actualCompletion) {
        await supabase
          .from('vision_versions')
          .update({ completion_percentage: actualCompletion })
          .eq('id', resolvedParams.id)
      }

      setVisionData(visionWithCorrectCompletion)
      setLoading(false)
    }
    loadData()
  }, [params, router, supabase])

  // Calculate completion percentage
  const calculateCompletion = useCallback((data: VisionData) => {
    const sections = VISION_SECTIONS.map(section => data[section.key as keyof VisionData] as string)
    const filledSections = sections.filter(section => section.trim().length > 0).length
    const titleFilled = data.title.trim().length > 0 ? 1 : 0
    const totalSections = VISION_SECTIONS.length + 1 // +1 for title
    return Math.round(((filledSections + titleFilled) / totalSections) * 100)
  }, [])

  // Save vision function
  const saveVision = useCallback(async (data: VisionData, isComplete = false) => {
    if (!user) return

    setIsSaving(true)
    try {
      const completionPercentage = calculateCompletion(data)
      const visionToSave = {
        ...data,
        completion_percentage: completionPercentage,
        status: isComplete ? 'complete' : 'draft',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('vision_versions')
        .update(visionToSave)
        .eq('id', data.id)
      
      if (error) throw error
      
      setVisionData(visionToSave)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving vision:', error)
    } finally {
      setIsSaving(false)
    }
  }, [user, supabase, calculateCompletion])

  // Auto-save every 30 seconds when editing
  useEffect(() => {
    if (!user || !visionData || !isEditing) return

    const interval = setInterval(() => {
      saveVision(visionData)
    }, 30000)

    return () => clearInterval(interval)
  }, [visionData, saveVision, user, isEditing])

  // Handle input changes
  const handleInputChange = (field: keyof VisionData, value: string) => {
    if (!visionData) return
    setVisionData(prev => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value }
      const completionPercentage = calculateCompletion(updated)
      return { ...updated, completion_percentage: completionPercentage }
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visionData) return
    await saveVision(visionData, true)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#199D67] mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading vision...</p>
        </div>
      </div>
    )
  }

  if (error || !visionData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#D03739] mb-4">Vision Not Found</h1>
          <p className="text-[#9CA3AF] mb-6">{error}</p>
          <Link 
            href="/life-vision"
            className="bg-gradient-to-r from-[#199D67] to-[#5EC49A] hover:from-[#5EC49A] hover:to-[#2DD4BF] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#199D67]/25"
          >
            Back to Visions
          </Link>
        </div>
      </div>
    )
  }

  const completedSections = VISION_SECTIONS.filter(section => 
    String(visionData[section.key as keyof VisionData] || '').trim().length > 0
  ).length + (String(visionData.title || '').trim().length > 0 ? 1 : 0)

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="bg-[#199D67] py-8 px-6 text-center mb-8 hover:opacity-90 transition-all duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Link 
                href="/life-vision"
                className="text-white/80 hover:text-white mr-4 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                The Life I Choose
              </h1>
            </div>
            
            {/* Vision Info */}
            <div className="max-w-md mx-auto mb-6">
              <div className="text-white/90 text-sm space-y-1">
                <div>Created By: {user?.user_metadata?.full_name || user?.email || 'Unknown User'}</div>
                <div>Created On: {visionData.created_at ? new Date(visionData.created_at).toLocaleDateString() : 'Unknown Date'}</div>
              </div>
            </div>
            
            <p className="text-white/95 text-xl mb-6 font-light">
              {isEditing ? 'Refine your Active Vision across 14 life categories' : 'Review your conscious creation journey'}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex justify-between mb-3 text-sm font-medium">
                <span className="text-white/90">{completedSections} of {VISION_SECTIONS.length + 1} sections completed</span>
                <span className="text-white/90">{visionData.completion_percentage || 0}%</span>
              </div>
              <div className="h-3 bg-[#5EC49A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/20 transition-all duration-500 ease-out"
                  style={{ width: `${visionData.completion_percentage || 0}%` }}
                />
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "primary"}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isEditing ? 'View Mode' : 'Edit Mode'}
              </Button>
            </div>
          </div>
        </div>

                  {isEditing ? (
                    /* Edit Form - Mirror New Vision Page */
                    <div className="flex min-h-screen -mt-8">
                      {/* Sidebar Navigation */}
                      <div className="hidden lg:block w-80 bg-[#1F1F1F] p-6 sticky top-0 h-screen overflow-y-auto border-r border-[#404040]">
              <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4 uppercase tracking-wide">
                Life Categories
              </h3>
              <div className="space-y-1">
                {VISION_SECTIONS.map((section, index) => {
                  const isCompleted = (String(visionData[section.key as keyof VisionData] || '').trim().length || 0) > 0
                  const isActive = index === activeSection
                  
                  return (
                    <Card
                      key={section.key}
                      variant={isActive ? "default" : "outlined"}
                      className={`
                        w-full p-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5
                        ${isActive 
                          ? 'bg-[#199D67]/20 border-l-4 border-[#199D67] text-[#199D67] font-semibold' 
                          : 'hover:bg-[#1F1F1F]/50 text-[#e5e7eb]'
                        }
                      `}
                      onClick={() => setActiveSection(index)}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{section.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{section.label}</span>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-[#199D67]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#666666]" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 lg:p-12 max-w-4xl">
              {/* Section Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{VISION_SECTIONS[activeSection].icon}</span>
                    <div>
                      <h2 className="text-3xl font-bold mb-1">
                        {VISION_SECTIONS[activeSection].label}
                      </h2>
                      <p className="text-[#9CA3AF] text-sm">
                        Section {activeSection + 1} of {VISION_SECTIONS.length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Auto-save Status */}
                  <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    {isSaving && (
                      <>
                        <Spinner variant="secondary" size="sm" />
                        <span>Saving...</span>
                      </>
                    )}
                    {lastSaved && !isSaving && (
                      <>
                        <CheckCircle size={16} className="text-[#199D67]" />
                        <span className="text-[#199D67]">Saved</span>
                      </>
                    )}
                    {!isSaving && !lastSaved && (
                      <>
                        <Save size={16} />
                        <span>Auto-save enabled</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[#9CA3AF] text-lg leading-relaxed">
                  {VISION_SECTIONS[activeSection].description}
                </p>
              </div>

                        {/* Section Content */}
                        <form onSubmit={handleSubmit}>
                          <Card className="mb-8">
                            <textarea
                              value={visionData[VISION_SECTIONS[activeSection].key as keyof VisionData] as string}
                              onChange={(e) => handleInputChange(VISION_SECTIONS[activeSection].key as keyof VisionData, e.target.value)}
                              className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#404040] focus:border-[#199D67] rounded-lg text-white placeholder:text-[#666666] resize-none focus:outline-none"
                              rows={8}
                              placeholder={`Describe your vision for ${VISION_SECTIONS[activeSection].label.toLowerCase()}...`}
                            />
                          </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (activeSection > 0) {
                        setActiveSection(activeSection - 1)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                    disabled={activeSection === 0}
                    className="px-6 py-3"
                  >
                    Previous Section
                  </Button>

                  <div className="flex items-center gap-4">
                    {activeSection < VISION_SECTIONS.length - 1 ? (
                      <GradientButton
                        gradient="brand"
                        type="button"
                        onClick={() => {
                          setActiveSection(activeSection + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-6 py-3"
                      >
                        Next Section
                      </GradientButton>
                    ) : (
                      <GradientButton
                        gradient="purple"
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3"
                      >
                        {isSaving ? 'Saving...' : 'Mark as Complete'}
                      </GradientButton>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Vision Title */}
            <Card>
              <h2 className="text-2xl font-bold text-white mb-2">
                {visionData.title || 'Untitled Vision'}
              </h2>
            </Card>

            {/* Vision Sections */}
            {VISION_SECTIONS.map((section, index) => {
              const content = visionData[section.key as keyof VisionData] as string
              if (!content?.trim()) return null

              return (
                <Card key={section.key}>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#199D67] to-[#5EC49A] text-white rounded-full text-sm font-semibold mr-3">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {section.label}
                    </h3>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {content}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
