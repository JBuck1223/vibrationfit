import { create } from 'zustand'

const STORAGE_KEY = 'vf_pill_collapsed'

export type PillSide = 'left' | 'right'

interface ShellNavState {
  /** Corner the member folded the bottom pill into, or null when expanded. Remembered per device. */
  collapsedSide: PillSide | null
  hydrate: () => void
  setCollapsedSide: (side: PillSide | null) => void
}

export const useShellNavStore = create<ShellNavState>((set) => ({
  collapsedSide: null,
  hydrate: () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      set({ collapsedSide: saved === 'left' || saved === 'right' ? saved : null })
    } catch {
      // Storage blocked; stay expanded.
    }
  },
  setCollapsedSide: (side) => {
    try {
      if (side) window.localStorage.setItem(STORAGE_KEY, side)
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage blocked; the choice lasts for this session only.
    }
    set({ collapsedSide: side })
  },
}))
