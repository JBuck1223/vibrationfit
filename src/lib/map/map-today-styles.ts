import { colors } from '@/lib/design-system/tokens'

/** Brand primary (Electric Lime) from design tokens — single source for MAP "today" accents */
const primaryHex = colors.primary[500]

function rgbFromHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const { r, g, b } = rgbFromHex(primaryHex)
const rgb = `${r}, ${g}, ${b}`

/** Inline-friendly rgba() strings derived from `colors.primary[500]` */
export const mapTodayStyles = {
  primaryHex,
  rgb,
  /** Day view: compact chip */
  dayChipBg: `rgba(${rgb}, 0.1)`,
  dayChipRing: `rgba(${rgb}, 0.42)`,
  dayChipShadow: `0 0 22px rgba(${rgb}, 0.11)`,
  /** Week: column header + band */
  weekHeaderBg: `rgba(${rgb}, 0.08)`,
  weekHeaderOutline: `rgba(${rgb}, 0.38)`,
  weekColBg: `rgba(${rgb}, 0.045)`,
  weekCellRing: `rgba(${rgb}, 0.5)`,
  weekCellShadow: `0 0 12px rgba(${rgb}, 0.1)`,
  weekEmptyRing: `rgba(${rgb}, 0.35)`,
  weekEmptyBg: `rgba(${rgb}, 0.04)`,
  /** Month: calendar cells */
  monthTodayBg: `rgba(${rgb}, 0.1)`,
  monthTodayRing: `rgba(${rgb}, 0.48)`,
  monthTodayShadow: `0 0 14px rgba(${rgb}, 0.1)`,
  monthSelectedBg: `rgba(${rgb}, 0.13)`,
  monthSelectedRing: `rgba(${rgb}, 0.55)`,
  monthSelectedShadow: `0 0 18px rgba(${rgb}, 0.14)`,
  /** Aligned commitment cell "yes" fill (brand primary) */
  commitmentYesBg: `rgba(${rgb}, 0.16)`,
} as const
