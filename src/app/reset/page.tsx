'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Spinner, Stack } from '@/lib/design-system/components'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'
import {
  Flame, CheckCircle2, ArrowRight, User, Sparkles, Image as ImageIcon,
  Headphones, FolderKanban, CalendarCheck, Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useResetStudio } from '@/components/reset-studio'
import { PhoenixModal } from '@/components/reset-studio/PhoenixModal'
import { RESET_ITEMS } from '@/lib/reset/reset-config'

const ICONS: Record<string, LucideIcon> = {
  User, Sparkles, Image: ImageIcon, Headphones, FolderKanban, CalendarCheck,
}

function hrefFor(type: string): string {
  return RESET_ITEMS.find((i) => i.type === type)?.href ?? '/'
}
function iconFor(type: string): LucideIcon {
  const name = RESET_ITEMS.find((i) => i.type === type)?.icon ?? 'Sparkles'
  return ICONS[name] ?? Sparkles
}

export default function ResetViewPage() {
  const router = useRouter()
  const {
    reset, items, progress, loading, focusFilter, verify, startReset, completeReset,
  } = useResetStudio()
  const [showPhoenix, setShowPhoenix] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleComplete = async () => {
    setCompleting(true)
    const ok = await completeReset()
    setCompleting(false)
    if (ok) setShowPhoenix(true)
  }

  const handleStart = async () => {
    setStarting(true)
    await startReset()
    setStarting(false)
  }

  const handleStartAnother = async () => {
    setShowPhoenix(false)
    await startReset()
    router.push('/reset/update')
  }

  if (loading && !reset) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // No active reset -> intro
  if (!reset) {
    return (
      <Container size="md">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-energy-500/20 to-accent-500/20 border border-accent-500/40">
            <Flame className="w-8 h-8 text-energy-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Hit the Reset Button</h1>
          <p className="text-neutral-300 mb-8 max-w-lg mx-auto">
            A free, repeatable program to recommit to the life you choose. Refresh your profile,
            life vision, vision board, audio, projects, and habits - then rise, phoenix-style,
            into a brand new beginning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" onClick={handleStart} loading={starting}>
              <Flame className="w-5 h-5 mr-2" />
              Begin Your Reset
            </Button>
            <Link href="/reset/update">
              <Button variant="ghost" size="lg">
                <Settings2 className="w-5 h-5 mr-2" />
                Customize First
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    )
  }

  const selectedItems = items.filter((i) => i.is_selected)
  const completedItems = selectedItems.filter((i) => i.detection.completed)

  // Activity feed entries, filtered by focus area when one is selected.
  const feed = completedItems
    .filter((i) => focusFilter === 'all' || i.detection.categories.includes(focusFilter))
    .flatMap((i) =>
      (i.detection.categories.length > 0 ? i.detection.categories : ['_'])
        .filter((c) => focusFilter === 'all' || c === focusFilter)
        .map((c) => ({
          key: `${i.id}-${c}`,
          label: i.label,
          category: c === '_' ? null : c,
          detail: i.detection.detail,
        }))
    )

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Progress header */}
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <Flame className="w-10 h-10 text-energy-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white mb-1">
                {reset.title || 'Your Reset'}
              </h1>
              <p className="text-sm text-neutral-400 mb-3">
                {progress?.completed ?? 0} of {progress?.total ?? 0} recommitments complete
              </p>
              <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
            </div>
            {progress?.allComplete && reset.status !== 'completed' && (
              <Button variant="primary" onClick={handleComplete} loading={completing}>
                <Flame className="w-4 h-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </Card>

        {/* Item cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedItems.map((item) => {
            const Icon = iconFor(item.item_type)
            const done = item.detection.completed
            return (
              <Card key={item.id} className={`p-5 ${done ? 'border-primary-500/40' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${done ? 'text-primary-400' : 'text-neutral-400'}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                    {done ? (
                      <>
                        <p className="text-xs text-primary-400 mt-0.5">
                          {item.detection.detail || 'Recommitted'}
                          {item.detection.completedAt
                            ? ` · ${new Date(item.detection.completedAt).toLocaleDateString()}`
                            : ''}
                        </p>
                        {item.detection.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.detection.categories.map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-500/15 text-primary-300"
                              >
                                {getVisionCategoryLabel(c as any)}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={hrefFor(item.item_type)}>
                        <button className="mt-2 inline-flex items-center text-xs font-medium text-secondary-400 hover:text-secondary-300">
                          Start
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Activity feed */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            {focusFilter === 'all' ? 'Your Reset Activity' : `Activity in ${getVisionCategoryLabel(focusFilter as any)}`}
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            {focusFilter === 'all'
              ? 'Everything you have recommitted to so far.'
              : 'What you have recommitted to in this focus area.'}
          </p>
          {feed.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nothing here yet. Take an action above to start building your new life.
            </p>
          ) : (
            <div className="space-y-2">
              {feed.map((f) => (
                <div key={f.key} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="text-neutral-200">{f.label}</span>
                  {f.category && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary-500/15 text-secondary-300">
                      {getVisionCategoryLabel(f.category as any)}
                    </span>
                  )}
                  {f.detail && <span className="text-neutral-500 text-xs">· {f.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </Stack>

      <PhoenixModal
        isOpen={showPhoenix}
        onClose={() => setShowPhoenix(false)}
        onStartAnother={handleStartAnother}
      />
    </Container>
  )
}
