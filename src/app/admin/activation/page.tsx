'use client'

/**
 * Admin Activation inspector — jump to any funnel step and review the
 * member-facing UI + copy without running the live email/VIVA flow.
 * Edit strings in src/lib/activation/copy.ts.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Container, Stack, Text } from '@/lib/design-system/components'
import { ExternalLink, Sparkles } from 'lucide-react'
import { ActivationStartForm } from '@/components/activation/ActivationStartForm'
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
    label: 'Landing',
    group: 'Public',
    source: ACTIVATION_COPY.landing.source,
    notes: 'Marketing page. Open the live URL to review layout; section headlines are listed here.',
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
    notes: 'No model cost. I am ready records oriented + activation_oriented.',
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
    notes: 'Shown while core written assets generate. Never auto-starts.',
  },
  {
    id: 'preview',
    label: 'Preview',
    group: 'Delivery',
    source: ACTIVATION_COPY.preview.source,
    notes: 'Checklist only — no text. Enter My Activation → opened, then Immersion shows the writing.',
  },
  {
    id: 'immersion',
    label: 'Immersion',
    group: 'Delivery',
    source: ACTIVATION_COPY.immersion.source,
    notes: 'Start Here. I\'ve Entered This Reality → entered (north-star).',
  },
  {
    id: 'offer',
    label: 'Offer',
    group: 'Delivery',
    source: ACTIVATION_COPY.immersion.source,
    notes: 'Only after entered. Video slot, sticky CTA, downloads, optional inspired step.',
  },
]

const GROUPS = ['Public', 'Experience', 'Delivery'] as const

const SAMPLE_ASSETS = {
  story: { id: 's1', title: 'Future-Self Story', content: ACTIVATION_SAMPLE.story },
  incantation: { id: 's2', title: 'Incantation', content: ACTIVATION_SAMPLE.incantation },
  sparkQuery: {
    id: 's3',
    title: 'SparkQuery',
    content: ACTIVATION_SAMPLE.sparkQuestions.join('\n'),
    metadata: { questions: [...ACTIVATION_SAMPLE.sparkQuestions] },
  },
  song: { id: 'song1', title: 'Song', lyrics: null, status: 'generating', tracks: [] },
  audioTracks: [],
  manifestations: [],
}

const SAMPLE_ACTIVATION = {
  id: 'preview',
  status: 'ready',
  category: ACTIVATION_SAMPLE.category,
  current_state: ACTIVATION_SAMPLE.currentState,
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
  const step = STEPS.find((s) => s.id === stepId) ?? STEPS[0]
  const sample = ACTIVATION_SAMPLE

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

        <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6">
          <nav className="lg:sticky lg:top-4 self-start space-y-4">
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
          </nav>

          <div className="min-w-0">
            <div className="mb-4 rounded-2xl border border-[#222] bg-[#0D0D0D] px-4 py-3">
              <p className="text-sm text-white font-medium">{step.label}</p>
              <p className="text-xs text-neutral-500 mt-1">{step.notes}</p>
              <p className="text-xs text-neutral-600 mt-1 font-mono">{step.source}</p>
            </div>

            <div className="rounded-2xl border-2 border-[#1F1F1F] bg-[#0A0A0A] overflow-hidden">
              {stepId === 'landing' && <LandingInspector />}

              {stepId === 'email-capture' && (
                <div className="px-4 py-8">
                  <ActivationStartForm previewState="form" />
                </div>
              )}

              {stepId === 'check-email' && (
                <div className="px-4 py-8">
                  <ActivationStartForm previewState="check-email" previewEmail={sample.email} />
                </div>
              )}

              {stepId === 'orientation' && (
                <div className="mx-auto max-w-xl px-4 py-6 md:py-10">
                  <ActivationOrientation onReady={() => {}} />
                </div>
              )}

              {stepId === 'category' && (
                <div className="mx-auto max-w-xl px-4 py-6 md:py-10">
                  <ActivationCategoryPick
                    selected={sample.category}
                    onSelect={() => {}}
                    onContinue={() => {}}
                  />
                </div>
              )}

              {stepId === 'chat' && (
                <div className="mx-auto max-w-xl px-4 py-6 md:py-10">
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
                  <GeneratingStep />
                </div>
              )}

              {stepId === 'preview' && (
                <div className="px-4 py-6 md:px-8 md:py-10">
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
                <div className="px-4 py-6 md:px-8 md:py-10">
                  <ActivationDelivery
                    phase="immersion"
                    activation={{
                      ...SAMPLE_ACTIVATION,
                      status: 'opened',
                      opened_at: new Date().toISOString(),
                    }}
                    assets={SAMPLE_ASSETS}
                    onGuideDone={() => {}}
                    hideStickyCta
                  />
                </div>
              )}

              {stepId === 'offer' && (
                <div className="px-4 py-6 md:px-8 md:py-10">
                  <ActivationDelivery
                    phase="offer"
                    activation={{
                      ...SAMPLE_ACTIVATION,
                      status: 'entered',
                      opened_at: new Date().toISOString(),
                      entered_at: new Date().toISOString(),
                      inspired_next_step: sample.inspiredStep,
                    }}
                    assets={SAMPLE_ASSETS}
                    inspiredStep={sample.inspiredStep}
                    inspiredSaved
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
            <p className="text-sm text-white font-medium">Public landing</p>
            <p className="text-xs text-neutral-500 mt-1">
              Layout and long-form copy still live on the landing page file. Open it live to review.
            </p>
          </div>
          <Link
            href={landing.route}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-[#39FF14] hover:underline"
          >
            Open {landing.route}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
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
