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
      // No picture (e.g. the Dark theme): drop the old one outright rather than
      // waiting for a fade that never fires.
      if (!url) return [{ key: (last?.key ?? 0) + 1, url: null }]
      return [...prev, { key: (last?.key ?? 0) + 1, url }].slice(-2)
    })
  }, [url])
  // Once a newer layer has faded in, everything under it can go.
  const settle = (key: number) => setLayers((prev) => prev.filter((l) => l.key >= key))
  return [layers, settle]
}

const SHARP_MASK = 'linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.6) 72%, transparent 92%)'

/**
 * The fixed layer under every screen, built from ONE picture (the section's
 * hero) shown twice: a heavily blurred, slightly dimmed copy fills the whole
 * viewport like soft bokeh, and the sharp copy sits on top across the upper
 * part of the screen, dissolving into the blur. Because both are the same
 * image the colors carry straight down the page. Pages inside a studio show
 * less of the sharp copy and a darker wash so content stays legible.
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
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: layer.url ? 1 : 0 }}
          onTransitionEnd={() => settle(layer.key)}
        >
          {layer.url && (
            <>
              {/* Soft bokeh: the same picture, blurred, filling the screen */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url("${layer.url}")`,
                  filter: 'blur(14px) saturate(125%) brightness(0.75)',
                  transform: 'scale(1.06)',
                }}
              />
              {/* Sharp picture across the top, dissolving into the blur */}
              <div
                className="absolute inset-x-0 top-0 bg-cover bg-top bg-no-repeat transition-[height,opacity] duration-500"
                style={{
                  backgroundImage: `url("${layer.url}")`,
                  height: atRoot ? '90vh' : '55vh',
                  opacity: atRoot ? 1 : 0.55,
                  maskImage: SHARP_MASK,
                  WebkitMaskImage: SHARP_MASK,
                }}
              />
            </>
          )}
        </div>
      ))}
      {/* Wash: keep the header readable, settle the lower page */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: atRoot
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 18%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.45) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--theme-tint)' }} />
    </div>
  )
}
