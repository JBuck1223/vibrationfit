'use client'

import { Button, Card, Stack, Text } from '@/lib/design-system/components'
import { Clock, Sparkles } from 'lucide-react'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export function ActivationOrientation({
  onReady,
  busy,
  error,
}: {
  onReady: () => void
  busy?: boolean
  error?: string | null
}) {
  const copy = ACTIVATION_COPY.orientation

  return (
    <Stack gap="lg">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-[#BF00FF]" />
          <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">
            {copy.eyebrow}
          </Text>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{copy.title}</h1>
        <p className="mt-3 text-sm md:text-base text-neutral-400 leading-relaxed">{copy.intro}</p>
      </div>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
        <Stack gap="md">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">{copy.youWillTitle}</p>
            <p className="text-sm text-neutral-200 leading-relaxed">{copy.youWill}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">{copy.vivaWillTitle}</p>
            <p className="text-sm text-neutral-200 leading-relaxed">{copy.vivaWill}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">{copy.leaveWithTitle}</p>
            <p className="text-sm text-neutral-200 leading-relaxed">{copy.leaveWith}</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            {copy.time}
          </p>
        </Stack>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <Button variant="primary" size="sm" onClick={onReady} disabled={busy} className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? copy.committing : copy.cta}
        </Button>
      </div>
    </Stack>
  )
}
