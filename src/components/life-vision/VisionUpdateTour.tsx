'use client'

import { forwardRef } from 'react'
import {
  ToolWalkthrough,
  type ToolWalkthroughHandle,
} from '@/components/tool-walkthrough/ToolWalkthrough'
import { getToolWalkthrough } from '@/lib/life-activation/walkthroughs'

export const VISION_UPDATE_TOUR_STORAGE_KEY = 'vf-vision-update-tour'

export type VisionUpdateTourStepId = 'chat' | 'draft' | 'proposal' | 'views' | 'commit'

export type VisionUpdateTourHandle = ToolWalkthroughHandle

export function hasSeenVisionUpdateTour(): boolean {
  try {
    return localStorage.getItem(VISION_UPDATE_TOUR_STORAGE_KEY) === 'seen'
  } catch {
    return true
  }
}

export function markVisionUpdateTourSeen(): void {
  try {
    localStorage.setItem(VISION_UPDATE_TOUR_STORAGE_KEY, 'seen')
  } catch {
    /* private mode / blocked storage */
  }
}

interface VisionUpdateTourProps {
  active: boolean
  onClose: () => void
  onStepChange?: (id: VisionUpdateTourStepId | null) => void
}

export const VisionUpdateTour = forwardRef<VisionUpdateTourHandle, VisionUpdateTourProps>(
  function VisionUpdateTour({ active, onClose, onStepChange }, ref) {
    return (
      <ToolWalkthrough
        ref={ref}
        active={active}
        steps={getToolWalkthrough('vision_update').steps}
        onClose={onClose}
        onStepChange={(id) => onStepChange?.((id as VisionUpdateTourStepId | null) ?? null)}
      />
    )
  },
)

VisionUpdateTour.displayName = 'VisionUpdateTour'
