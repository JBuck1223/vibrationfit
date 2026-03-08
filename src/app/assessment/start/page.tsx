'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  Input,
  PageHero,
  ProgressBar,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import {
  ArrowRight,
  ArrowLeft,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { assessmentQuestions, filterQuestionsByProfile, categoryMetadata } from '@/lib/assessment/questions'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { AssessmentCategory } from '@/types/assessment'
import {
  calculateResults,
  getGreenLineColor,
  getGreenLineLabel,
  type AssessmentResults,
  type GreenLineResult,
} from '@/lib/assessment/scoring'
import { useTracking } from '@/components/TrackingProvider'
import { trackConversion } from '@/lib/tracking/pixels'

type Step = 'welcome' | 'email' | 'profile' | 'assessment' | 'results'

interface ProfileAnswers {
  relationship_status: string
  has_children: boolean | null
  employment_type: string
}

const STORAGE_KEY = 'vf-public-assessment'

function loadSavedState(): { leadId?: string; assessmentId?: string; step?: Step; profile?: ProfileAnswers; responses?: Record<string, { value: number; category: string; text: string; emoji: string; greenLine: string }> } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.expiresAt && Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveState(data: Record<string, any>) {
  if (typeof window === 'undefined') return
  try {
    const existing = loadSavedState() || {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...existing,
      ...data,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }))
  } catch { /* storage full or unavailable */ }
}

export default function PublicAssessmentPage() {
  const { visitorId, sessionId } = useTracking()

  const [step, setStep] = useState<Step>('welcome')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)

  // Email capture
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Profile
  const [profile, setProfile] = useState<ProfileAnswers>({
    relationship_status: '',
    has_children: null,
    employment_type: '',
  })

  // Assessment
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, { value: number; category: string; text: string; emoji: string; greenLine: string }>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  // Results
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  // Resuming
  const [isResuming, setIsResuming] = useState(true)

  const assessmentCategoriesOrder = VISION_CATEGORIES
    .filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')
    .map(cat => cat.key) as AssessmentCategory[]

  const orderedAssessmentQuestions = assessmentCategoriesOrder
    .map(key => assessmentQuestions.find(cat => cat.category === key))
    .filter(Boolean) as typeof assessmentQuestions

  const getFilteredQuestions = useCallback((catIndex: number) => {
    const cat = orderedAssessmentQuestions[catIndex]
    if (!cat) return []
    if (profile.relationship_status || profile.has_children !== null || profile.employment_type) {
      return filterQuestionsByProfile(cat.questions, profile)
    }
    return cat.questions
  }, [orderedAssessmentQuestions, profile])

  const allFilteredQuestions = orderedAssessmentQuestions.flatMap((cat, idx) => {
    return getFilteredQuestions(idx).map(q => ({ ...q, catIndex: idx }))
  })

  const totalQuestions = allFilteredQuestions.length
  const answeredCount = responses.size

  const currentCategory = orderedAssessmentQuestions[currentCategoryIndex]
  const filteredQuestions = getFilteredQuestions(currentCategoryIndex)
  const currentQuestion = filteredQuestions[currentQuestionIndex]

  let currentQuestionNumber = 0
  for (let i = 0; i < currentCategoryIndex; i++) {
    currentQuestionNumber += getFilteredQuestions(i).length
  }
  currentQuestionNumber += currentQuestionIndex + 1

  // Resume from saved state
  useEffect(() => {
    const saved = loadSavedState()
    if (saved) {
      if (saved.leadId) setLeadId(saved.leadId)
      if (saved.assessmentId) setAssessmentId(saved.assessmentId)
      if (saved.profile) setProfile(saved.profile)
      if (saved.responses) {
        setResponses(new Map(Object.entries(saved.responses)))
      }
      if (saved.step && saved.step !== 'welcome' && saved.leadId) {
        setStep(saved.step)
      }
    }
    setIsResuming(false)
  }, [])

  // Fetch existing progress from server on resume
  useEffect(() => {
    if (!assessmentId || isResuming) return
    if (step !== 'assessment' && step !== 'results') return

    async function fetchProgress() {
      try {
        const res = await fetch(`/api/assessment/public/${assessmentId}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.assessment?.status === 'completed') {
          const serverResults = buildResultsFromAssessment(data.assessment)
          setResults(serverResults)
          setStep('results')
          return
        }

        if (data.responses?.length) {
          const newResponses = new Map(responses)
          for (const r of data.responses) {
            if (!newResponses.has(r.question_id)) {
              newResponses.set(r.question_id, {
                value: r.response_value,
                category: r.category,
                text: r.response_text,
                emoji: r.response_emoji || '',
                greenLine: r.green_line,
              })
            }
          }
          setResponses(newResponses)
        }
      } catch (err) {
        console.error('Error fetching assessment progress:', err)
      }
    }

    fetchProgress()
  }, [assessmentId, isResuming])

  function buildResultsFromAssessment(assessment: any): AssessmentResults {
    const categoryScores = assessment.category_scores || {}
    const greenLineStatus = assessment.green_line_status || {}

    const categories = assessmentCategoriesOrder.map(cat => ({
      category: cat,
      score: categoryScores[cat] || 0,
      maxScore: 35,
      percentage: categoryScores[cat] ? Math.round((categoryScores[cat] / 35) * 100) : 0,
      greenLine: (greenLineStatus[cat] || 'below') as GreenLineResult,
    }))

    return {
      categories,
      totalScore: assessment.total_score || 0,
      maxPossibleScore: assessment.max_possible_score || 420,
      overallPercentage: assessment.overall_percentage || 0,
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setEmailError(null)

    try {
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assessment',
          first_name: firstName,
          last_name: lastName,
          email,
          source: 'public_assessment',
          landing_page: '/assessment/start',
          visitor_id: visitorId || undefined,
          session_id: sessionId || undefined,
        }),
      })

      if (!leadRes.ok) {
        const err = await leadRes.json().catch(() => ({ error: 'Failed to save' }))
        throw new Error(err.error || 'Failed to save your information')
      }

      const leadData = await leadRes.json()
      const newLeadId = leadData.lead?.id

      if (!newLeadId) throw new Error('No lead ID returned')

      setLeadId(newLeadId)
      trackConversion('lead', { content_name: 'public_assessment', event_id: newLeadId })
      saveState({ leadId: newLeadId, step: 'profile' })
      setStep('profile')
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleProfileComplete() {
    if (!leadId || !email) return

    try {
      const res = await fetch('/api/assessment/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          email,
          profile,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        throw new Error(err.error || 'Failed to create assessment')
      }

      const data = await res.json()
      const newAssessmentId = data.assessment?.id
      if (!newAssessmentId) throw new Error('No assessment ID returned')

      setAssessmentId(newAssessmentId)
      saveState({ assessmentId: newAssessmentId, profile, step: 'assessment' })
      setStep('assessment')
    } catch (err) {
      console.error('Error creating assessment:', err)
    }
  }

  async function handleSelectOption(questionId: string, option: { text: string; value: number; emoji: string; greenLine: string }, category: string, questionText: string) {
    const newResponses = new Map(responses)
    newResponses.set(questionId, {
      value: option.value,
      category,
      text: option.text,
      emoji: option.emoji,
      greenLine: option.greenLine,
    })
    setResponses(newResponses)

    const serialized = Object.fromEntries(newResponses)
    saveState({ responses: serialized })

    if (assessmentId) {
      setIsSaving(true)
      try {
        await fetch('/api/assessment/public/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessment_id: assessmentId,
            question_id: questionId,
            question_text: questionText,
            category,
            response_value: option.value,
            response_text: option.text,
            response_emoji: option.emoji,
            green_line: option.greenLine,
          }),
        })
      } catch (err) {
        console.error('Error saving response:', err)
      } finally {
        setIsSaving(false)
      }
    }

    // Auto-advance after a brief delay
    setTimeout(() => handleNext(), 300)
  }

  function handleNext() {
    const filtered = getFilteredQuestions(currentCategoryIndex)
    if (currentQuestionIndex < filtered.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentCategoryIndex < orderedAssessmentQuestions.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      handleComplete()
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentCategoryIndex > 0) {
      const prevCatIndex = currentCategoryIndex - 1
      const prevFiltered = getFilteredQuestions(prevCatIndex)
      setCurrentCategoryIndex(prevCatIndex)
      setCurrentQuestionIndex(prevFiltered.length - 1)
    }
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      if (assessmentId) {
        const res = await fetch(`/api/assessment/public/${assessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })

        if (res.ok) {
          const data = await res.json()
          const serverResults = buildResultsFromAssessment(data.assessment)
          setResults(serverResults)
          saveState({ step: 'results' })
          setStep('results')
          return
        }
      }

      // Fallback: calculate client-side
      const responseMap = new Map<string, { value: number; category: string }>()
      responses.forEach((resp, qId) => {
        responseMap.set(qId, { value: resp.value, category: resp.category })
      })
      const clientResults = calculateResults(responseMap, assessmentCategoriesOrder)
      setResults(clientResults)
      saveState({ step: 'results' })
      setStep('results')
    } catch (err) {
      console.error('Error completing assessment:', err)
      const responseMap = new Map<string, { value: number; category: string }>()
      responses.forEach((resp, qId) => {
        responseMap.set(qId, { value: resp.value, category: resp.category })
      })
      const clientResults = calculateResults(responseMap, assessmentCategoriesOrder)
      setResults(clientResults)
      saveState({ step: 'results' })
      setStep('results')
    } finally {
      setIsCompleting(false)
    }
  }

  if (isResuming) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WELCOME
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'welcome') {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Discover Your Vibration Score"
            subtitle="A comprehensive assessment across 12 life categories that reveals where you're thriving and where your biggest growth opportunities are."
          >
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('email')}
            >
              Begin Your Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PageHero>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6">
              <Stack gap="sm">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-[#39FF14]" />
                  <Text size="sm" className="text-white font-semibold">84 Questions</Text>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Seven questions per category across 12 life areas, designed to reveal your real lived experience.
                </p>
              </Stack>
            </Card>

            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6">
              <Stack gap="sm">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-[#00FFFF]" />
                  <Text size="sm" className="text-white font-semibold">Green Line Scoring</Text>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  See exactly which areas are Above the Green Line and which are asking for more attention.
                </p>
              </Stack>
            </Card>

            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6">
              <Stack gap="sm">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-[#BF00FF]" />
                  <Text size="sm" className="text-white font-semibold">Personalized Results</Text>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Questions adapt to your life situation so your results actually fit where you are right now.
                </p>
              </Stack>
            </Card>
          </div>

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] max-w-3xl mx-auto w-full p-4 md:p-6 lg:p-8">
            <Stack gap="md">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
                How It Works
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Stack gap="xs">
                  <Text size="sm" className="text-[#39FF14] font-semibold">1. Tell us about you</Text>
                  <p className="text-xs md:text-sm text-neutral-400">A few quick questions so we can personalize the assessment to your life.</p>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" className="text-[#00FFFF] font-semibold">2. Answer honestly</Text>
                  <p className="text-xs md:text-sm text-neutral-400">Based on your average experience over the last few weeks, not your best or worst day.</p>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" className="text-[#BF00FF] font-semibold">3. Get your results</Text>
                  <p className="text-xs md:text-sm text-neutral-400">See your scores, Green Line status, and overall vibration percentage instantly.</p>
                </Stack>
              </div>
            </Stack>
          </Card>

          <div className="flex justify-center">
            <p className="text-xs md:text-sm text-neutral-500">Takes about 15-20 minutes. Your progress is saved if you need to step away.</p>
          </div>
        </Stack>
      </Container>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL CAPTURE (frosted glass overlay on assessment preview)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'email') {
    const previewCategory = orderedAssessmentQuestions[0]
    const previewQuestion = previewCategory?.questions?.[0]
    const previewCatDef = VISION_CATEGORIES.find(v => v.key === previewCategory?.category)
    const PreviewIcon = previewCatDef?.icon || Sparkles
    const previewMeta = previewCategory ? categoryMetadata[previewCategory.category] : null

    return (
      <div className="relative">
        {/* Background: assessment UI preview (non-interactive) */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="border-b border-[#1A1A1A]">
            <Container size="xl">
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PreviewIcon className="h-4 w-4 text-[#39FF14]" />
                    <Text size="sm" className="text-white font-medium">{previewMeta?.title || 'Fun'}</Text>
                  </div>
                  <Text size="sm" className="text-neutral-400">1 of 84</Text>
                </div>
                <ProgressBar value={0} max={100} size="sm" />
              </div>
            </Container>
          </div>

          <Container size="sm">
            <div className="py-6 md:py-10">
              <Stack gap="lg">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="bg-[#1A1A1A] text-neutral-300 border-[#333]">
                    {previewMeta?.title || 'Fun'}
                  </Badge>
                  <Text size="sm" className="text-neutral-500">Question 1 of 7</Text>
                </div>

                {previewQuestion && (
                  <>
                    <h2 className="text-base md:text-lg lg:text-xl font-semibold text-white leading-relaxed">
                      {previewQuestion.text}
                    </h2>
                    <Stack gap="sm">
                      {previewQuestion.options.filter(o => !o.isCustom).map((option) => (
                        <div
                          key={option.text}
                          className="w-full text-left px-3 md:px-4 py-3 md:py-3.5 rounded-xl border-2 border-[#222] bg-[#0D0D0D]"
                        >
                          <span className="text-sm text-neutral-200">{option.text}</span>
                        </div>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            </div>
          </Container>
        </div>

        {/* Frosted glass overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-4 w-full max-w-md">
            <Card variant="outlined" className="bg-[#101010]/90 border-[#333] p-6 md:p-8 lg:p-10">
              <form onSubmit={handleEmailSubmit}>
                <Stack gap="md">
                  <div className="text-center">
                    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1">
                      Let&apos;s Get Started
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-400">
                      Enter your info so we can save your progress.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">First Name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  {emailError && (
                    <p className="text-sm text-red-400">{emailError}</p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={emailLoading || !firstName || !email}
                    className="w-full"
                  >
                    {emailLoading ? (
                      <>
                        <Spinner variant="primary" size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Start the Assessment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-neutral-500 text-center">
                    Your information is kept private and never shared.
                  </p>
                </Stack>
              </form>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'profile') {
    const profileComplete = profile.relationship_status && profile.has_children !== null && profile.employment_type

    return (
      <Container size="sm">
        <Stack gap="lg">
          <PageHero
            eyebrow="STEP 2 OF 3"
            title="Personalize Your Assessment"
            subtitle="These three questions customize the assessment to your life situation."
          />

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
            <Stack gap="md">
              <Text size="sm" className="text-white font-semibold">What&apos;s your relationship status?</Text>
              <div className="grid grid-cols-1 gap-2">
                {['Single', 'In a Relationship', 'Married'].map(option => (
                  <button
                    key={option}
                    onClick={() => setProfile(p => ({ ...p, relationship_status: option }))}
                    className={`w-full text-left px-3 md:px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      profile.relationship_status === option
                        ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                        : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{option}</span>
                      {profile.relationship_status === option && (
                        <CheckCircle className="h-4 w-4 text-[#39FF14]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Stack>
          </Card>

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
            <Stack gap="md">
              <Text size="sm" className="text-white font-semibold">Do you have children?</Text>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(option => (
                  <button
                    key={option.label}
                    onClick={() => setProfile(p => ({ ...p, has_children: option.value }))}
                    className={`w-full text-left px-3 md:px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      profile.has_children === option.value
                        ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                        : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{option.label}</span>
                      {profile.has_children === option.value && (
                        <CheckCircle className="h-4 w-4 text-[#39FF14]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Stack>
          </Card>

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
            <Stack gap="md">
              <Text size="sm" className="text-white font-semibold">What best describes your work situation?</Text>
              <div className="grid grid-cols-1 gap-2">
                {['Business Owner', 'Employee'].map(option => (
                  <button
                    key={option}
                    onClick={() => setProfile(p => ({ ...p, employment_type: option }))}
                    className={`w-full text-left px-3 md:px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      profile.employment_type === option
                        ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                        : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{option}</span>
                      {profile.employment_type === option && (
                        <CheckCircle className="h-4 w-4 text-[#39FF14]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Stack>
          </Card>

          <Button
            variant="primary"
            size="sm"
            disabled={!profileComplete}
            onClick={handleProfileComplete}
            className="w-full"
          >
            Start the Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Stack>
      </Container>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSESSMENT QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'assessment') {
    if (isCompleting) {
      return (
        <Container size="xl">
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Stack gap="md" className="text-center">
              <Spinner size="lg" />
              <Text size="sm" className="text-neutral-400">Calculating your results...</Text>
            </Stack>
          </div>
        </Container>
      )
    }

    if (!currentQuestion) {
      return (
        <Container size="xl">
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      )
    }

    const catMeta = categoryMetadata[currentCategory.category]
    const catIcon = VISION_CATEGORIES.find(v => v.key === currentCategory.category)
    const CatIcon = catIcon?.icon || Sparkles
    const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
    const currentResponse = responses.get(currentQuestion.id)
    const isFirstQuestion = currentCategoryIndex === 0 && currentQuestionIndex === 0

    return (
      <>
        {/* Progress Header */}
        <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#1A1A1A]">
          <Container size="xl">
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CatIcon className="h-4 w-4 text-[#39FF14]" />
                  <Text size="sm" className="text-white font-medium">{catMeta?.title || currentCategory.category}</Text>
                </div>
                <Text size="sm" className="text-neutral-400">
                  {currentQuestionNumber} of {totalQuestions}
                </Text>
              </div>
              <ProgressBar value={progressPct} max={100} size="sm" />
            </div>
          </Container>
        </div>

        <Container size="sm">
          <Stack gap="lg">
            {/* Category Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="bg-[#1A1A1A] text-neutral-300 border-[#333]">
                {catMeta?.title || currentCategory.category}
              </Badge>
              <Text size="sm" className="text-neutral-500">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </Text>
            </div>

            {/* Question */}
            <h2 className="text-base md:text-lg lg:text-xl font-semibold text-white leading-relaxed">
              {currentQuestion.text}
            </h2>

            {/* Options */}
            <Stack gap="sm">
              {currentQuestion.options.filter(o => !o.isCustom).map((option) => {
                const isSelected = currentResponse?.text === option.text
                let borderColor = 'border-[#222]'
                let bgColor = 'bg-[#0D0D0D]'
                if (isSelected) {
                  if (option.greenLine === 'above') {
                    borderColor = 'border-[#39FF14]'
                    bgColor = 'bg-[#39FF14]/10'
                  } else if (option.greenLine === 'neutral') {
                    borderColor = 'border-[#FFB701]'
                    bgColor = 'bg-[#FFB701]/10'
                  } else {
                    borderColor = 'border-[#FF0040]'
                    bgColor = 'bg-[#FF0040]/10'
                  }
                }

                return (
                  <button
                    key={option.text}
                    onClick={() => handleSelectOption(
                      currentQuestion.id,
                      { text: option.text, value: option.value, emoji: option.emoji, greenLine: option.greenLine },
                      currentCategory.category,
                      currentQuestion.text
                    )}
                    disabled={isSaving}
                    className={`w-full text-left px-3 md:px-4 py-3 md:py-3.5 rounded-xl border-2 transition-all duration-200 hover:border-[#444] ${borderColor} ${bgColor}`}
                  >
                    <span className="text-sm text-neutral-200">{option.text}</span>
                  </button>
                )
              })}
            </Stack>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={isFirstQuestion ? 'opacity-30' : ''}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              {isSaving && (
                <div className="flex items-center gap-1.5">
                  <Spinner size="sm" />
                  <Text size="sm" className="text-neutral-500">Saving...</Text>
                </div>
              )}

              {currentResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                >
                  {currentCategoryIndex === orderedAssessmentQuestions.length - 1 && currentQuestionIndex === filteredQuestions.length - 1
                    ? 'Finish'
                    : 'Next'}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </Stack>
        </Container>
      </>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'results' && results) {
    const sortedCategories = [...results.categories].sort((a, b) => b.percentage - a.percentage)
    const aboveCount = results.categories.filter(c => c.greenLine === 'above').length
    const transitionCount = results.categories.filter(c => c.greenLine === 'transition').length
    const belowCount = results.categories.filter(c => c.greenLine === 'below').length

    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="YOUR RESULTS"
            title="Your Vibration Score"
          >
            {/* Overall Score Circle */}
            <div className="flex justify-center">
              <div className="relative w-36 h-36 md:w-48 md:h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1A1A" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={getGreenLineColor(
                      results.overallPercentage >= 80 ? 'above' :
                      results.overallPercentage >= 60 ? 'transition' : 'below'
                    )}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(results.overallPercentage / 100) * 327} 327`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl md:text-5xl font-bold text-white">{results.overallPercentage}%</span>
                  <span className="text-xs text-neutral-400 mt-1">Overall</span>
                </div>
              </div>
            </div>

            {/* Summary Badges */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {aboveCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30">
                  <div className="w-2 h-2 rounded-full bg-[#39FF14]" />
                  <span className="text-xs text-[#39FF14] font-medium">{aboveCount} Above the Green Line</span>
                </div>
              )}
              {transitionCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-[#FFB701]/10 border border-[#FFB701]/30">
                  <div className="w-2 h-2 rounded-full bg-[#FFB701]" />
                  <span className="text-xs text-[#FFB701] font-medium">{transitionCount} In Transition</span>
                </div>
              )}
              {belowCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-[#FF0040]/10 border border-[#FF0040]/30">
                  <div className="w-2 h-2 rounded-full bg-[#FF0040]" />
                  <span className="text-xs text-[#FF0040] font-medium">{belowCount} Growth Opportunities</span>
                </div>
              )}
            </div>
          </PageHero>

          {/* Category Breakdown */}
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
            <Stack gap="md">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
                Category Breakdown
              </Text>
              <Stack gap="sm">
                {sortedCategories.map((cat) => {
                  const meta = categoryMetadata[cat.category]
                  const catDef = VISION_CATEGORIES.find(v => v.key === cat.category)
                  const Icon = catDef?.icon || Sparkles
                  const color = getGreenLineColor(cat.greenLine)

                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Text size="sm" className="text-white font-medium">{meta?.title || cat.category}</Text>
                          <span className="text-sm font-semibold" style={{ color }}>{cat.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </Stack>
            </Stack>
          </Card>

          {/* Strengths & Growth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
              <Stack gap="md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#39FF14]" />
                  <Text size="sm" className="text-[#39FF14] font-semibold uppercase tracking-wider">Strengths</Text>
                </div>
                {sortedCategories.filter(c => c.greenLine === 'above').length > 0 ? (
                  <Stack gap="xs">
                    {sortedCategories.filter(c => c.greenLine === 'above').map(cat => (
                      <div key={cat.category} className="flex items-center justify-between py-1">
                        <Text size="sm" className="text-neutral-300">{categoryMetadata[cat.category]?.title || cat.category}</Text>
                        <Text size="sm" className="text-[#39FF14] font-medium">{cat.percentage}%</Text>
                      </div>
                    ))}
                  </Stack>
                ) : (
                  <p className="text-xs md:text-sm text-neutral-500">Keep going - your strengths will emerge as you grow.</p>
                )}
              </Stack>
            </Card>

            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 lg:p-8">
              <Stack gap="md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF0040]" />
                  <Text size="sm" className="text-[#FF0040] font-semibold uppercase tracking-wider">Growth Opportunities</Text>
                </div>
                {sortedCategories.filter(c => c.greenLine === 'below').length > 0 ? (
                  <Stack gap="xs">
                    {sortedCategories.filter(c => c.greenLine === 'below').map(cat => (
                      <div key={cat.category} className="flex items-center justify-between py-1">
                        <Text size="sm" className="text-neutral-300">{categoryMetadata[cat.category]?.title || cat.category}</Text>
                        <Text size="sm" className="text-[#FF0040] font-medium">{cat.percentage}%</Text>
                      </div>
                    ))}
                  </Stack>
                ) : (
                  <p className="text-xs md:text-sm text-neutral-500">No areas below the Green Line - you're well-aligned across the board.</p>
                )}
              </Stack>
            </Card>
          </div>

          {/* CTA */}
          <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-4 md:p-6 lg:p-8">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                  Ready to Raise Your Vibration?
                </h3>
                <p className="text-neutral-400 text-xs md:text-sm lg:text-base max-w-xl mx-auto">
                  Your assessment is just the starting point. VibrationFit gives you a personalized Life Vision, VIVA coaching, and daily tools to move every category Above the Green Line.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = '/#pricing'}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Your Activation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/demo'}
                  >
                    Book a Demo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </Stack>
            </div>
          </Card>
        </Stack>
      </Container>
    )
  }

  return null
}
