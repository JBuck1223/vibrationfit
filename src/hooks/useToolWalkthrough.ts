'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import {
  buildYouAreHereStep,
  composeStudioSteps,
  getToolWalkthrough,
  isTrainingCompletionId,
  type ToolWalkthroughStep,
  type WalkthroughId,
} from '@/lib/life-activation/walkthroughs'

const persistKey = (id: WalkthroughId) => `vf-studio-walkthrough:${id}`

type Persist = {
  stepIndex: number
  here: ToolWalkthroughStep | null
}

function readPersist(id: WalkthroughId): Persist | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(persistKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persist
    if (typeof parsed.stepIndex !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writePersist(id: WalkthroughId, value: Persist | null) {
  if (typeof window === 'undefined') return
  if (!value) {
    sessionStorage.removeItem(persistKey(id))
    return
  }
  sessionStorage.setItem(persistKey(id), JSON.stringify(value))
}

export function useToolWalkthrough(stepId: WalkthroughId) {
  const { progress, completeTrainingStep } = useLifeActivation()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hereStep, setHereStep] = useState<ToolWalkthroughStep | null>(null)
  const catalog = useMemo(() => getToolWalkthrough(stepId), [stepId])
  const alreadyDone = Boolean(progress?.training[stepId])

  useEffect(() => {
    const saved = readPersist(stepId)
    if (!saved) return
    setHereStep(saved.here)
    setStepIndex(saved.stepIndex)
    setActive(true)
  }, [stepId])

  const steps = useMemo(
    () => composeStudioSteps(hereStep, catalog.steps),
    [hereStep, catalog.steps],
  )

  const persist = useCallback(
    (nextActive: boolean, nextIndex: number, nextHere: ToolWalkthroughStep | null) => {
      writePersist(stepId, nextActive ? { stepIndex: nextIndex, here: nextHere } : null)
    },
    [stepId],
  )

  const toggle = useCallback(() => {
    setActive((prev) => {
      if (prev) {
        setHereStep(null)
        setStepIndex(0)
        persist(false, 0, null)
        return false
      }
      const search = new URLSearchParams(window.location.search)
      const here = buildYouAreHereStep(stepId, pathname, search)
      setHereStep(here)
      setStepIndex(0)
      persist(true, 0, here)
      return true
    })
  }, [pathname, persist, stepId])

  const close = useCallback(() => {
    setActive(false)
    setHereStep(null)
    setStepIndex(0)
    persist(false, 0, null)
  }, [persist])

  const complete = useCallback(() => {
    setActive(false)
    setHereStep(null)
    setStepIndex(0)
    persist(false, 0, null)
    if (alreadyDone || !progress || !isTrainingCompletionId(stepId)) return
    void completeTrainingStep(stepId)
  }, [alreadyDone, completeTrainingStep, persist, progress, stepId])

  const goToStep = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, index))
      setStepIndex(next)
      persist(true, next, hereStep)
    },
    [hereStep, persist, steps.length],
  )

  return {
    active,
    toggle,
    close,
    complete,
    steps,
    stepIndex,
    goToStep,
    alreadyDone,
    pending: !alreadyDone,
  }
}

export function useWalkthroughIncomplete(stepId: WalkthroughId) {
  const { progress } = useLifeActivation()
  return !progress?.training[stepId]
}
