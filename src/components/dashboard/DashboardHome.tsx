'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Check, LayoutGrid, Plus, Settings2 } from 'lucide-react'
import { Button, Container, Modal, Spinner, Stack } from '@/lib/design-system/components'
import AnnualUpgradeBanner from '@/components/billing/AnnualUpgradeBanner'
import { UnlockCelebrationModal } from '@/components/UnlockCelebrationModal'
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import {
  consumeBeginComplete,
  hasPendingBeginComplete,
  markBeginCelebrated,
} from '@/lib/life-activation/celebration'
import { WIDGET_META_BY_ID, type WidgetId, type WidgetMeta } from '@/lib/dashboard/widgets/registry'
import { DashboardProvider, type DashboardServerContext } from './DashboardContext'
import { DashboardGrid } from './DashboardGrid'
import { AddWidgetsModal } from './AddWidgetsModal'
import { WIDGET_COMPONENTS } from './widgets/registry'

interface DashboardHomeProps {
  server: DashboardServerContext
  annualUpgradeOffer?: { planType: 'solo' | 'household'; trialEnd: string | null } | null
}

function greetingFor(date: Date) {
  const h = date.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fireConfetti() {
  const colors = ['#39FF14', '#00FFFF', '#BF00FF', '#FFFF00']
  const end = Date.now() + 2500
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors })
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function DashboardHome({ server, annualUpgradeOffer = null }: DashboardHomeProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { layout, isLoading, reorder, setVisible, setSize, reset } = useDashboardLayout()
  const { progress } = useLifeActivation()

  const [customizing, setCustomizing] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // One-time reveal after the /begin flow, plus the legacy ?unlocked=true celebration.
  useEffect(() => {
    const welcome = searchParams.get('welcome') === '1' || hasPendingBeginComplete()
    const unlocked = searchParams.get('unlocked') === 'true'
    if (welcome) {
      setShowWelcome(true)
      fireConfetti()
      consumeBeginComplete()
      markBeginCelebrated()
    } else if (unlocked) {
      setShowUnlock(true)
    }
    if (welcome || unlocked) {
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  const isAvailable = useCallback(
    (meta: WidgetMeta) => {
      switch (meta.availability) {
        case 'training-open':
          return Boolean(progress && !progress.training_completed_at && !progress.training_dismissed_at)
        case 'calibration-call':
          return Boolean(server.calibrationCall?.show && server.calibrationCall.session)
        case 'intensive-graduate':
          return Boolean(server.graduateChecklist?.isGraduate && server.graduateChecklist.progress)
        default:
          return true
      }
    },
    [progress, server.calibrationCall, server.graduateChecklist],
  )

  const available = useMemo(
    () => layout.widgets.filter((w) => isAvailable(WIDGET_META_BY_ID[w.id])),
    [layout.widgets, isAvailable],
  )
  const visible = useMemo(() => available.filter((w) => w.visible), [available])
  const hiddenIds = useMemo(() => available.filter((w) => !w.visible).map((w) => w.id), [available])

  const handleAdd = (id: WidgetId) => setVisible(id, true)

  const greeting = mounted ? greetingFor(new Date()) : 'Welcome'
  const dateLabel = mounted
    ? new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: server.userTimezone ?? undefined,
      })
    : ''

  return (
    <DashboardProvider server={server} customizing={customizing}>
      <UnlockCelebrationModal isOpen={showUnlock} onClose={() => setShowUnlock(false)} />

      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        size="sm"
        variant="hero"
        showCloseButton={false}
        footer={
          <Button variant="primary" className="w-full justify-center" onClick={() => setShowWelcome(false)}>
            Let&apos;s go
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
            <LayoutGrid className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-semibold text-white">This is your dashboard</h2>
          <p className="text-sm leading-relaxed text-neutral-300">
            Everything you practice lives here: today&apos;s MAP, your audios, your journal, your tribe.
            Press <span className="font-medium text-white">Customize</span> any time to move things around
            or add widgets.
          </p>
        </div>
      </Modal>

      <Container size="xl">
        <Stack gap="lg">
          {annualUpgradeOffer ? (
            <AnnualUpgradeBanner planType={annualUpgradeOffer.planType} trialEnd={annualUpgradeOffer.trialEnd} />
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-white md:text-2xl">
                {greeting}
                {server.firstName ? `, ${server.firstName}` : ''}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-400">{dateLabel || '\u00A0'}</p>
            </div>
            <div className="flex items-center gap-2">
              {customizing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add widgets
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setCustomizing(false)}>
                    <Check className="mr-1.5 h-4 w-4" />
                    Done
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setCustomizing(true)}>
                  <Settings2 className="mr-1.5 h-4 w-4" />
                  Customize
                </Button>
              )}
            </div>
          </div>

          {customizing ? (
            <p className="-mt-2 text-xs text-neutral-500">
              Drag a widget by its handle to reorder. Use the width stepper to make it narrower or wider, or hide it.
            </p>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#333] p-10 text-center">
              <p className="text-sm text-neutral-300">Your dashboard is empty.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setCustomizing(true)
                  setAddOpen(true)
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add widgets
              </Button>
            </div>
          ) : (
            <DashboardGrid
              placements={visible}
              components={WIDGET_COMPONENTS}
              customizing={customizing}
              onReorder={reorder}
              onHide={(id) => setVisible(id, false)}
              onResize={setSize}
            />
          )}
        </Stack>
      </Container>

      <AddWidgetsModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        hiddenIds={hiddenIds}
        onAdd={handleAdd}
        onReset={reset}
      />
    </DashboardProvider>
  )
}
