'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { BeginTitle } from '@/components/life-activation/BeginTitle'
import { IntakeSurveyFields } from '@/components/life-activation/IntakeSurveyFields'
import { UnlockExperience } from '@/components/life-activation/UnlockExperience'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { getQuestionsForPhase, type IntakeQuestion } from '@/lib/constants/intensive-intake-questions'
import {
  normalizeUnlockStats,
  suggestUnlockAnswers,
  unlockAccomplishmentWriteup,
  unlockActivities,
  unlockScoreWriteup,
  type UnlockStats,
} from '@/lib/intensive/unlock-scoring'
import { signalBeginComplete } from '@/lib/life-activation/celebration'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstMissingSurveyAnswer,
  loadPhaseSurvey,
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
    () => questions.filter((question) => question.id !== 'biggest_shift' && question.id !== 'sharing_preference'),
    [questions],
  )
  const baselineIds = useMemo(
    () => getQuestionsForPhase('pre_intensive').map((question) => question.id),
    [],
  )
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [baseline, setBaseline] = useState<SurveyAnswers>({})
  const [stats, setStats] = useState<UnlockStats | null>(null)
  const [ready, setReady] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoTranscript, setVideoTranscript] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copy = LIFE_ACTIVATION_COPY.unlock
  const prompt = (question: (typeof questions)[number]) =>
    surveyPrompt(question, 'post_intensive', copy.shiftQuestion)
  const writtenShift = String(answers.biggest_shift ?? '').trim()
  const sharing = String(answers.sharing_preference ?? 'named')
  const hasExperience = Boolean(videoUrl) || Boolean(videoTranscript?.trim()) || Boolean(writtenShift)

  useEffect(() => {
    if (!progress?.user_id) return
    let cancelled = false
    const supabase = createClient()

    Promise.all([
      fetch('/api/intensive/stats').then(async (response) => (response.ok ? response.json() : null)),
      loadPhaseSurvey(supabase, {
        userId: progress.user_id,
        phase: 'pre_intensive',
        intensiveId: progress.intensive_checklist_id,
        questionIds: baselineIds,
      }).catch(() => null),
    ])
      .then(([payload, loadedBaseline]) => {
        if (cancelled) return
        const nextStats = normalizeUnlockStats(payload?.stats)
        setStats(nextStats)
        setBaseline(loadedBaseline ?? {})
        if (nextStats) setAnswers(suggestUnlockAnswers(nextStats))
      })
      .catch(() => {
        if (!cancelled) setError('Could not read your account activity. You can still answer each question.')
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [progress?.user_id, progress?.intensive_checklist_id, baselineIds])

  const handleSubmit = async () => {
    const missing = firstMissingSurveyAnswer(
      scoredQuestions,
      answers,
      'post_intensive',
      copy.shiftQuestion,
    )
    if (missing || !hasExperience) {
      setError(missing || 'Record a video or write a brief snippet before you finish.')
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
          sharing_preference: sharing,
        },
        extras: {
          testimonial_video_url: videoUrl,
          testimonial_transcript: videoTranscript,
        },
        statsSnapshot: stats,
      })
      await completeOnboardingStep('unlock')
      signalBeginComplete()
      router.replace('/dashboard?welcome=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the survey')
    } finally {
      setSubmitting(false)
    }
  }

  const insight = (question: IntakeQuestion) => {
    if (!stats) return null
    const activities = unlockActivities(question.id, stats)
    const writeup = unlockScoreWriteup(question.id, stats, answers[question.id])
    if (!activities.length && !writeup) return null
    return (
      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        {activities.length > 0 && (
          <>
            <p className="text-xs font-medium text-neutral-500">Your activity</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activities.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-300"
                >
                  {item.label}: <span className="text-white">{item.value}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {writeup && <p className="mt-2 text-xs font-medium leading-relaxed text-primary-400">{writeup}</p>}
      </div>
    )
  }

  if (!progress || !ready) {
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
        {stats && (
          <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
            {unlockAccomplishmentWriteup(stats)}
          </p>
        )}
        <div>
          <IntakeSurveyFields
            questions={scoredQuestions}
            answers={answers}
            baseline={baseline}
            insight={insight}
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
            sharePrompt={copy.sharePrompt}
            shareOptions={copy.shareOptions}
            sharing={sharing}
            onSharingChange={(value) => setAnswers((prev) => ({ ...prev, sharing_preference: value }))}
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
