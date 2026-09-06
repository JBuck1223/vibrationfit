'use client'

import { Button, Stack } from '@/lib/design-system/components'
import { Clock, Sparkles } from 'lucide-react'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { ActivationIncludes } from '@/components/activation/ActivationIncludes'

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
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#39FF14]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-6 max-w-4xl text-lg leading-[1.75] text-neutral-300 md:text-xl">
          {copy.lead}
        </p>
      </div>

      <p className="mx-auto max-w-4xl text-left text-pretty text-base leading-[1.75] text-neutral-400 md:text-justify md:text-lg">
        {copy.body}
      </p>

      <ActivationIncludes />

      <p className="mx-auto max-w-4xl text-center text-base leading-relaxed text-neutral-400 md:text-lg">
        {copy.close}
      </p>

      <p className="flex items-center justify-center gap-2 text-sm text-neutral-500">
        <Clock className="h-4 w-4" />
        {copy.time}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="sm"
          onClick={onReady}
          disabled={busy}
          className="w-full sm:w-auto"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? copy.committing : copy.cta}
        </Button>
      </div>
    </Stack>
  )
}
