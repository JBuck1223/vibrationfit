'use client'

/**
 * Admin Activation inspector — jump to any funnel step and review the
 * member-facing UI + copy without running the live email/VIVA flow.
 * Edit strings in src/lib/activation/copy.ts.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Container, Stack, Text } from '@/lib/design-system/components'
import { ExternalLink, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react'
import { ActivationStartForm } from '@/components/activation/ActivationStartForm'
import { FreeActivationOptIn } from '@/components/activation/FreeActivationOptIn'
import { ActivationOrientation } from '@/components/activation/ActivationOrientation'
import { ActivationCategoryPick } from '@/components/activation/ActivationCategoryPick'
import { ActivationIntakeChat } from '@/components/activation/ActivationIntakeChat'
import { GeneratingStep } from '@/components/activation/ActivationExperienceSteps'
import { ActivationDelivery } from '@/components/activation/ActivationDelivery'
import { ACTIVATION_COPY, ACTIVATION_SAMPLE } from '@/lib/activation/copy'

type InspectorStepId =
  | 'landing'
  | 'email-capture'
  | 'check-email'
  | 'orientation'
  | 'category'
  | 'chat'
  | 'generating'
  | 'preview'
  | 'immersion'
  | 'offer'

interface InspectorStep {
  id: InspectorStepId
  label: string
  group: string
  source: string
  notes: string
}

const STEPS: InspectorStep[] = [
  {
    id: 'landing',
    label: 'Opt-in',
    group: 'Public',
    source: ACTIVATION_COPY.optIn.source,
    notes: 'Landing is /free-activation (homepage layout, free card under the hero). The form is /free-activation/start. /activation redirects to the landing. /activation/start redirects to the form.',
  },
  {
    id: 'email-capture',
    label: 'Email capture',
    group: 'Public',
    source: ACTIVATION_COPY.startForm.source,
    notes: 'Creates the free account. Form does not submit in this inspector.',
  },
  {
    id: 'check-email',
    label: 'Check email',
    group: 'Public',
    source: ACTIVATION_COPY.startForm.source,
    notes: 'Shown when the email already belongs to a member. Branded resume mail includes the activation id.',
  },
  {
    id: 'orientation',
    label: 'Orientation',
    group: 'Experience',
    source: ACTIVATION_COPY.orientation.source,
    notes: 'How-it-works video, then Start My Activation. No model cost. Records oriented + activation_oriented.',
  },
  {
    id: 'category',
    label: 'Choose area',
    group: 'Experience',
    source: ACTIVATION_COPY.categoryPick.source,
    notes: 'Member picks the life category. VIVA does not infer it.',
  },
  {
    id: 'chat',
    label: 'VIVA chat',
    group: 'Experience',
    source: ACTIVATION_COPY.chat.source,
    notes: `Bounded Conversational Intelligence, tailored to the chosen area. Prompt: ${ACTIVATION_COPY.chat.promptFile}`,
  },
  {
    id: 'generating',
    label: 'Generating',
    group: 'Experience',
    source: ACTIVATION_COPY.generating.source,
    notes: 'VIVA loading overlay. Messages follow the written assets being created.',
  },
  {
    id: 'preview',
    label: 'Preview',
    group: 'Delivery',
    source: ACTIVATION_COPY.preview.source,
    notes: 'Ready checklist plus voice and genre pick. Enter My Activation starts audio, song recording, and images.',
  },
  {
    id: 'immersion',
    label: 'Immersion',
    group: 'Delivery',
    source: ACTIVATION_COPY.immersion.source,
    notes: 'Header, activation map, and assets with audio in each container. No offer yet.',
  },
  {
    id: 'offer',
    label: 'Offer',
    group: 'Delivery',
    source: ACTIVATION_COPY.immersion.source,
    notes: 'Same Immersion page after I\'ve Entered This Reality. Offer and sticky CTA appear at the bottom only.',
  },
]

const GROUPS = ['Public', 'Experience', 'Delivery'] as const
const STEPS_OPEN_KEY = 'activation-inspector-steps-open'

const SAMPLE_ASSETS = {
  story: { id: 's1', title: 'Future-Self Story', content: ACTIVATION_SAMPLE.story },
  incantation: { id: 's2', title: 'Incantation', content: ACTIVATION_SAMPLE.incantation },
  sparkQuery: {
    id: 's3',
    title: 'SparkQuery',
    content: ACTIVATION_SAMPLE.sparkQuestions.join('\n'),
    metadata: { questions: [...ACTIVATION_SAMPLE.sparkQuestions] },
  },
  song: { id: 'song1', title: 'Song', lyrics: ACTIVATION_SAMPLE.songLyrics, status: 'lyrics_complete', tracks: [] },
  audioTracks: [],
  manifestations: [],
}

const SAMPLE_ACTIVATION = {
  id: 'preview',
  status: 'ready',
  category: ACTIVATION_SAMPLE.category,
  first_name: ACTIVATION_SAMPLE.firstName,
  current_state: ACTIVATION_SAMPLE.currentState,
  dream_response: { ...ACTIVATION_SAMPLE.dream },
  reflection: ACTIVATION_SAMPLE.reflection,
  vision_statement: ACTIVATION_SAMPLE.visionStatement,
  essence: ACTIVATION_SAMPLE.essence,
  inspired_next_step: null,
  opened_at: null,
  entered_at: null,
  asset_status: {
    audio: { state: 'generating' },
    song: { state: 'generating' },
    board: { state: 'generating' },
  },
}

export default function AdminActivationInspectorPage() {
  const [stepId, setStepId] = useState<InspectorStepId>('orientation')
  const [stepsOpen, setStepsOpen] = useState(true)
  const [stepsReady, setStepsReady] = useState(false)
  const step = STEPS.find((s) => s.id === stepId) ?? STEPS[0]
  const sample = ACTIVATION_SAMPLE

  useEffect(() => {
    if (localStorage.getItem(STEPS_OPEN_KEY) === 'false') setStepsOpen(false)
    setStepsReady(true)
  }, [])

  useEffect(() => {
    if (!stepsReady) return
    localStorage.setItem(STEPS_OPEN_KEY, String(stepsOpen))
  }, [stepsOpen, stepsReady])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#BF00FF]" />
            <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">
              Activation inspector
            </Text>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Jump to any step of the public Activation. Copy lives in{' '}
            <code className="text-neutral-200">src/lib/activation/copy.ts</code>
            {' '}— tell me what to change on a step and I will update it there.
          </p>
        </div>

        <div className={stepsOpen ? 'grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]' : 'grid grid-cols-1 gap-6'}>
          {stepsOpen && <nav className="lg:sticky lg:top-4 self-start space-y-4">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{group}</p>
                <div className="flex flex-wrap lg:flex-col gap-1.5">
                  {STEPS.filter((s) => s.group === group).map((s) => {
                    const active = s.id === stepId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStepId(s.id)}
                        className={`px-3 py-2 rounded-xl text-left text-sm border-2 transition-all duration-200 ${
                          active
                            ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                            : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
                        }`}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>}

          <div className="min-w-0">
            <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#222] bg-[#0D0D0D] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">{step.label}</p>
                <p className="text-xs text-neutral-500 mt-1">{step.notes}</p>
                <p className="text-xs text-neutral-600 mt-1 font-mono">{step.source}</p>
              </div>
              <button
                type="button"
                onClick={() => setStepsOpen((open) => !open)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#39FF14] hover:text-white"
              >
                {stepsOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
                {stepsOpen ? 'Hide sections' : 'Sections'}
              </button>
            </div>

            <div className="rounded-2xl border-2 border-[#1F1F1F] bg-[#0A0A0A] overflow-hidden">
              {stepId === 'landing' && (
                <div className="px-4 py-4">
                  <LandingInspector />
                  <FreeActivationOptIn preview />
                </div>
              )}

              {stepId === 'email-capture' && (
                <div className="px-4 py-8">
                  <ActivationStartForm previewState="form" landingPage="/free-activation/start" />
                </div>
              )}

              {stepId === 'check-email' && (
                <div className="px-4 py-8">
                  <ActivationStartForm previewState="check-email" previewEmail={sample.email} />
                </div>
              )}

              {stepId === 'orientation' && (
                <div className="py-8 md:py-10">
                  <ActivationOrientation onReady={() => {}} />
                </div>
              )}

              {stepId === 'category' && (
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
                  <ActivationCategoryPick
                    selected={sample.category}
                    onSelect={() => {}}
                    onContinue={() => {}}
                  />
                </div>
              )}

              {stepId === 'chat' && (
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
                  <ActivationIntakeChat
                    activationId="preview"
                    initialMessages={[...sample.conversation]}
                    currentState={sample.currentState}
                    dreamWant={sample.dream.want}
                    category={sample.category}
                    intakeReady
                    readOnly
                    onCreate={() => {}}
                  />
                </div>
              )}

              {stepId === 'generating' && (
                <div className="px-4 py-6">
                  <GeneratingStep category={sample.category} contained />
                </div>
              )}

              {stepId === 'preview' && (
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
                  <ActivationDelivery
                    phase="preview"
                    activation={SAMPLE_ACTIVATION}
                    assets={SAMPLE_ASSETS}
                    onEnter={() => {}}
                    hideStickyCta
                  />
                </div>
              )}

              {stepId === 'immersion' && (
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
                  <ActivationDelivery
                    phase="immersion"
                    activation={{
                      ...SAMPLE_ACTIVATION,
                      status: 'opened',
                      opened_at: new Date().toISOString(),
                    }}
                    assets={SAMPLE_ASSETS}
                    hideStickyCta
                  />
                </div>
              )}

              {stepId === 'offer' && (
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
                  <ActivationDelivery
                    phase="offer"
                    activation={{
                      ...SAMPLE_ACTIVATION,
                      status: 'entered',
                      opened_at: new Date().toISOString(),
                      entered_at: new Date().toISOString(),
                    }}
                    assets={SAMPLE_ASSETS}
                    hideStickyCta
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  )
}

function LandingInspector() {
  const landing = ACTIVATION_COPY.landing
  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <Stack gap="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-white font-medium">Free Activation landing</p>
            <p className="text-xs text-neutral-500 mt-1">
              Homepage layout with the free card under the hero. The form below is the /free-activation/start capture page.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Link
              href={landing.route}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-[#39FF14] hover:underline"
            >
              Open {landing.route}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={ACTIVATION_COPY.optIn.route}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white hover:underline"
            >
              Start form {ACTIVATION_COPY.optIn.route}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={ACTIVATION_COPY.landingHome.route}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white hover:underline"
            >
              Front door {ACTIVATION_COPY.landingHome.route}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <ol className="space-y-2">
          {landing.sections.map((section, i) => (
            <li
              key={section.id}
              className="rounded-xl border border-[#222] bg-[#101010] px-4 py-3"
            >
              <p className="text-sm text-white">
                <span className="text-neutral-500 mr-2">{i + 1}.</span>
                {section.heading}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{section.notes}</p>
            </li>
          ))}
        </ol>
      </Stack>
    </div>
  )
}
