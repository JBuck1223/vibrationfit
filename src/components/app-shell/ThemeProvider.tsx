'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ResolvedTheme } from '@/lib/app-shell/theme-types'
import { BACKDROP_SLOT, CARD_SLOTS, type ThemeSlot } from '@/lib/app-shell/theme-slots'
import { TrackArtworkFallbackProvider, type TrackArtworkFallback } from '@/lib/design-system/components/media/global-audio/TrackArtwork'
import { getOverlay } from '@/lib/app-shell/overlays'
import { LIGHT_MODE_CSS } from './lightMode'
import { SHELL_DARK_CSS, SHELL_POPOVER_CSS, STUDIO_GLASS_CSS } from './studioGlass'

interface ThemeContextValue {
  theme: ResolvedTheme | null
  loading: boolean
  /** The url for a slot, or null when the theme has nothing for it (even after fallbacks). */
  imageFor: (slot: ThemeSlot) => string | null
  refresh: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'vf.theme.v1'

/** The studio image that stands for a kind of audio, by the player's icon key. */
const ICON_KEY_SLOT: Record<string, ThemeSlot> = {
  life_vision: 'studio.life-vision',
  vision: 'studio.life-vision',
  stories: 'studio.story',
  story: 'studio.story',
  music: 'studio.songs',
  song: 'studio.songs',
  meditation: 'studio.meditations',
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function readCached(): ResolvedTheme | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ResolvedTheme) : null
  } catch {
    return null
  }
}

function writeCached(theme: ResolvedTheme | null) {
  try {
    if (theme) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode or blocked storage: the fetch still painted the shell.
  }
}

/**
 * Loads the member's theme once per session and exposes it to the shell.
 * Also writes `--theme-backdrop` and `--theme-tint` on <html> so pure-CSS
 * surfaces can use the backdrop without a hook.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ResolvedTheme | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/app-shell/theme', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as ResolvedTheme | { theme: null }
      const next = data.theme ? (data as ResolvedTheme) : null
      setTheme(next)
      writeCached(next)
    } catch {
      // Keep whatever we had (cached or null). The shell renders without imagery.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = readCached()
    if (cached) {
      setTheme(cached)
      setLoading(false)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const backdrop = theme?.images[BACKDROP_SLOT]
    root.style.setProperty('--theme-backdrop', backdrop ? `url("${backdrop}")` : 'none')
    // Light themes are the plain light mode: no overlay over a photo.
    const mode = theme?.theme.mode === 'light' ? 'light' : 'dark'
    root.dataset.shellMode = mode
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f4f1f8' : '#1a1426')
    // A member's chosen overlay wins; otherwise the theme's own tint (if any).
    const chosen = theme?.overlayId ? getOverlay(theme.overlayId) : null
    const tint =
      mode === 'light'
        ? 'rgba(0, 0, 0, 0)'
        : theme?.overlayId
          ? chosen?.css ?? 'rgba(0, 0, 0, 0)'
          : theme?.theme.tint ?? 'rgba(0, 0, 0, 0)'
    root.style.setProperty('--theme-tint', tint)
    return () => {
      root.style.removeProperty('--theme-backdrop')
      root.style.removeProperty('--theme-tint')
      delete root.dataset.shellMode
    }
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      loading,
      imageFor: (slot) => theme?.images[slot] ?? null,
      refresh: load,
    }),
    [theme, loading],
  )

  // Audio with no artwork of its own shows theme imagery, like the audio cards.
  const trackArtworkFallback = useMemo<TrackArtworkFallback | null>(() => {
    if (!theme) return null
    return (iconKey, track) => {
      const studio = iconKey ? ICON_KEY_SLOT[iconKey] : undefined
      if (studio && theme.images[studio]) return theme.images[studio]
      const cards = CARD_SLOTS.map((slot) => theme.images[slot]).filter((u): u is string => !!u)
      if (cards.length === 0) return null
      return cards[hashString(iconKey || track.id || track.title) % cards.length]
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={value}>
      <TrackArtworkFallbackProvider value={trackArtworkFallback}>
      {/* Scoped to html[data-shell-mode="light"]; inert for dark themes. */}
      <style dangerouslySetInnerHTML={{ __html: STUDIO_GLASS_CSS + SHELL_DARK_CSS + SHELL_POPOVER_CSS + LIGHT_MODE_CSS }} />
      {children}
      </TrackArtworkFallbackProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Outside the shell (old layout, public pages): behave as "no theme".
    return { theme: null, loading: false, imageFor: () => null, refresh: async () => {} }
  }
  return ctx
}

export function useThemeImage(slot: ThemeSlot): string | null {
  return useTheme().imageFor(slot)
}
