'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Container, Card, Button, Spinner, Stack } from '@/lib/design-system/components'
import { CategoryGrid } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  Flame, User, Sparkles, Image as ImageIcon, Headphones, FolderKanban, CalendarCheck, Eye, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useResetStudio } from '@/components/reset-studio'
import { RESET_ITEMS, type ResetItemType } from '@/lib/reset/reset-config'

const ICONS: Record<string, LucideIcon> = {
  User, Sparkles, Image: ImageIcon, Headphones, FolderKanban, CalendarCheck,
}

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  (c) => c.key !== 'forward' && c.key !== 'conclusion'
)

export default function ResetUpdatePage() {
  const { reset, items, loading, startReset, toggleItem, updateFocus } = useResetStudio()

  // Local state for the pre-start (no active reset) flow.
  const [localSelected, setLocalSelected] = useState<ResetItemType[]>(
    RESET_ITEMS.filter((i) => i.defaultSelected).map((i) => i.type)
  )
  const [focus, setFocus] = useState<string[]>([])
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (reset) setFocus(reset.focus_categories || [])
  }, [reset])

  const isSelected = (type: ResetItemType): boolean => {
    if (reset) return items.find((i) => i.item_type === type)?.is_selected ?? false
    return localSelected.includes(type)
  }

  const handleToggleItem = async (type: ResetItemType) => {
    const next = !isSelected(type)
    if (reset) {
      await toggleItem(type, next)
    } else {
      setLocalSelected((prev) => (next ? [...prev, type] : prev.filter((t) => t !== type)))
    }
  }

  const handleToggleFocus = async (key: string) => {
    const next = focus.includes(key) ? focus.filter((k) => k !== key) : [...focus, key]
    setFocus(next)
    if (reset) await updateFocus(next)
  }

  const handleBegin = async () => {
    setStarting(true)
    await startReset({ item_types: localSelected, focus_categories: focus })
    setStarting(false)
  }

  if (loading && !reset) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-1">What to recommit to</h2>
          <p className="text-xs text-neutral-500 mb-4">
            Choose the pillars to include. Every item you select must be recommitted to reach Phoenix.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RESET_ITEMS.map((cfg) => {
              const Icon = ICONS[cfg.icon] ?? Sparkles
              const on = isSelected(cfg.type)
              return (
                <button
                  key={cfg.type}
                  type="button"
                  onClick={() => handleToggleItem(cfg.type)}
                  className={`flex items-start gap-3 text-left rounded-xl border p-4 transition-colors ${
                    on
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${on ? 'text-primary-400' : 'text-neutral-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{cfg.label}</span>
                      {on && <Check className="w-4 h-4 text-primary-400" />}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{cfg.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <CategoryGrid
            title="Focus Areas"
            categories={LIFE_CATEGORIES}
            selectedCategories={focus}
            onCategoryClick={handleToggleFocus}
            pillLabel="Focus Areas"
            lifeVisionCategoryStrip
            desktopColumnCount={6}
          />
          <p className="text-xs text-neutral-500 mt-3">
            Pick the life categories you want to track. Leave empty to follow every area.
          </p>
        </Card>

        <div className="flex justify-end gap-3">
          {reset ? (
            <Link href="/reset">
              <Button variant="primary">
                <Eye className="w-4 h-4 mr-1" />
                View Dashboard
              </Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={handleBegin} loading={starting} disabled={localSelected.length === 0}>
              <Flame className="w-4 h-4 mr-1" />
              Begin Your Reset
            </Button>
          )}
        </div>
      </Stack>
    </Container>
  )
}
