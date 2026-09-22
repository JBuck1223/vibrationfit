'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { BeginTitle } from '@/components/life-activation/BeginTitle'
import { IntakeSurveyFields } from '@/components/life-activation/IntakeSurveyFields'
import { UnlockExperience } from '@/components/life-activation/UnlockExperience'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { getQuestionsForPhase } from '@/lib/constants/intensive-intake-questions'
import { signalBeginComplete } from '@/lib/life-activation/celebration'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstMissingSurveyAnswer,
  savePhaseSurvey,
  surveyPrompt,
  type SurveyAnswers,
} from '@/lib/life-activation/survey'
import { createClient } from '@/lib/supabase/client'

export default function BeginUnlockPage() {
  const router = useRouter()
  const { progress, completeOnboardingStep, isUpdating } = useLifeActivation()
  const questions = useMemo(() => getQuestionsForPhase('post_intensive'), [])
  const scoredQuestions = useMemo(
    () => questions.filter((question) => question.id !== 'biggest_shift'),
    [questions],
  )
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoTranscript, setVideoTranscript] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copy = LIFE_ACTIVATION_COPY.unlock
  const prompt = (question: (typeof questions)[number]) =>
    surveyPrompt(question, 'post_intensive', copy.shiftQuestion)
  const writtenShift = String(answers.biggest_shift ?? '').trim()
  const hasExperience = Boolean(videoUrl) || Boolean(videoTranscript?.trim()) || Boolean(writtenShift)

  const handleSubmit = async () => {
    const missing = firstMissingSurveyAnswer(
      scoredQuestions,
      answers,
      'post_intensive',
      copy.shiftQuestion,
    )
    if (missing || !hasExperience) {
      setError(missing || 'Record a video or write what shifted before you finish.')
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
        phase: 'post_intensive',
        intensiveId: progress?.intensive_checklist_id || null,
        answers: {
          ...answers,
          biggest_shift: writtenShift || videoTranscript || '',
        },
        extras: {
          testimonial_video_url: videoUrl,
          testimonial_transcript: videoTranscript,
        },
      })
      await completeOnboardingStep('unlock')
      signalBeginComplete()
      router.replace('/map')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the survey')
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
        />
        <div>
          <IntakeSurveyFields
            questions={scoredQuestions}
            answers={answers}
            onChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
            prompt={prompt}
          />
          <UnlockExperience
            number={scoredQuestions.filter((question) => prompt(question)).length + 1}
            question={copy.shiftQuestion}
            text={writtenShift}
            onTextChange={(value) => setAnswers((prev) => ({ ...prev, biggest_shift: value }))}
            videoUrl={videoUrl}
            transcript={videoTranscript}
            onVideo={(url, transcript) => {
              setVideoUrl(url)
              if (transcript?.trim()) setVideoTranscript(transcript.trim())
            }}
            recordingId={progress.user_id ? `begin-${progress.user_id}-unlock` : undefined}
          />
        </div>
        {error && <p className="text-sm text-contrast-400">{error}</p>}
        <div className="flex justify-center pt-2">
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || isUpdating} className="min-w-[200px]">
            {copy.cta}
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
