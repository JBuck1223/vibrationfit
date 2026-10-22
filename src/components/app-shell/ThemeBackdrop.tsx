'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useThemeImage } from './ThemeProvider'
import type { ThemeSlot } from '@/lib/app-shell/theme-slots'
import { isSectionRoot, sectionForPath } from '@/lib/app-shell/sections'

interface Layer {
  key: number
  url: string | null
}

function useCrossfade(url: string | null): [Layer[], (key: number) => void] {
  const [layers, setLayers] = React.useState<Layer[]>([{ key: 0, url }])
  React.useEffect(() => {
    setLayers((prev) => {
      const last = prev[prev.length - 1]
      if (last?.url === url) return prev
      return [...prev, { key: (last?.key ?? 0) + 1, url }].slice(-2)
    })
  }, [url])
  const settle = (key: number) =>
    setLayers((prev) => (prev.length > 1 && prev[0].key === key ? prev.slice(-1) : prev))
  return [layers, settle]
}

/**
 * The fixed layer under every screen: one picture, the current section's
 * hero, covering the whole viewport edge to edge under a vertical scrim that
 * is light at the top and heavy at the bottom. Pages inside a studio get a
 * darker scrim than section roots. Never remounts between routes; cross-fades
 * when the picture changes.
 */
export function ThemeBackdrop() {
  const pathname = usePathname()
  const section = sectionForPath(pathname)
  const atRoot = isSectionRoot(pathname)
  const url = useThemeImage(`${section.id}.hero` as ThemeSlot)
  const [layers, settle] = useCrossfade(url)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b0b0d]">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out"
          style={{
            backgroundImage: layer.url ? `url("${layer.url}")` : undefined,
            opacity: layer.url ? 1 : 0,
          }}
          onTransitionEnd={() => settle(layer.key)}
        />
      ))}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: atRoot
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.85) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--theme-tint)' }} />
    </div>
  )
}
