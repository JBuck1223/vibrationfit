'use client'

import { Button, Stack } from '@/lib/design-system/components'
import { CheckCircle, Heart } from 'lucide-react'
import {
  LIFE_CATEGORY_KEYS,
  VISION_CATEGORIES,
} from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export function ActivationCategoryPick({
  selected,
  onSelect,
  onContinue,
  busy,
  error,
}: {
  selected: string | null
  onSelect: (key: string) => void
  onContinue: () => void
  busy?: boolean
  error?: string | null
}) {
  const copy = ACTIVATION_COPY.categoryPick

  return (
    <Stack gap="lg">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#39FF14]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {copy.title}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {LIFE_CATEGORY_KEYS.map((key) => {
          const def = VISION_CATEGORIES.find((c) => c.key === key)
          const Icon = def?.icon || Heart
          const isSelected = selected === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-5 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-[#BF00FF] bg-[#BF00FF]/10 text-white'
                  : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-[#BF00FF]' : 'text-neutral-500'}`} />
              <span className="text-base font-medium">{def?.label || key}</span>
              {isSelected && <CheckCircle className="ml-auto h-5 w-5 text-[#BF00FF]" />}
            </button>
          )
        })}
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="sm"
          onClick={onContinue}
          disabled={!selected || busy}
          className="w-full sm:w-auto"
        >
          {busy ? copy.continuing : copy.continue}
        </Button>
      </div>
    </Stack>
  )
}

export function categoryKeyLabel(key: string): string {
  return VISION_CATEGORIES.find((c) => c.key === key)?.label || key
}
