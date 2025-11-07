'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react'

import { 
  Card, 
  Button, 
  Input, 
  Textarea,
  Badge,
  Spinner
} from '@/lib/design-system/components'

interface IntakeFormData {
  // Personal Info
  full_name: string
  email: string
  age: string
  location: string
  
  // Current State
  current_situation: string
  biggest_challenges: string
  current_goals: string
  
  // Vision & Values
  ideal_life_description: string
  core_values: string
  life_purpose: string
  
  // Specific Areas
  career_professional: string
  relationships_family: string
  health_wellness: string
  personal_growth: string
  finances_wealth: string
  spirituality_meaning: string
  
  // Obstacles & Resources
  main_obstacles: string
  available_resources: string
  support_system: string
  
  // Timeline & Commitment
  desired_timeline: string
  commitment_level: string
  previous_attempts: string
}

export default function IntensiveIntake() {
  const [formData, setFormData] = useState<IntakeFormData>({
    full_name: '',
    email: '',
    age: '',
    location: '',
    current_situation: '',
    biggest_challenges: '',
    current_goals: '',
    ideal_life_description: '',
    core_values: '',
    life_purpose: '',
    career_professional: '',
    relationships_family: '',
    health_wellness: '',
    personal_growth: '',
    finances_wealth: '',
    spirituality_meaning: '',
    main_obstacles: '',
    available_resources: '',
    support_system: '',
    desired_timeline: '',
    commitment_level: '',
    previous_attempts: ''
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  const totalSteps = 6

  useEffect(() => {
    loadIntensiveData()
  }, [])

  useEffect(() => {
    if (intensiveId) {
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [intensiveId])

  const loadIntensiveData = async () => {
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
        router.push('/pricing-hormozi')
        return
      }

      setIntensiveId(intensiveData.id)
      
      // Pre-fill email from user
      setFormData(prev => ({ ...prev, email: user.email || '' }))

    } catch (error) {
      console.error('Error loading intensive data:', error)
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

  const handleInputChange = (field: keyof IntakeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitForm = async () => {
    if (!intensiveId) return

    setLoading(true)
    try {
      // Update intensive checklist
      const { error: checklistError } = await supabase
        .from('intensive_checklist')
        .update({
          intake_completed: true,
          intake_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (checklistError) {
        console.error('Error updating checklist:', checklistError)
        return
      }

      // Store intake data (you might want to create a separate table for this)
      // For now, we'll store it in the user_profiles table or create a new intensive_intake table
      
      // Generate AI vision draft (this would call your AI service)
      await generateVisionDraft()

      // Redirect to builder
      router.push('/intensive/builder')

    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateVisionDraft = async () => {
    // This would integrate with your AI service to generate a vision draft
    // based on the intake form data
    console.log('Generating vision draft based on:', formData)
    
    // For now, we'll just log it - you can integrate with OpenAI/Claude later
    // const visionDraft = await callAIService(formData)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Age
                  </label>
                  <Input
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="e.g., 28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State/Country"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Current Situation</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Describe your current life situation *
                  </label>
                  <Textarea
                    value={formData.current_situation}
                    onChange={(e) => handleInputChange('current_situation', e.target.value)}
                    placeholder="What does your life look like right now? What's working? What isn't?"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What are your biggest challenges? *
                  </label>
                  <Textarea
                    value={formData.biggest_challenges}
                    onChange={(e) => handleInputChange('biggest_challenges', e.target.value)}
                    placeholder="What's holding you back? What obstacles do you face?"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What are your current goals? *
                  </label>
                  <Textarea
                    value={formData.current_goals}
                    onChange={(e) => handleInputChange('current_goals', e.target.value)}
                    placeholder="What are you trying to achieve? What do you want to change?"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Vision & Values</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Describe your ideal life (5-10 years from now) *
                  </label>
                  <Textarea
                    value={formData.ideal_life_description}
                    onChange={(e) => handleInputChange('ideal_life_description', e.target.value)}
                    placeholder="If you could design your perfect life, what would it look like? Be specific about relationships, career, health, lifestyle, etc."
                    rows={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What are your core values? *
                  </label>
                  <Textarea
                    value={formData.core_values}
                    onChange={(e) => handleInputChange('core_values', e.target.value)}
                    placeholder="What matters most to you? What principles guide your decisions?"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What do you believe your life purpose is? *
                  </label>
                  <Textarea
                    value={formData.life_purpose}
                    onChange={(e) => handleInputChange('life_purpose', e.target.value)}
                    placeholder="Why are you here? What impact do you want to make?"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Life Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Career & Professional
                  </label>
                  <Textarea
                    value={formData.career_professional}
                    onChange={(e) => handleInputChange('career_professional', e.target.value)}
                    placeholder="Work, business, professional development..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Relationships & Family
                  </label>
                  <Textarea
                    value={formData.relationships_family}
                    onChange={(e) => handleInputChange('relationships_family', e.target.value)}
                    placeholder="Romance, family, friendships..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Health & Wellness
                  </label>
                  <Textarea
                    value={formData.health_wellness}
                    onChange={(e) => handleInputChange('health_wellness', e.target.value)}
                    placeholder="Physical health, mental health, fitness..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Personal Growth
                  </label>
                  <Textarea
                    value={formData.personal_growth}
                    onChange={(e) => handleInputChange('personal_growth', e.target.value)}
                    placeholder="Learning, skills, self-development..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Finances & Wealth
                  </label>
                  <Textarea
                    value={formData.finances_wealth}
                    onChange={(e) => handleInputChange('finances_wealth', e.target.value)}
                    placeholder="Money, investments, financial freedom..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Spirituality & Meaning
                  </label>
                  <Textarea
                    value={formData.spirituality_meaning}
                    onChange={(e) => handleInputChange('spirituality_meaning', e.target.value)}
                    placeholder="Faith, meditation, life meaning..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Obstacles & Resources</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What are your main obstacles to achieving your vision? *
                  </label>
                  <Textarea
                    value={formData.main_obstacles}
                    onChange={(e) => handleInputChange('main_obstacles', e.target.value)}
                    placeholder="What's standing in your way? Internal and external obstacles..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What resources do you have available? *
                  </label>
                  <Textarea
                    value={formData.available_resources}
                    onChange={(e) => handleInputChange('available_resources', e.target.value)}
                    placeholder="Time, money, skills, connections, tools..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Who is in your support system? *
                  </label>
                  <Textarea
                    value={formData.support_system}
                    onChange={(e) => handleInputChange('support_system', e.target.value)}
                    placeholder="Family, friends, mentors, coaches, community..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Commitment & Timeline</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What's your desired timeline for major changes? *
                  </label>
                  <Textarea
                    value={formData.desired_timeline}
                    onChange={(e) => handleInputChange('desired_timeline', e.target.value)}
                    placeholder="When do you want to see significant progress? 6 months? 1 year? 2 years?"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    How committed are you to making changes? *
                  </label>
                  <Textarea
                    value={formData.commitment_level}
                    onChange={(e) => handleInputChange('commitment_level', e.target.value)}
                    placeholder="Rate 1-10 and explain why. What are you willing to do differently?"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What have you tried before? What worked/didn't work?
                  </label>
                  <Textarea
                    value={formData.previous_attempts}
                    onChange={(e) => handleInputChange('previous_attempts', e.target.value)}
                    placeholder="Previous goal-setting, coaching, programs, self-help attempts..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
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
              Intensive Intake Form
            </h1>
            <p className="text-sm text-neutral-300 text-center px-4">
              Help us understand your current situation and vision so we can create a personalized activation plan.
            </p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block text-center mb-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Intensive Intake Form
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
            Help us understand your current situation and vision so we can create a personalized activation plan.
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

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs md:text-sm text-neutral-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-xs md:text-sm text-neutral-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2 sm:gap-4 order-1 sm:order-2">
          {currentStep < totalSteps ? (
            <Button 
              variant="primary" 
              size="sm"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 sm:flex-none"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="sm"
              onClick={submitForm}
              disabled={loading || !canProceed()}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating Vision...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Intake
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Completion Preview */}
      {currentStep === totalSteps && (
        <Card className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 mt-6 md:mt-8 border-2 border-primary-500 bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
          <div className="text-center">
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary-500 mx-auto mb-3 md:mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Ready to Generate Your Vision!</h2>
            <p className="text-sm md:text-base text-neutral-300">
              Once you submit, our AI will analyze your responses and generate a personalized vision draft. 
              You'll then move to the builder to refine and finalize it.
            </p>
          </div>
        </Card>
      )}
      </div>
  )

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return !!(formData.full_name && formData.email)
      case 2:
        return !!(formData.current_situation && formData.biggest_challenges && formData.current_goals)
      case 3:
        return !!(formData.ideal_life_description && formData.core_values && formData.life_purpose)
      case 4:
        return true // Optional fields
      case 5:
        return !!(formData.main_obstacles && formData.available_resources && formData.support_system)
      case 6:
        return !!(formData.desired_timeline && formData.commitment_level)
      default:
        return false
    }
  }
}
