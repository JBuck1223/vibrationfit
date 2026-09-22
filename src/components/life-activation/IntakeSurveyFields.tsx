'use client'

import { RecordingTextarea } from '@/components/RecordingTextarea'
import type { IntakeQuestion } from '@/lib/constants/intensive-intake-questions'
import type { SurveyAnswers } from '@/lib/life-activation/survey'

export function IntakeSurveyFields({
  questions,
  answers,
  onChange,
  prompt,
}: {
  questions: IntakeQuestion[]
  answers: SurveyAnswers
  onChange: (id: string, value: string | number) => void
  prompt: (question: IntakeQuestion) => string
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
            {question.hint && <p className="mt-1 text-xs text-neutral-500">{question.hint}</p>}
            {question.type === 'text' ? (
              <div className="mt-3">
                <RecordingTextarea
                  value={String(answers[question.id] ?? '')}
                  onChange={(value) => onChange(question.id, value)}
                  placeholder="Write here, or tap the mic to record."
                  rows={4}
                  recordingPurpose="quick"
                  allowVideo={false}
                  storageFolder="journal"
                  instanceId={`survey-${question.id}`}
                  category={`survey-${question.id}`}
                />
              </div>
            ) : question.type === 'multiple_choice' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(question.options || []).map((option) => {
                  const selected = answers[question.id] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange(question.id, option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        selected
                          ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                          : 'border-white/10 text-neutral-400 hover:border-white/25'
                      }`}
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
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onChange(question.id, value)}
                      className={`h-8 min-w-8 rounded-full border px-2 text-sm ${
                        selected
                          ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                          : 'border-white/10 text-neutral-400 hover:border-white/25'
                      }`}
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
