'use client'

import type { ReactNode } from 'react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import type { IntakeQuestion } from '@/lib/constants/intensive-intake-questions'
import type { SurveyAnswers } from '@/lib/life-activation/survey'

export function IntakeSurveyFields({
  questions,
  answers,
  onChange,
  prompt,
  readOnly = false,
  baseline,
  insight,
}: {
  questions: IntakeQuestion[]
  answers: SurveyAnswers
  onChange?: (id: string, value: string | number) => void
  prompt: (question: IntakeQuestion) => string
  readOnly?: boolean
  baseline?: SurveyAnswers
  insight?: (question: IntakeQuestion) => ReactNode
}) {
  const rows = questions.flatMap((question) => {
    const text = prompt(question)
    return text ? [{ question, text }] : []
  })

  return (
    <div data-tour="intake-survey">
      {rows.map(({ question, text }, index) => (
          <div
            key={question.id}
            className={index > 0 ? 'border-t border-white/[0.06] py-5' : 'pb-5'}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{text}</p>
            <BaselineNote baseline={baseline?.[question.id]} current={answers[question.id]} />
            {question.hint && <p className="mt-1 text-xs text-neutral-500">{question.hint}</p>}
            {insight?.(question)}
            {question.type === 'text' ? (
              readOnly ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                  {String(answers[question.id] ?? '').trim() || 'No answer'}
                </p>
              ) : (
                <div className="mt-3">
                  <RecordingTextarea
                    value={String(answers[question.id] ?? '')}
                    onChange={(value) => onChange?.(question.id, value)}
                    placeholder="Write here, or tap the mic to record."
                    rows={4}
                    recordingPurpose="quick"
                    allowVideo={false}
                    storageFolder="journal"
                    instanceId={`survey-${question.id}`}
                    category={`survey-${question.id}`}
                  />
                </div>
              )
            ) : question.type === 'multiple_choice' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(question.options || []).map((option) => {
                  const selected = answers[question.id] === option.value
                  const className = `rounded-full border px-3 py-1.5 text-sm ${
                    selected
                      ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                      : readOnly
                        ? 'border-white/10 text-neutral-600'
                        : 'border-white/10 text-neutral-400 hover:border-white/25'
                  }`
                  if (readOnly) {
                    return (
                      <span key={option.value} className={className}>
                        {option.label}
                      </span>
                    )
                  }
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange?.(question.id, option.value)}
                      className={className}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: (question.max ?? 10) - (question.min ?? 0) + 1 }, (_, index) => {
                  const value = (question.min ?? 0) + index
                  const selected = answers[question.id] === value
                  const className = `inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm ${
                    selected
                      ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                      : readOnly
                        ? 'border-white/10 text-neutral-600'
                        : 'border-white/10 text-neutral-400 hover:border-white/25'
                  }`
                  if (readOnly) {
                    return (
                      <span key={value} className={className}>
                        {value}
                      </span>
                    )
                  }
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onChange?.(question.id, value)}
                      className={className}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            )}
              </div>
            </div>
          </div>
      ))}
    </div>
  )
}

function BaselineNote({
  baseline,
  current,
}: {
  baseline: string | number | undefined
  current: string | number | undefined
}) {
  if (baseline === undefined || baseline === '') return null
  const improvement =
    typeof baseline === 'number' && typeof current === 'number' && current > baseline
      ? current - baseline
      : null
  const label = typeof baseline === 'number' ? `${baseline}/10` : String(baseline).replace(/_/g, ' ')

  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
      <span>Baseline: {label}</span>
      {improvement !== null && <span className="text-primary-400">+{improvement}</span>}
    </p>
  )
}
