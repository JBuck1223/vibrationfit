'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, PageHero, Spinner, Stack, Textarea } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { useToolWalkthrough } from '@/hooks/useToolWalkthrough'
import { ToolWalkthrough, WalkthroughToggle } from '@/components/tool-walkthrough'
import { getQuestionsForPhase } from '@/lib/constants/intensive-intake-questions'
import { createClient } from '@/lib/supabase/client'

export default function BeginIntakePage() {
  const router = useRouter()
  const { progress, completeTrainingStep, isUpdating } = useLifeActivation()
  const walkthrough = useToolWalkthrough('intake')
  const questions = useMemo(() => getQuestionsForPhase('pre_intensive'), [])
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      if (progress?.intensive_checklist_id) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const insertData: Record<string, unknown> = {
            intensive_id: progress.intensive_checklist_id,
            user_id: user.id,
            phase: 'pre_intensive',
            ...answers,
          }
          const { error: insertError } = await supabase.from('intensive_responses').insert(insertData)
          if (insertError) console.error('[begin/intake]', insertError.message)
        }
      }
      await completeTrainingStep('intake')
      router.push('/story')
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
        <div className="flex items-start justify-between gap-4">
          <PageHero
            eyebrow="Tools Training"
            title="Baseline Intake"
            subtitle="A snapshot of where you are now. There are no wrong numbers."
          />
          <WalkthroughToggle
            active={walkthrough.active}
            onToggle={walkthrough.toggle}
            pending={walkthrough.pending}
          />
        </div>
        <div className="space-y-4" data-tour="intake-survey">
          {questions.map((question) => (
            <Card key={question.id} className="p-5">
              <p className="text-sm font-medium text-white">{question.questionPre}</p>
              {question.type === 'text' ? (
                <div className="mt-3">
                  <Textarea
                    value={String(answers[question.id] ?? '')}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: (question.max ?? 10) - (question.min ?? 0) + 1 }, (_, i) => {
                    const value = (question.min ?? 0) + i
                    const selected = answers[question.id] === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                        className={`h-9 min-w-9 rounded-full border px-2 text-sm ${
                          selected
                            ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                            : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                        }`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
        {error && <p className="text-sm text-contrast-400">{error}</p>}
        <div data-tour="intake-submit" className="w-fit">
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || isUpdating}>
            Save intake
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
