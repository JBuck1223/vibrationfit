'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { ToolWalkthrough } from './ToolWalkthrough'
import { WalkthroughToggle } from './WalkthroughToggle'
import { useToolWalkthrough } from '@/hooks/useToolWalkthrough'
import type { WalkthroughId } from '@/lib/life-activation/walkthroughs'

interface WalkthroughChromeValue {
  active: boolean
  onToggle: () => void
  pending: boolean
  available: boolean
}

const UNAVAILABLE: WalkthroughChromeValue = {
  active: false,
  onToggle: () => {},
  pending: false,
  available: false,
}

const WalkthroughChromeContext = createContext<WalkthroughChromeValue | null>(null)

export function useWalkthroughChrome() {
  return useContext(WalkthroughChromeContext)
}

export function useAreaBarWalkthrough() {
  const chrome = useWalkthroughChrome()
  if (!chrome?.available) return undefined
  return (
    <WalkthroughToggle
      active={chrome.active}
      onToggle={chrome.onToggle}
      pending={chrome.pending}
    />
  )
}

export function ToolWalkthroughHost({
  stepId,
  children,
}: {
  stepId: WalkthroughId
  children: ReactNode
}) {
  const { active, toggle, close, complete, steps, stepIndex, goToStep, pending } = useToolWalkthrough(stepId)

  return (
    <WalkthroughChromeContext.Provider
      value={{ active, onToggle: toggle, pending, available: steps.length > 0 }}
    >
      {children}
      {steps.length > 0 && (
        <ToolWalkthrough
          active={active}
          steps={steps}
          stepIndex={stepIndex}
          onStepIndexChange={goToStep}
          onClose={close}
          onComplete={complete}
        />
      )}
    </WalkthroughChromeContext.Provider>
  )
}

export function UnavailableWalkthroughHost({ children }: { children: ReactNode }) {
  return (
    <WalkthroughChromeContext.Provider value={UNAVAILABLE}>
      {children}
    </WalkthroughChromeContext.Provider>
  )
}
