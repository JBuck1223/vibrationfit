'use client'

import { useState } from 'react'
import { Card, Container, Stack, Text } from '@/lib/design-system/components'
import { MemberSidebarPreview } from '@/components/life-activation/MemberSidebarPreview'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  LIFE_ACTIVATION_TRAINING_NAV_ENABLED,
  type LifeActivationSidebarMode,
} from '@/lib/life-activation/sidebar'
import { ONBOARDING_STEPS, TRAINING_STEPS } from '@/lib/life-activation/steps'

const PREVIEW_PHASES: Array<{ id: LifeActivationSidebarMode; label: string; note: string }> = [
  {
    id: 'getting-started',
    label: 'Begin mode',
    note: 'While they are getting started, the sidebar has one return tab: Getting Started.',
  },
  {
    id: 'tools-training',
    label: 'After Getting Started',
    note: 'That tab becomes Tools Training. Each tool walk-through checks off as they finish it.',
  },
  {
    id: 'hidden',
    label: 'Training complete',
    note: 'When every walk-through is done, the tab leaves the sidebar.',
  },
]

export default function AdminBeginPage() {
  const [previewMode, setPreviewMode] = useState<LifeActivationSidebarMode>('getting-started')
  const phase = PREVIEW_PHASES.find((p) => p.id === previewMode) ?? PREVIEW_PHASES[0]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <Text className="text-xs uppercase tracking-wide text-neutral-500">Admin</Text>
          <h1 className="mt-1 text-2xl font-semibold text-white">Life Activation</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Copy source: {LIFE_ACTIVATION_COPY.source}. Member home is /begin. Training is
            /begin/training. Walk-through text is edited at{' '}
            <a href="/admin/walkthroughs" className="text-[#00FFFF] hover:underline">
              /admin/walkthroughs
            </a>
            .
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white">Sidebar</h2>
          <p className="mt-1 text-sm text-neutral-400">{phase.note}</p>
          <p className="mt-2 text-sm text-neutral-500">
            Tools Training is {LIFE_ACTIVATION_TRAINING_NAV_ENABLED ? 'on' : 'off'} on the live
            member sidebar until the tool walk-throughs are ready. Begin mode already shows
            Getting Started, including accounts that have not started yet.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PREVIEW_PHASES.map((item) => {
              const active = item.id === previewMode
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreviewMode(item.id)}
                  className={
                    active
                      ? 'rounded-xl border-2 border-[#39FF14] bg-[#39FF14]/10 px-3 py-2 text-sm text-white'
                      : 'rounded-xl border-2 border-[#222] bg-[#0D0D0D] px-3 py-2 text-sm text-neutral-300 hover:border-[#333]'
                  }
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <div className="mt-6 max-w-sm">
            <MemberSidebarPreview mode={previewMode} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white">Onboarding</h2>
          <p className="mt-1 text-sm text-neutral-400">{LIFE_ACTIVATION_COPY.welcome.body}</p>
          <ol className="mt-4 space-y-2">
            {ONBOARDING_STEPS.map((step) => (
              <li key={step.id} className="text-sm text-neutral-300">
                {step.number}. {step.title} — {step.href}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white">Tools Training</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Each step is a page walk-through, the way Life Vision already works. Completing the
            tour checks that tool off. When the last one is done, the sidebar tab disappears.
          </p>
          <ol className="mt-4 space-y-2">
            {TRAINING_STEPS.map((step) => (
              <li key={step.id} className="text-sm text-neutral-300">
                {step.number}. {step.title} — {step.href}
              </li>
            ))}
          </ol>
        </Card>
      </Stack>
    </Container>
  )
}
