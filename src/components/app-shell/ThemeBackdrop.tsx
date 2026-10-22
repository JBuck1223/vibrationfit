'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useThemeImage } from './ThemeProvider'
import { BACKDROP_SLOT, type ThemeSlot } from '@/lib/app-shell/theme-slots'
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
 * The fixed full-viewport layer under every screen. Two pictures: the current
 * section's hero, sharp and full-bleed across the top of the viewport, fading
 * into the softly blurred theme backdrop that covers the rest. Neither
 * remounts between routes; each cross-fades when its image changes.
 */
export function ThemeBackdrop() {
  const pathname = usePathname()
  const section = sectionForPath(pathname)
  // Section roots get the big picture; pages inside a studio get a shorter, dimmer band
  // so lists and forms stay legible while the place still looks like the section.
  const atRoot = isSectionRoot(pathname)
  const heroUrl = useThemeImage(`${section.id}.hero` as ThemeSlot)
  const backdropUrl = useThemeImage(BACKDROP_SLOT)
  const [heroLayers, settleHero] = useCrossfade(heroUrl)
  const [backLayers, settleBack] = useCrossfade(backdropUrl)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0d] to-[#111]" />

      {/* Soft backdrop under everything */}
      {backLayers.map((layer) => (
        <div
          key={`b${layer.key}`}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out"
          style={{
            backgroundImage: layer.url ? `url("${layer.url}")` : undefined,
            opacity: layer.url ? 0.55 : 0,
            filter: 'blur(18px) saturate(110%)',
            transform: 'scale(1.08)',
          }}
          onTransitionEnd={() => settleBack(layer.key)}
        />
      ))}
      <div className="absolute inset-0 bg-black/45" />

      {/* Sharp section hero across the top, dissolving into the backdrop */}
      {heroLayers.map((layer) => (
        <div
          key={`h${layer.key}`}
          className={`absolute inset-x-0 top-0 bg-cover bg-center transition-[opacity,height] duration-700 ease-out ${atRoot ? 'h-[78vh] lg:h-[72vh]' : 'h-[42vh] lg:h-[40vh]'}`}
          style={{
            backgroundImage: layer.url ? `url("${layer.url}")` : undefined,
            opacity: layer.url ? (atRoot ? 1 : 0.6) : 0,
            maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
          }}
          onTransitionEnd={() => settleHero(layer.key)}
        />
      ))}
      {/* Keep the header legible and give the headline a floor to sit on */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      <div className={`absolute inset-x-0 top-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent ${atRoot ? 'h-[78vh] lg:h-[72vh]' : 'h-[42vh] lg:h-[40vh]'}`} />
      <div className="absolute inset-0" style={{ background: 'var(--theme-tint)' }} />
    </div>
  )
}
