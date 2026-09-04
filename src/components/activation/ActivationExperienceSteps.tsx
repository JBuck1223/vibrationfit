'use client'

/**
 * Presentational Activation wizard steps.
 * Shared by /activation/experience and the admin inspector at /admin/activation.
 */

import {
  Button,
  Card,
  Container,
  ProgressBar,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@/lib/design-system/components'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Sparkles,
} from 'lucide-react'
import {
  VISION_CATEGORIES,
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  type VisionCategoryKey,
} from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY, type DreamAnswerKey } from '@/lib/activation/copy'

export type ExperienceStep =
  | 'current-state'
  | 'reflection'
  | 'dream'
  | 'category'
  | 'generating'
  | 'preview'

export type DreamAnswers = Record<DreamAnswerKey, string>

export const EXPERIENCE_STEP_ORDER: ExperienceStep[] = [
  'current-state',
  'reflection',
  'dream',
  'category',
  'generating',
  'preview',
]

export function ActivationProgressHeader({
  step,
}: {
  step: ExperienceStep
}) {
  const copy = ACTIVATION_COPY.chrome
  const stepIndex = Math.max(0, EXPERIENCE_STEP_ORDER.indexOf(step))
  const progressPct = Math.round(((stepIndex + 1) / EXPERIENCE_STEP_ORDER.length) * 100)

  return (
    <div className="sticky top-0 z-50 bg-neutral-850/95 backdrop-blur-sm border-b border-[#1A1A1A]">
      <Container size="xl">
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#BF00FF]" />
              <Text size="sm" className="text-white font-medium">{copy.title}</Text>
            </div>
            <Text size="sm" className="text-neutral-400">
              {step === 'generating'
                ? copy.creating
                : copy.stepOf(stepIndex + 1, EXPERIENCE_STEP_ORDER.length)}
            </Text>
          </div>
          <ProgressBar value={progressPct} max={100} size="sm" />
        </div>
      </Container>
    </div>
  )
}

export function CurrentStateStep({
  currentState,
  onChange,
  onSubmit,
  busy,
  error,
}: {
  currentState: string
  onChange: (value: string) => void
  onSubmit: () => void
  busy: boolean
  error: string | null
}) {
  const copy = ACTIVATION_COPY.currentState
  return (
    <Stack gap="lg">
      <div>
        <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug mb-2">
          {copy.title}
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{copy.subtitle}</p>
      </div>
      <Textarea
        value={currentState}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.placeholder}
        rows={10}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        variant="primary"
        size="sm"
        onClick={onSubmit}
        disabled={busy || currentState.trim().length < copy.minLength}
        className="w-full sm:w-auto"
      >
        {busy ? (
          <>
            <Spinner variant="primary" size="sm" className="mr-2" />
            {copy.submitting}
          </>
        ) : (
          <>
            {copy.submit}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </Stack>
  )
}

export function ReflectionStep({
  reflection,
  onConfirm,
  onAddMore,
}: {
  reflection: string
  onConfirm: () => void
  onAddMore: () => void
}) {
  const copy = ACTIVATION_COPY.reflection
  return (
    <Stack gap="lg">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#BF00FF]" />
        <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">
          {copy.vivaLabel}
        </Text>
      </div>
      <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
        <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">
          {reflection}
        </p>
      </Card>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="primary" size="sm" onClick={onConfirm}>
          {copy.confirm}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onAddMore}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {copy.addMore}
        </Button>
      </div>
    </Stack>
  )
}

export function DreamStep({
  dream,
  onChange,
  onSubmit,
  onBack,
  busy,
  error,
}: {
  dream: DreamAnswers
  onChange: (next: DreamAnswers) => void
  onSubmit: () => void
  onBack: () => void
  busy: boolean
  error: string | null
}) {
  const copy = ACTIVATION_COPY.dream
  return (
    <Stack gap="lg">
      <div>
        <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug mb-2">
          {copy.title}
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{copy.subtitle}</p>
      </div>
      {copy.questions.map((q) => (
        <div key={q.key}>
          <label className="block text-sm text-neutral-200 font-medium mb-1.5 leading-relaxed">
            {q.label}
          </label>
          <Textarea
            value={dream[q.key]}
            onChange={(e) => onChange({ ...dream, [q.key]: e.target.value })}
            placeholder={q.placeholder}
            rows={q.key === 'want' ? 5 : 3}
          />
        </div>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={busy || !dream.want.trim()}
        >
          {busy ? (
            <>
              <Spinner variant="primary" size="sm" className="mr-2" />
              {copy.submitting}
            </>
          ) : (
            <>
              {copy.submit}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {copy.back}
        </Button>
      </div>
    </Stack>
  )
}

export function CategoryStep({
  category,
  confirmationLine,
  correcting,
  error,
  onConfirm,
  onStartCorrecting,
  onSelectCategory,
}: {
  category: string
  confirmationLine: string | null
  correcting: boolean
  error: string | null
  onConfirm: () => void
  onStartCorrecting: () => void
  onSelectCategory: (key: string) => void
}) {
  const copy = ACTIVATION_COPY.category
  const fallback = copy.fallbackLine(getVisionCategoryLabel(category as VisionCategoryKey))

  return (
    <Stack gap="lg">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#BF00FF]" />
        <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">
          {copy.vivaLabel}
        </Text>
      </div>
      <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
        <p className="text-sm md:text-base text-neutral-200 leading-relaxed">
          {confirmationLine || fallback}
        </p>
      </Card>

      {!correcting ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="primary" size="sm" onClick={onConfirm}>
            <Sparkles className="mr-2 h-4 w-4" />
            {copy.confirm}
          </Button>
          <Button variant="ghost" size="sm" onClick={onStartCorrecting}>
            {copy.differentArea}
          </Button>
        </div>
      ) : (
        <Stack gap="md">
          <Text size="sm" className="text-neutral-300">{copy.correctPrompt}</Text>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LIFE_CATEGORY_KEYS.map((key) => {
              const def = VISION_CATEGORIES.find((c) => c.key === key)
              const Icon = def?.icon || Heart
              const selected = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectCategory(key)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                    selected
                      ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                      : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  <span className="text-sm">{def?.label || key}</span>
                  {selected && <CheckCircle className="h-4 w-4 text-[#39FF14] ml-auto" />}
                </button>
              )
            })}
          </div>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            <Sparkles className="mr-2 h-4 w-4" />
            {copy.create}
          </Button>
        </Stack>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </Stack>
  )
}

export function GeneratingStep() {
  const copy = ACTIVATION_COPY.generating
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Stack gap="md" className="text-center max-w-sm">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-white">{copy.title}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{copy.body}</p>
      </Stack>
    </div>
  )
}

export function PreviewStep({
  visionStatement,
  essence,
  busy,
  onEnter,
}: {
  visionStatement: string
  essence: string | null
  busy: boolean
  onEnter: () => void
}) {
  const copy = ACTIVATION_COPY.preview
  return (
    <Stack gap="lg">
      <div className="text-center">
        <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] mb-2">
          {copy.eyebrow}
        </Text>
        {essence && (
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-medium">
              {essence}
            </span>
          </div>
        )}
      </div>
      <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
        <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line">
          {visionStatement}
        </p>
      </Card>
      <p className="text-sm text-neutral-400 text-center leading-relaxed">{copy.supporting}</p>
      <div className="flex justify-center">
        <Button variant="primary" size="sm" onClick={onEnter} disabled={busy}>
          {busy ? (
            <>
              <Spinner variant="primary" size="sm" className="mr-2" />
              {copy.entering}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {copy.enter}
            </>
          )}
        </Button>
      </div>
    </Stack>
  )
}
