'use client'

import { Button, Stack, Text } from '@/lib/design-system/components'
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
      <div>
        <Text size="sm" className="text-[#BF00FF] font-semibold uppercase tracking-wider">
          {copy.eyebrow}
        </Text>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-tight">{copy.title}</h1>
        <p className="mt-3 text-sm md:text-base text-neutral-400 leading-relaxed">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LIFE_CATEGORY_KEYS.map((key) => {
          const def = VISION_CATEGORIES.find((c) => c.key === key)
          const Icon = def?.icon || Heart
          const isSelected = selected === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-[#BF00FF] bg-[#BF00FF]/10 text-white'
                  : 'border-[#222] bg-[#0D0D0D] text-neutral-300 hover:border-[#333]'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-[#BF00FF]' : 'text-neutral-500'}`} />
              <span className="text-sm">{def?.label || key}</span>
              {isSelected && <CheckCircle className="h-4 w-4 text-[#BF00FF] ml-auto" />}
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
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
