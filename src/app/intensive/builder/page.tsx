'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Sparkles, Wand2, Save, Eye, Clock } from 'lucide-react'

import { 
   
  Card, 
  Button, 
  Textarea,
  Badge,
  Spinner
} from '@/lib/design-system/components'

interface VisionDraft {
  id: string
  content: string
  generated_at: string
  status: 'draft' | 'in_progress' | 'finalized'
}

interface BuilderState {
  currentSection: number
  sections: {
    personal_growth: string
    career_professional: string
    relationships_family: string
    health_wellness: string
    finances_wealth: string
    spirituality_meaning: string
    lifestyle_daily: string
  }
}

export default function IntensiveBuilder() {
  const [visionDraft, setVisionDraft] = useState<VisionDraft | null>(null)
  const [builderState, setBuilderState] = useState<BuilderState>({
    currentSection: 0,
    sections: {
      personal_growth: '',
      career_professional: '',
      relationships_family: '',
      health_wellness: '',
      finances_wealth: '',
      spirituality_meaning: '',
      lifestyle_daily: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  const sections = [
    { key: 'personal_growth', title: 'Personal Growth', description: 'Learning, skills, self-development' },
    { key: 'career_professional', title: 'Career & Professional', description: 'Work, business, professional development' },
    { key: 'relationships_family', title: 'Relationships & Family', description: 'Romance, family, friendships' },
    { key: 'health_wellness', title: 'Health & Wellness', description: 'Physical health, mental health, fitness' },
    { key: 'finances_wealth', title: 'Finances & Wealth', description: 'Money, investments, financial freedom' },
    { key: 'spirituality_meaning', title: 'Spirituality & Meaning', description: 'Faith, meditation, life meaning' },
    { key: 'lifestyle_daily', title: 'Lifestyle & Daily Life', description: 'Daily routines, environment, habits' }
  ]

  useEffect(() => {
    loadBuilderData()
  }, [])

  useEffect(() => {
    if (intensiveId) {
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [intensiveId])

  const loadBuilderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get intensive purchase
      const { data: intensiveData, error } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (error || !intensiveData) {
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

      // Check if intake is completed
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('intake_completed')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (!checklistData?.intake_completed) {
        router.push('/intensive/intake')
        return
      }

      // Load or generate vision draft
      await loadOrGenerateVisionDraft(intensiveData.id)

    } catch (error) {
      console.error('Error loading builder data:', error)
    }
  }

  const loadOrGenerateVisionDraft = async (intensiveId: string) => {
    // Check if vision already drafted
    const { data: checklistData } = await supabase
      .from('intensive_checklist')
      .select('vision_drafted')
      .eq('intensive_id', intensiveId)
      .single()

    if (checklistData?.vision_drafted) {
      // Load existing vision from life_visions table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: visionData } = await supabase
          .from('life_visions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (visionData) {
          setVisionDraft({
            id: visionData.id,
            content: visionData.vision_content || '',
            generated_at: visionData.created_at,
            status: 'in_progress'
          })
        }
      }
    } else {
      // Generate new vision draft
      await generateVisionDraft(intensiveId)
    }
  }

  const generateVisionDraft = async (intensiveId: string) => {
    setGenerating(true)
    try {
      // Get intake data (you might want to store this in a separate table)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // For now, we'll create a basic vision structure
      // In a real implementation, this would call your AI service with the intake data
      const visionContent = `# My Vision for an Extraordinary Life

## Personal Growth
I am continuously expanding my knowledge, skills, and self-awareness. I invest time daily in learning, reading, and personal development. I have mentors and coaches who guide my growth, and I'm always pushing myself outside my comfort zone to become the best version of myself.

## Career & Professional
I am thriving in my chosen field, making a meaningful impact while building financial security. My work aligns with my values and allows me to express my unique talents. I have built a reputation for excellence and am recognized as a leader in my industry.

## Relationships & Family
I am surrounded by loving, supportive relationships. My family connections are strong and healthy. I have deep, meaningful friendships and a romantic partnership that brings joy and growth. I am a positive influence on those around me.

## Health & Wellness
I prioritize my physical and mental health. I maintain a strong, energetic body through regular exercise and proper nutrition. I manage stress effectively and have developed mindfulness practices that keep me centered and resilient.

## Finances & Wealth
I have achieved financial freedom and security. I make money through multiple streams of income that align with my values. I am generous with my resources and use wealth as a tool to create positive impact in the world.

## Spirituality & Meaning
I have a deep sense of purpose and connection to something greater than myself. My spiritual practice grounds me and provides guidance for my decisions. I live with integrity and make choices that align with my highest values.

## Lifestyle & Daily Life
My daily routines support my vision and values. I wake up with purpose and energy, and my environment reflects the life I want to live. I have time for what matters most and am constantly optimizing my lifestyle for fulfillment and joy.`

      // Create vision in database
      const { data: visionData, error: visionError } = await supabase
        .from('life_visions')
        .insert({
          user_id: user.id,
          vision_content: visionContent,
          status: 'draft'
        })
        .select()
        .single()

      if (visionError) {
        console.error('Error creating vision:', visionError)
        return
      }

      setVisionDraft({
        id: visionData.id,
        content: visionContent,
        generated_at: visionData.created_at,
        status: 'draft'
      })

      // Update checklist
      await supabase
        .from('intensive_checklist')
        .update({
          vision_drafted: true,
          vision_drafted_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

    } catch (error) {
      console.error('Error generating vision draft:', error)
    } finally {
      setGenerating(false)
    }
  }

  const updateTimeRemaining = async () => {
    if (!intensiveId) return

    try {
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('activation_deadline')
        .eq('id', intensiveId)
        .single()

      if (intensiveData?.activation_deadline) {
        const deadline = new Date(intensiveData.activation_deadline)
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeRemaining('Time\'s up!')
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    } catch (error) {
      console.error('Error updating time:', error)
    }
  }

  const updateVisionSection = (sectionKey: string, content: string) => {
    if (!visionDraft) return

    const updatedContent = visionDraft.content.replace(
      new RegExp(`## ${sections.find(s => s.key === sectionKey)?.title}[\\s\\S]*?(?=##|$)`),
      `## ${sections.find(s => s.key === sectionKey)?.title}\n${content}\n\n`
    )

    setVisionDraft(prev => prev ? { ...prev, content: updatedContent } : null)
  }

  const saveVision = async () => {
    if (!visionDraft) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('life_visions')
        .update({
          vision_content: visionDraft.content,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', visionDraft.id)

      if (error) {
        console.error('Error saving vision:', error)
        return
      }

      // Update checklist
      await supabase
        .from('intensive_checklist')
        .update({
          builder_completed: true,
          builder_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId!)

    } catch (error) {
      console.error('Error saving vision:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeBuilder = async () => {
    await saveVision()
    router.push('/intensive/calibration')
  }

  const getCurrentSectionContent = () => {
    if (!visionDraft) return ''
    
    const currentSection = sections[builderState.currentSection]
    const sectionTitle = currentSection.title
    
    const regex = new RegExp(`## ${sectionTitle}[\\s\\S]*?(?=##|$)`)
    const match = visionDraft.content.match(regex)
    
    if (match) {
      return match[0].replace(`## ${sectionTitle}\n`, '').trim()
    }
    
    return ''
  }

  const updateCurrentSection = (content: string) => {
    const currentSection = sections[builderState.currentSection]
    updateVisionSection(currentSection.key, content)
  }

  const nextSection = () => {
    if (builderState.currentSection < sections.length - 1) {
      setBuilderState(prev => ({
        ...prev,
        currentSection: prev.currentSection + 1
      }))
    }
  }

  const prevSection = () => {
    if (builderState.currentSection > 0) {
      setBuilderState(prev => ({
        ...prev,
        currentSection: prev.currentSection - 1
      }))
    }
  }

  if (generating) {
    return (
      <>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Generating Your Vision</h1>
          <p className="text-sm md:text-base text-neutral-400">
            Our AI is analyzing your intake responses and creating a personalized vision draft...
          </p>
        </div>
      </>
    )
  }

  if (!visionDraft) {
    return (
      <>
        <Card className="max-w-2xl mx-auto p-4 md:p-6 lg:p-12 text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4">No Vision Found</h1>
          <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
            We couldn't find your vision draft. Please try again.
          </p>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => router.push('/intensive/intake')}
          >
            Back to Intake
          </Button>
        </Card>
      </>
    )
  }

  const currentSection = sections[builderState.currentSection]
  const currentContent = getCurrentSectionContent()

  return (
    <>
      {/* Header */}
      <div className="mb-6 md:mb-12">
        {/* Mobile Header */}
        <div className="md:hidden space-y-4 mb-4">
          <div className="flex flex-col items-center gap-3">
            {timeRemaining && (
              <Badge variant="warning">
                <Clock className="w-4 h-4 mr-2" />
                {timeRemaining} remaining
              </Badge>
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Vision Builder
            </h1>
            <p className="text-sm text-neutral-300 text-center px-4">
              Refine and personalize your AI-generated vision. Make it uniquely yours.
            </p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block text-center mb-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Vision Builder
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
            Refine and personalize your AI-generated vision. Make it uniquely yours.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/intensive/dashboard')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          {timeRemaining && (
            <Badge variant="warning" className="w-full sm:w-auto justify-center sm:justify-start">
              <Clock className="w-4 h-4 mr-2" />
              {timeRemaining} remaining
            </Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs md:text-sm text-neutral-400">
            Section {builderState.currentSection + 1} of {sections.length}
          </span>
          <span className="text-xs md:text-sm text-neutral-400">
            {Math.round(((builderState.currentSection + 1) / sections.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((builderState.currentSection + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Section */}
      <Card className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
            {currentSection.title}
          </h2>
          <p className="text-sm md:text-base text-neutral-400">
            {currentSection.description}
          </p>
        </div>

        <Textarea
          value={currentContent}
          onChange={(e) => updateCurrentSection(e.target.value)}
          placeholder={`Describe your vision for ${currentSection.title.toLowerCase()}...`}
          rows={12}
          className="mb-4 md:mb-6"
        />

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={prevSection}
            disabled={builderState.currentSection === 0}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 order-1 sm:order-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={saveVision}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>

            {builderState.currentSection < sections.length - 1 ? (
              <Button 
                variant="primary" 
                size="sm"
                onClick={nextSection}
                className="flex-1 sm:flex-none"
              >
                Next Section
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                onClick={completeBuilder}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Complete Vision
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Section Overview */}
      <Card className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Vision Sections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sections.map((section, index) => (
            <div
              key={section.key}
              className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                index === builderState.currentSection
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
              onClick={() => setBuilderState(prev => ({ ...prev, currentSection: index }))}
            >
              <h4 className="text-sm md:text-base font-semibold text-white mb-1">{section.title}</h4>
              <p className="text-xs md:text-sm text-neutral-400">{section.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview */}
      <Card className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mt-6 md:mt-8 border-2 border-secondary-500 bg-gradient-to-br from-secondary-500/10 to-primary-500/10">
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <Eye className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
          <h3 className="text-lg md:text-xl font-bold text-white">Vision Preview</h3>
        </div>
        <div className="bg-neutral-900 rounded-xl p-4 md:p-6 max-h-96 overflow-y-auto">
          <pre className="text-xs md:text-sm text-neutral-300 whitespace-pre-wrap">
            {visionDraft.content}
          </pre>
        </div>
      </Card>
    </>
  )
}
