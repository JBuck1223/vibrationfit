'use client'

import React from 'react'
import { useThemeImage } from './ThemeProvider'
import { BACKDROP_SLOT } from '@/lib/app-shell/theme-slots'

/**
 * The fixed full-viewport layer under every screen. It never remounts between
 * routes, so moving from Home into a studio only changes the content column.
 * Cross-fades when the backdrop url changes (theme switch).
 */
export function ThemeBackdrop() {
  const url = useThemeImage(BACKDROP_SLOT)
  const [layers, setLayers] = React.useState<{ key: number; url: string | null }[]>([{ key: 0, url }])

  React.useEffect(() => {
    setLayers((prev) => {
      const last = prev[prev.length - 1]
      if (last?.url === url) return prev
      const next = [...prev, { key: (last?.key ?? 0) + 1, url }]
      return next.slice(-2)
    })
  }, [url])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0b0b0d] to-[#111]" />
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out"
          style={{
            backgroundImage: layer.url ? `url("${layer.url}")` : undefined,
            opacity: layer.url ? 1 : 0,
            filter: 'blur(14px) saturate(110%)',
            transform: 'scale(1.06)',
          }}
          onTransitionEnd={() => {
            setLayers((prev) => (prev.length > 1 && prev[0].key === layer.key ? prev : prev.slice(-1)))
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0" style={{ background: 'var(--theme-tint)' }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
    </div>
  )
}
