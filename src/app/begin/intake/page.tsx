'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { BeginTitle } from '@/components/life-activation/BeginTitle'
import { IntakeSurveyFields } from '@/components/life-activation/IntakeSurveyFields'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { useToolWalkthrough } from '@/hooks/useToolWalkthrough'
import { ToolWalkthrough, WalkthroughToggle } from '@/components/tool-walkthrough'
import { getQuestionsForPhase } from '@/lib/constants/intensive-intake-questions'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstMissingSurveyAnswer,
  savePhaseSurvey,
  surveyPrompt,
  type SurveyAnswers,
} from '@/lib/life-activation/survey'
import { createClient } from '@/lib/supabase/client'

export default function BeginIntakePage() {
  const router = useRouter()
  const { progress, completeOnboardingStep, isUpdating } = useLifeActivation()
  const walkthrough = useToolWalkthrough('intake')
  const questions = useMemo(() => getQuestionsForPhase('pre_intensive'), [])
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copy = LIFE_ACTIVATION_COPY.intake

  const handleSubmit = async () => {
    const missing = firstMissingSurveyAnswer(questions, answers, 'pre_intensive')
    if (missing) {
      setError(missing)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in to save this survey.')
      await savePhaseSurvey(supabase, {
        userId: user.id,
        phase: 'pre_intensive',
        intensiveId: progress?.intensive_checklist_id || null,
        answers,
      })
      await completeOnboardingStep('intake')
      router.push('/life-vision/begin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save intake')
    } finally {
      setSubmitting(false)
    }
  }

  if (!progress) {
    return (
      <Container size="xl">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow={LIFE_ACTIVATION_COPY.sidebar.onboardingTitle}
          title={<BeginTitle text={copy.title} accent={copy.titleAccent} />}
          subtitle={copy.body}
          action={
            <WalkthroughToggle
              active={walkthrough.active}
              onToggle={walkthrough.toggle}
              pending={walkthrough.pending}
            />
          }
        />
        <IntakeSurveyFields
          questions={questions}
          answers={answers}
          onChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          prompt={(question) => surveyPrompt(question, 'pre_intensive')}
        />
        {error && <p className="text-sm text-contrast-400">{error}</p>}
        <div data-tour="intake-submit" className="flex justify-center pt-2">
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || isUpdating} className="min-w-[200px]">
            {copy.cta}
          </Button>
        </div>
      </Stack>
      <ToolWalkthrough
        active={walkthrough.active}
        steps={walkthrough.steps}
        onClose={walkthrough.close}
        onComplete={walkthrough.complete}
      />
    </Container>
  )
}
