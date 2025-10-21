'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, CheckCircle, Circle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Card, 
  ProgressBar, 
  Badge, 
  PageLayout, 
  Container,
  Spinner,
  Input
} from '@/lib/design-system/components'

interface VisionData {
  id?: string
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
}

const sections = [
  {
    id: 'forward',
    label: 'Forward',
    description: 'A short opening statement that sets your intention, energy, and focus before describing your vision.',
    icon: '✨'
  },
  {
    id: 'fun',
    label: 'Fun / Recreation',
    description: 'The hobbies, play, and joyful activities that make life light, exciting, and fun.',
    icon: '🎉'
  },
  {
    id: 'travel',
    label: 'Variety / Travel / Adventure',
    description: 'The new places, experiences, and explorations that bring freshness, novelty, and expansion to your life.',
    icon: '✈️'
  },
  {
    id: 'home',
    label: 'Home / Environment',
    description: 'The spaces you live in and the surroundings you create—your sanctuary, comfort, and atmosphere.',
    icon: '🏡'
  },
  {
    id: 'family',
    label: 'Family / Parenting',
    description: 'The connections you build with family—whether through parenting, partnership, or chosen family—and the loving bonds that shape your home life.',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 'romance',
    label: 'Love / Romance / Partner',
    description: 'The love, intimacy, connection, and partnership you cultivate with your spouse or significant other.',
    icon: '💕'
  },
  {
    id: 'health',
    label: 'Health / Body / Vitality',
    description: 'Your physical vitality, well-being, strength, energy, and care for your body.',
    icon: '💪'
  },
  {
    id: 'money',
    label: 'Money / Wealth / Investments',
    description: 'The financial flow, income, security, and investments that support your freedom and abundance.',
    icon: '💰'
  },
  {
    id: 'business',
    label: 'Business / Career / Work',
    description: 'Your professional mission, contribution, creativity, and the work you choose to bring into the world.',
    icon: '💼'
  },
  {
    id: 'social',
    label: 'Social / Friends',
    description: 'The friendships, community, and social connections that bring joy, belonging, and support.',
    icon: '🤝'
  },
  {
    id: 'possessions',
    label: 'Things / Belongings / Stuff',
    description: 'The material items, personal belongings, and physical things you enjoy having in your life.',
    icon: '🎁'
  },
  {
    id: 'giving',
    label: 'Giving / Contribution / Legacy',
    description: 'The ways you give back, serve, and create a lasting impact beyond yourself.',
    icon: '🌟'
  },
  {
    id: 'spirituality',
    label: 'Expansion / Spirituality',
    description: 'Your connection to Source, spiritual practices, and the growth of your consciousness and soul.',
    icon: '🙏'
  },
  {
    id: 'conclusion',
    label: 'Conclusion',
    description: 'A closing statement that brings your vision together—your final affirmation and energetic seal.',
    icon: '🎯'
  }
]

export default function NewLifeVisionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeSection, setActiveSection] = useState(0)
  const [saveStatus, setSaveStatus] = useState('idle') // idle, saving, saved, error
  const [loading, setLoading] = useState(false)
  const [visionData, setVisionData] = useState<VisionData>({
    forward: '',
    fun: '',
    travel: '',
    home: '',
    family: '',
    romance: '',
    health: '',
    money: '',
    business: '',
    social: '',
    possessions: '',
    giving: '',
    spirituality: '',
    conclusion: ''
  })

  // Calculate progress
  const progress = Object.values(visionData).filter(val => val.trim()).length
  const totalFields = Object.keys(visionData).length
  const progressPercent = Math.round((progress / totalFields) * 100)

  // Load last vision data on mount
  useEffect(() => {
    const loadLastVision = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get the most recent vision (draft or completed) for this user
        const { data: lastVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (lastVision) {
          setVisionData({
            id: lastVision.id,
            // No title field needed
            forward: lastVision.forward || '',
            fun: lastVision.fun || '',
            travel: lastVision.travel || '',
            home: lastVision.home || '',
            family: lastVision.family || '',
            romance: lastVision.romance || '',
            health: lastVision.health || '',
            money: lastVision.money || '',
            business: lastVision.business || '',
            social: lastVision.social || '',
            possessions: lastVision.possessions || '',
            giving: lastVision.giving || '',
            spirituality: lastVision.spirituality || '',
            conclusion: lastVision.conclusion || ''
          })
        }
      } catch (error) {
        console.log('No previous vision found or error loading:', error)
      }
    }

    loadLastVision()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSection = sections[activeSection]
      if (currentSection && visionData[currentSection.id as keyof VisionData]?.trim()) {
        handleAutoSave()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [visionData, activeSection])

  const handleAutoSave = async () => {
    if (saveStatus === 'saving') return
    
    setSaveStatus('saving')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if we already have a vision for this user with version 1
      let existingVisionId = visionData.id
      
      if (!existingVisionId) {
        const { data: existingVision } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('user_id', user.id)
          .eq('version_number', 1)
          .single()
        
        existingVisionId = existingVision?.id
      }

      const upsertData = {
        ...(existingVisionId && { id: existingVisionId }),
        user_id: user.id,
        ...visionData,
        // No title field needed
        version_number: 1,
        updated_at: new Date().toISOString()
      }

      console.log('Auto-save data:', upsertData)

      const { error, data: savedData } = await supabase
        .from('vision_versions')
        .upsert(upsertData)
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Update vision data with the saved ID if we got one
      if (savedData && savedData[0] && !visionData.id) {
        setVisionData(prev => ({ ...prev, id: savedData[0].id }))
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Auto-save error:', error instanceof Error ? error.message : JSON.stringify(error))
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleChange = (field: keyof VisionData, value: string) => {
    setVisionData(prev => ({ ...prev, [field]: value }))
    setSaveStatus('idle')
  }

  const handleNext = () => {
    if (activeSection < sections.length - 1) {
      setActiveSection(activeSection + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSectionClick = (index: number) => {
    setActiveSection(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveVision = async (data: VisionData, isComplete: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to save your vision')
        return
      }

      // Check if we already have a vision for this user with version 1
      let existingVisionId = data.id
      
      if (!existingVisionId) {
        const { data: existingVision } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('user_id', user.id)
          .eq('version_number', 1)
          .single()
        
        existingVisionId = existingVision?.id
      }

      const upsertData = {
        ...(existingVisionId && { id: existingVisionId }),
        user_id: user.id,
        ...data,
        // No title field needed
        version_number: 1,
        status: isComplete ? 'complete' : 'draft',
        completion_percent: isComplete ? 100 : progressPercent,
        updated_at: new Date().toISOString()
      }

      console.log('Save vision data:', upsertData)

      const { error, data: savedData } = await supabase
        .from('vision_versions')
        .upsert(upsertData)
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Update vision data with the saved ID if we got one
      if (savedData && savedData[0] && !data.id) {
        setVisionData(prev => ({ ...prev, id: savedData[0].id }))
      }
    } catch (error) {
      console.error('Error saving vision:', error instanceof Error ? error.message : JSON.stringify(error))
      throw error
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setSaveStatus('saving')
    try {
      await saveVision(visionData, true)
      setSaveStatus('saved')
      alert('✨ Your Life Vision has been saved! You can now generate your audio track or edit anytime.')
      router.push('/life-vision')
    } catch (error) {
      console.error('Error submitting vision:', error instanceof Error ? error.message : JSON.stringify(error))
      alert('Failed to save your vision. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentSection = sections[activeSection]
  
  if (!currentSection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-black text-white">
        {/* AI Option Banner */}
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#14B8A6] py-4 px-6 text-center">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-white font-semibold text-lg flex items-center gap-2">
                <span className="text-2xl">✨</span>
                New: AI-Guided Vision Creation
              </p>
              <p className="text-white/90 text-sm">
                Let our AI guide you through a soul-level conversation to create your vision
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/life-vision/create-with-viva')}
              className="bg-white text-[#8B5CF6] hover:bg-white/90 font-semibold whitespace-nowrap"
            >
              Start with Viva →
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-[#199D67] py-8 px-6 text-center mb-8 hover:opacity-90 transition-all duration-300">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-lg">
              The Life I Choose
            </h1>
            
            <p className="text-white/95 text-xl mb-6 font-light">
              Create your Active Vision across 14 life categories
            </p>
            
            {/* Progress Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex justify-between mb-3 text-sm font-medium">
                <span className="text-white/90">{progress} of {totalFields} sections completed</span>
                <span className="text-white/90">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-[#5EC49A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/20 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/80">
                {progressPercent === 100 ? '🎉 Vision Complete!' : 'Keep going! You\'re doing great!'}
              </div>
            </div>
          </div>
        </div>

      <div className="flex max-w-7xl mx-auto -mt-8">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-80 bg-[#1F1F1F] p-6 sticky top-0 h-screen overflow-y-auto border-r border-[#404040]">
          <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4 uppercase tracking-wide">
            Life Categories
          </h3>
          <div className="space-y-1">
            {sections.map((section, index) => {
              const isCompleted = (visionData[section.id as keyof VisionData]?.trim().length || 0) > 0
              const isActive = index === activeSection
              
              return (
                <Card
                  key={section.id}
                  variant={isActive ? "default" : "outlined"}
                  className={`
                    w-full p-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5
                    ${isActive 
                      ? 'bg-[#199D67]/20 border-l-4 border-[#199D67] text-[#199D67] font-semibold' 
                      : 'hover:bg-[#1F1F1F]/50 text-[#e5e7eb]'
                    }
                  `}
                  onClick={() => handleSectionClick(index)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="flex-1 text-sm">{section.label}</span>
                    {isCompleted && <CheckCircle size={16} className="text-[#199D67]" />}
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
                <span className="text-5xl">{currentSection.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {currentSection.label}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm">
                    Section {activeSection + 1} of {sections.length}
                  </p>
                </div>
              </div>
              
              {/* Auto-save Status */}
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                {saveStatus === 'saving' && (
                  <>
                    <Spinner variant="secondary" size="sm" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle size={16} className="text-[#199D67]" />
                    <span className="text-[#199D67]">Saved</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <>
                    <Save size={16} />
                    <span>Auto-save enabled</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <Circle size={16} className="text-[#D03739]" />
                    <span className="text-[#D03739]">Save failed</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[#cbd5e1] text-lg leading-relaxed">
              {currentSection.description}
            </p>
          </div>

          {/* Text Area */}
          <div className="mb-8">
            <textarea
              value={visionData[currentSection.id as keyof VisionData]}
              onChange={(e) => handleChange(currentSection.id as keyof VisionData, e.target.value)}
              placeholder={`Describe your vision for ${currentSection.label.toLowerCase()}...`}
              className="
                w-full min-h-80 p-6 
                bg-[#1F1F1F] border-2 border-[#404040] 
                rounded-xl text-white text-lg leading-relaxed 
                resize-y outline-none transition-colors duration-200
                focus:border-[#199D67]
                placeholder:text-[#666666]
              "
            />
            <div className="mt-3 flex justify-between text-sm text-[#9CA3AF]">
              <span>{visionData[currentSection.id as keyof VisionData]?.length || 0} characters</span>
              <span>Write as much or as little as feels right</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={activeSection === 0}
              className="px-8 py-4"
            >
              ← Previous
            </Button>

            {activeSection < sections.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                className="px-8 py-4"
              >
                Next Section →
              </Button>
            ) : (
              <Button
                variant="accent"
                onClick={handleSubmit}
                disabled={loading}
                className="px-12 py-4 flex items-center gap-3"
              >
                <CheckCircle size={24} />
                Complete Vision
              </Button>
            )}
          </div>

          {/* Tips Box */}
          <Card className="mt-12 p-6 bg-[#14B8A6]/10 border-l-4 border-[#14B8A6]">
            <h4 className="text-lg font-semibold mb-3 text-[#14B8A6]">
              💡 Tips for this section:
            </h4>
            <ul className="text-[#cbd5e1] leading-relaxed space-y-1 pl-5">
              <li>• Write in present tense, as if it's already happening</li>
              <li>• Be specific - engage your senses and emotions</li>
              <li>• Focus on how you FEEL, not just what you have</li>
              <li>• There are no wrong answers - this is YOUR vision</li>
            </ul>
          </Card>

          {/* Mobile Navigation */}
          <div className="lg:hidden mt-8">
            <Link 
              href="/life-vision" 
              className="text-[#9CA3AF] hover:text-white transition-colors text-center block"
            >
              ← Back to All Life Visions
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
          variant="primary"
          onClick={() => {
            // Simple mobile navigation - could be enhanced with a modal
            const nextSection = activeSection < sections.length - 1 ? activeSection + 1 : 0
            setActiveSection(nextSection)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="w-16 h-16 rounded-full text-xl font-bold"
        >
          {activeSection < sections.length - 1 ? '→' : '✓'}
        </Button>
      </div>
    </div>
    </PageLayout>
  )
}