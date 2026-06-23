'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Spinner, Stack } from '@/lib/design-system/components'
import {
  Flame, CheckCircle2, User, Sparkles, Image as ImageIcon,
  Headphones, FolderKanban, CalendarCheck, Settings2, ChevronRight,
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

function descFor(type: string): string {
  return RESET_ITEMS.find((i) => i.type === type)?.description ?? ''
}

export default function ResetViewPage() {
  const router = useRouter()
  const {
    reset, items, progress, loading, verify, startReset, completeReset,
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
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!reset) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <Stack gap="md">
          <Card
            variant="glass"
            className="relative overflow-hidden border border-white/[0.06] p-5 shadow-none sm:p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFFF00]/[0.03] via-transparent to-[#FF6600]/[0.03] pointer-events-none" />
            <div className="relative flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFFF00]/20 to-[#FF6600]/20 border border-[#FFFF00]/30">
                <Flame className="h-8 w-8 text-[#FFFF00]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white sm:text-2xl">Hit the Reset Button</h1>
                <p className="mt-1.5 text-sm text-neutral-400 max-w-md sm:max-w-none">
                  A free, repeatable program to recommit to the life you choose. Refresh your
                  profile, life vision, vision board, audio, projects, and habits — then rise,
                  phoenix-style, into a brand new beginning.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="group block min-w-0 touch-manipulation text-left"
            >
              <Card
                variant="glass"
                className="flex min-h-[5.5rem] w-full items-start gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 hover:border-[#39FF14]/30 hover:bg-[#39FF14]/[0.04] active:scale-[0.99]"
              >
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
                  <Flame className="h-5 w-5 text-[#39FF14]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">
                    {starting ? 'Starting...' : 'Begin Your Reset'}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500">
                    Start immediately with default recommitments
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>

            <button
              type="button"
              onClick={() => router.push('/reset/update')}
              className="group block min-w-0 touch-manipulation text-left"
            >
              <Card
                variant="glass"
                className="flex min-h-[5.5rem] w-full items-start gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 hover:border-[#BF00FF]/30 hover:bg-[#BF00FF]/[0.04] active:scale-[0.99]"
              >
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#BF00FF]/15">
                  <Settings2 className="h-5 w-5 text-[#BF00FF]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-white">Customize First</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500">
                    Choose which areas to recommit and set focus categories
                  </p>
                </div>
                <ChevronRight
                  className="mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                  aria-hidden
                />
              </Card>
            </button>
          </div>
        </Stack>
      </Container>
    )
  }

  const selectedItems = items.filter((i) => i.is_selected)

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        {/* Progress header */}
        <Card
          variant="glass"
          className="relative overflow-hidden border border-white/[0.06] p-4 shadow-none sm:p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/[0.02] to-[#00FFFF]/[0.02] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFFF00]/20 to-[#FF6600]/20 border border-[#FFFF00]/20">
              <Flame className="h-7 w-7 text-[#FFFF00]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-lg font-bold text-white truncate">
                  {reset.title || 'Your Reset'}
                </h1>
                {progress?.allComplete && reset.status !== 'completed' && (
                  <Button variant="primary" size="sm" onClick={handleComplete} loading={completing}>
                    <Flame className="w-3.5 h-3.5 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 mb-2.5">
                {progress?.completed ?? 0} of {progress?.total ?? 0} recommitments complete
              </p>
              <div className="h-2 rounded-full bg-neutral-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#39FF14] to-[#00FFFF] transition-all duration-500"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* To-do checklist */}
        <Card
          variant="glass"
          className="border border-white/[0.06] p-3 shadow-none sm:p-4"
        >
          <div className="flex flex-col">
            {selectedItems.map((item) => {
              const Icon = iconFor(item.item_type)
              const done = item.detection.completed || item.status === 'completed'
              const description = descFor(item.item_type)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(hrefFor(item.item_type))}
                  className="group flex w-full items-center gap-3.5 px-2 py-3 text-left transition-colors duration-150 touch-manipulation rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05]"
                >
                  {/* Status indicator */}
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? 'border-[#39FF14] bg-[#39FF14]/15'
                      : 'border-neutral-600'
                  }`}>
                    {done && <CheckCircle2 className="h-4 w-4 text-[#39FF14]" />}
                  </div>

                  {/* Icon */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? 'opacity-50' : ''}`}>
                    <Icon className={`h-4 w-4 ${done ? 'text-neutral-500' : 'text-neutral-400'}`} aria-hidden />
                  </div>

                  {/* Label + subtext */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-medium leading-snug ${done ? 'text-neutral-500 line-through decoration-neutral-600' : 'text-white'}`}>
                      {item.label}
                    </h3>
                    <p className={`mt-0.5 text-xs leading-snug ${done ? 'text-[#39FF14]/60' : 'text-neutral-500'}`}>
                      {done && item.detection.detail ? item.detection.detail : description}
                    </p>
                  </div>

                  {/* Right indicator */}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
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
