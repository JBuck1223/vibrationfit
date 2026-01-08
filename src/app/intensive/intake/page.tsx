'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { 
  Card, 
  Button, 
  Textarea,
  Spinner,
  Container,
  Stack,
  PageHero,
  Checkbox,
  RadioGroup
} from '@/lib/design-system/components'

interface IntakeFormData {
  vision_clarity: number | null
  vibrational_harmony: number | null
  roadmap_clarity: number | null
  vision_iteration_ease: number | null
  audio_iteration_ease: number | null
  transformation_tracking: number | null
  vibrational_constraints_clarity: number | null
  has_audio_tracks: 'no' | 'yes_rarely' | 'yes_often' | null
  vision_board_management: number | null
  journey_capturing: number | null
  previous_attempts: string
  testimonial_consent: boolean
}

export default function IntensiveIntake() {
  const [formData, setFormData] = useState<IntakeFormData>({
    vision_clarity: null,
    vibrational_harmony: null,
    roadmap_clarity: null,
    vision_iteration_ease: null,
    audio_iteration_ease: null,
    transformation_tracking: null,
    vibrational_constraints_clarity: null,
    has_audio_tracks: null,
    vision_board_management: null,
    journey_capturing: null,
    previous_attempts: '',
    testimonial_consent: true
  })

  const [loading, setLoading] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadIntensiveData()
  }, [])

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
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

    } catch (error) {
      console.error('Error loading intensive data:', error)
    }
  }

  const updateFormData = <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const submitForm = async () => {
    if (!intensiveId) return

    // Validate all required fields
    const hasAllRatings = formData.vision_clarity !== null &&
      formData.vibrational_harmony !== null &&
      formData.roadmap_clarity !== null &&
      formData.vision_iteration_ease !== null &&
      formData.audio_iteration_ease !== null &&
      formData.transformation_tracking !== null &&
      formData.vibrational_constraints_clarity !== null &&
      formData.vision_board_management !== null &&
      formData.journey_capturing !== null &&
      formData.has_audio_tracks !== null

    if (!hasAllRatings) {
      alert('Please answer all rating questions')
      return
    }

    setLoading(true)
    try {
      // Store intake data
      const { error: intakeError } = await supabase
        .from('intensive_intake_responses')
        .insert({
          intensive_id: intensiveId,
          vision_clarity: formData.vision_clarity,
          vibrational_harmony: formData.vibrational_harmony,
          roadmap_clarity: formData.roadmap_clarity,
          vision_iteration_ease: formData.vision_iteration_ease,
          audio_iteration_ease: formData.audio_iteration_ease,
          transformation_tracking: formData.transformation_tracking,
          vibrational_constraints_clarity: formData.vibrational_constraints_clarity,
          has_audio_tracks: formData.has_audio_tracks,
          vision_board_management: formData.vision_board_management,
          journey_capturing: formData.journey_capturing,
          previous_attempts: formData.previous_attempts,
          testimonial_consent: formData.testimonial_consent
        })

      if (intakeError) {
        console.error('Error storing intake:', intakeError)
        alert('Error submitting form. Please try again.')
        return
      }

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
      }

      // Redirect to next step
      router.push('/intensive/dashboard')

    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const RatingSelector = ({ 
    value, 
    onChange, 
    label,
    questionNumber,
    helperText
  }: { 
    value: number | null
    onChange: (value: number) => void
    label: string
    questionNumber: number
    helperText?: string
  }) => (
    <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
          {questionNumber}
        </div>
        <label className="block text-sm md:text-base font-medium text-white pt-0.5">
          {label}
        </label>
      </div>
      {helperText && (
        <p className="text-xs md:text-sm text-neutral-500 mb-4 ml-10 italic">
          {helperText}
        </p>
      )}
      <div className="flex flex-wrap gap-2 ml-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`
              w-10 h-10 rounded border-2 font-semibold transition-colors duration-150 text-sm
              ${value === num 
                ? 'bg-primary-500 border-primary-500 text-black' 
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
              }
            `}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )

  if (!intensiveId) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ACTIVATION INTENSIVE"
          title="Baseline Intake"
          subtitle="Help us understand where you are today so we can measure your transformation"
        />

        <div className="space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
            {/* Rating Questions 1-7 */}
            <RatingSelector
              questionNumber={1}
              label="How clear is your vision for your life right now?"
              value={formData.vision_clarity}
              onChange={(v) => updateFormData('vision_clarity', v)}
            />

            <RatingSelector
              questionNumber={2}
              label='How often do you feel "in vibrational harmony" with that vision?'
              value={formData.vibrational_harmony}
              onChange={(v) => updateFormData('vibrational_harmony', v)}
            />

            <RatingSelector
              questionNumber={3}
              label="How clear is your current roadmap for how to activate your life vision in your day‑to‑day reality?"
              value={formData.roadmap_clarity}
              onChange={(v) => updateFormData('roadmap_clarity', v)}
            />

            <RatingSelector
              questionNumber={4}
              label="How easy is it for you to create new iterations of your life vision?"
              value={formData.vision_iteration_ease}
              onChange={(v) => updateFormData('vision_iteration_ease', v)}
            />

            <RatingSelector
              questionNumber={5}
              label="How easy is it for you to create new iterations of your life vision audios?"
              value={formData.audio_iteration_ease}
              onChange={(v) => updateFormData('audio_iteration_ease', v)}
            />

            <RatingSelector
              questionNumber={6}
              label="How well are you set up to track major life transformations over time?"
              value={formData.transformation_tracking}
              onChange={(v) => updateFormData('transformation_tracking', v)}
            />

            <RatingSelector
              questionNumber={7}
              label="How clear are you on your vibrational constraints?"
              value={formData.vibrational_constraints_clarity}
              onChange={(v) => updateFormData('vibrational_constraints_clarity', v)}
              helperText="(If you don't know what this means, put 1.)"
            />

            {/* Multiple Choice Question 8 */}
            <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                  8
                </div>
                <label className="block text-sm md:text-base font-medium text-white pt-0.5">
                  Do you currently have audio tracks of your life vision?
                </label>
              </div>
              <div className="ml-10">
                <RadioGroup
                  name="has_audio_tracks"
                  value={formData.has_audio_tracks || ''}
                  onChange={(value) => updateFormData('has_audio_tracks', value as 'no' | 'yes_rarely' | 'yes_often')}
                  options={[
                    { value: 'no', label: 'No' },
                    { value: 'yes_rarely', label: 'Yes, but I rarely listen' },
                    { value: 'yes_often', label: 'Yes, and I listen often' }
                  ]}
                  orientation="vertical"
                />
              </div>
            </div>

            {/* Rating Questions 9-10 */}
            <RatingSelector
              questionNumber={9}
              label="How easy is it for you to manage the items on your vision board?"
              value={formData.vision_board_management}
              onChange={(v) => updateFormData('vision_board_management', v)}
              helperText="(Put 1 if you don't have one.)"
            />

            <RatingSelector
              questionNumber={10}
              label="How well are you capturing your conscious creation journey (thoughts, synchronicities, patterns) over time?"
              value={formData.journey_capturing}
              onChange={(v) => updateFormData('journey_capturing', v)}
            />

            {/* Open Text Question 11 */}
            <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                  11
                </div>
                <label className="block text-sm md:text-base font-medium text-white pt-0.5">
                  What have you already tried to consciously create your dream life?
                </label>
              </div>
              <div className="ml-10">
                <Textarea
                  value={formData.previous_attempts}
                  onChange={(e) => updateFormData('previous_attempts', e.target.value)}
                  placeholder="Share your experience with manifestation, vision boards, goal-setting, coaches, programs, etc."
                  rows={4}
                  className="text-sm md:text-base"
                />
              </div>
            </div>

            {/* Consent Checkbox 12 */}
            <div className="border border-neutral-800 rounded-lg p-4 md:p-6 bg-neutral-900/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center font-semibold text-sm">
                  12
                </div>
                <div className="pt-0.5">
                  <Checkbox
                    checked={formData.testimonial_consent}
                    onChange={(e) => updateFormData('testimonial_consent', e.target.checked)}
                    label="I'm open to you using my feedback and results as anonymized data or named testimonials once I approve them."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Intake
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Stack>
    </Container>
  )
}
