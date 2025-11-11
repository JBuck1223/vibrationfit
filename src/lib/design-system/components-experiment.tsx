'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { LucideIcon, Sparkles } from 'lucide-react'
import { Card, Stack, Heading, Text, Badge, Icon } from './components'
import { VISION_CATEGORIES } from './vision-categories'
import { colors, spacing, borderRadius, shadows, durations, typography } from './tokens'

export interface ExperimentalComponentDefinition {
  id: string
  name: string
  description: string
  component: React.ComponentType
  status?: 'exploratory' | 'in-review' | 'validated'
  icon: LucideIcon
  path: string
}

export interface SingleCategorySelectorExperimentProps {
  value?: string | null
  onChange?: (value: string) => void
  showSelectedLabel?: boolean
}

export const SingleCategorySelectorExperiment: React.FC<SingleCategorySelectorExperimentProps> = ({
  value = null,
  onChange,
  showSelectedLabel = true,
}) => {
  const categories = useMemo(
    () => VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion'),
    []
  )
  const [internalValue, setInternalValue] = useState<string | null>(value)
  const selected = value ?? internalValue

  useEffect(() => {
    setInternalValue(value ?? null)
  }, [value])

  const handleSelect = (categoryKey: string) => {
    setInternalValue(categoryKey)
    onChange?.(categoryKey)
  }

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Heading level={3} style={{ color: colors.neutral[50], fontSize: typography.fontSize['2xl'] }}>
          Single Category Selector Experiment
        </Heading>
        <Text
          size="sm"
          className="text-neutral-400"
          style={{ fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.relaxed }}
        >
          This experimental treatment explores tighter card spacing, neon glow feedback, and optional copy cues for single-select
          interactions.
        </Text>
      </Stack>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{ gap: spacing[4] }}
      >
        {categories.map(category => {
          const IconComponent = category.icon
          const isSelected = selected === category.key

          return (
            <Card
              key={category.key}
              variant={isSelected ? 'elevated' : 'default'}
              hover
              className="cursor-pointer aspect-square transition-all duration-300 border-2"
              onClick={() => handleSelect(category.key)}
              style={{
                borderRadius: borderRadius['2xl'],
                borderColor: isSelected ? colors.primary[50] : colors.neutral.borderLight,
                boxShadow: isSelected ? shadows.primary : 'none',
                background: isSelected ? 'rgba(57, 255, 20, 0.07)' : colors.neutral.cardBg,
                transform: isSelected ? 'translateY(-4px)' : undefined,
                transitionDuration: durations[300],
              }}
            >
              <Stack
                align="center"
                gap="xs"
                className="justify-center h-full text-center"
                style={{ padding: spacing[4] }}
              >
                <span
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: borderRadius['2xl'],
                    background: isSelected ? colors.primary[50] : colors.secondary[700],
                    boxShadow: isSelected ? shadows.neon : undefined,
                    transitionDuration: durations[300],
                  }}
                >
                  <Icon
                    icon={IconComponent}
                    size="sm"
                    color={isSelected ? colors.neutral[0] : colors.secondary[50]}
                  />
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: isSelected ? colors.primary[50] : colors.neutral[300],
                    fontSize: typography.fontSize.sm,
                    letterSpacing: '0.01em',
                  }}
                >
                  {category.label}
                </span>
              </Stack>
            </Card>
          )
        })}
      </div>

      {showSelectedLabel && selected && (
        <Badge
          variant="success"
          style={{
            alignSelf: 'flex-start',
            background: 'rgba(57, 255, 20, 0.12)',
            color: colors.semantic.success,
            borderRadius: borderRadius.full,
            padding: `${spacing[2]} ${spacing[4]}`,
            fontSize: typography.fontSize.xs,
          }}
        >
          Above the Green Line · {VISION_CATEGORIES.find(category => category.key === selected)?.label}
        </Badge>
      )}
    </Stack>
  )
}

export const EXPERIMENTAL_COMPONENTS: ExperimentalComponentDefinition[] = [
  {
    id: 'single-category-selector-experiment',
    name: 'Single Category Selector Experiment',
    description: 'Explores enhanced neon feedback, tighter spacing, and optional status cues for selecting a single life vision category.',
    component: SingleCategorySelectorExperiment,
    status: 'exploratory',
    icon: Sparkles,
    path: '/design-system/experiment/single-category-selector-experiment',
  },
]

const EXPERIMENTAL_COMPONENTS_MAP = new Map(EXPERIMENTAL_COMPONENTS.map(component => [component.id, component]))

export function getExperimentalComponentById(id: string) {
  return EXPERIMENTAL_COMPONENTS_MAP.get(id)
}

export function getExperimentalComponents() {
  return EXPERIMENTAL_COMPONENTS
}

