/**
 * Studio glass: older studio pages paint their panels with fixed dark colors
 * (#101010, #0c0c0c, #282828 borders...). Inside the app shell, a studio that
 * opts in with data-studio-glass gets those panels as the shell's violet
 * frosted glass instead, without rewriting each page. Injected by AppShell.
 */

const P = '[data-app-shell] [data-studio-glass]'
// Escape every CSS-special character Tailwind class names can hold; one bad
// selector would drop the whole rule.
const esc = (cls: string) => cls.replace(/([:/[\].#!%(),])/g, '\\$1')
const sel = (classes: string[]) => classes.map((c) => `${P} .${esc(c)}`).join(',\n')

// Main panels: the same glass as Home's cards.
const PANELS = ['bg-embedded-panel', 'bg-[#0A0A0A]', 'bg-[#101010]', 'bg-[#0c0c0c]', 'bg-[#111111]', 'bg-[#111]', 'bg-[#101010]/90', 'md:!bg-[#101010]', 'bg-[#161616]', 'bg-[#0D0D0D]']
// Insets inside a panel: a faint lift instead of a darker well.
const INSETS = ['bg-[#0a0a0a]', 'bg-[#131313]', 'bg-[#0c0c0c]/50', 'bg-[#1A1A1A]', 'bg-[#1a1a1a]', '!bg-[#1A1A1A]', 'bg-[#404040]', 'bg-[#1F1F1F]', 'bg-[#1c1c1c]', 'bg-[#141414]']
const BORDERS = ['border-[#1A1A1A]', 'border-[#282828]', 'border-[#252525]', 'border-[#2a2a2a]', 'border-[#333]', 'border-[#1F1F1F]', 'md:!border-[#1F1F1F]', '!border-[#282828]', 'border-[#666666]', 'border-[#555]', 'border-[#404040]', 'border-[#2a2a2a]', 'border-[#2e2e2e]', 'border-[#262626]']

export const STUDIO_GLASS_CSS = `
${sel(PANELS)} {
  background: linear-gradient(180deg, rgba(44,36,60,0.50) 0%, rgba(24,20,34,0.58) 100%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
}
${sel(INSETS)} {
  background: rgba(255,255,255,0.05) !important;
}
${sel(BORDERS)} {
  border-color: rgba(255,255,255,0.12) !important;
}
${P} .${esc('ring-white/[0.08]')} { --tw-ring-color: rgba(255,255,255,0.12); }
/* Sticky save bars inside a card stay solid enough to read over the text. */
${P} .${esc('bg-[#1c1c1c]/95')} { background: rgba(32,26,45,0.94) !important; }
/* Dropdown menus drawn in #1F1F1F float over the page: solid glass, so
   their text reads over whatever is underneath. */
${P} .absolute.${esc('bg-[#1F1F1F]')} {
  background: rgba(28,22,38,0.97) !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important;
}
${P} .${esc('hover:bg-[#2A2A2A]')}:hover, ${P} .${esc('hover:bg-[#333]')}:hover { background: rgba(255,255,255,0.08) !important; }
/* Small empty-state dots. */
${P} .${esc('bg-[#3a3a3a]')} { background: rgba(255,255,255,0.2) !important; }
/* Fades drawn in the old panel color (lyrics scroll edges) blend with the glass. */
${P} { --color-embedded-panel: rgba(32,26,45,0.9); }

/* Old segmented switches (a dark well with a dark selected segment) read as
   the shell's toggles: a rounded pill with the picked option in green. */
${P} .${esc('bg-zinc-950/90')} {
  background: rgba(255,255,255,0.05) !important;
  border-radius: 9999px !important;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15) !important;
}
${P} .${esc('bg-zinc-950/90')} > button { border-radius: 9999px !important; }
${P} .${esc('bg-zinc-900/85')}, ${P} .${esc('bg-[#2d2d2d]')} {
  background: #39FF14 !important;
  color: #000 !important;
  border-radius: 9999px !important;
  box-shadow: none !important;
}
/* The shared Toggle's field style and the household switch. */
${P} .${esc('border-2')}.${esc('bg-[#1A1A1A]')}.${esc('p-0.5')}, ${P} .${esc('bg-[#1F1F1F]')}.rounded-full {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  border-radius: 9999px !important;
}
${P} .${esc('border-2')}.${esc('bg-[#1A1A1A]')}.${esc('p-0.5')} > button { border-radius: 9999px !important; }

/* Small square tags (rounded + border + 10px text) read as soft pills. */
${P} .rounded.${esc('text-[10px]')} {
  border-radius: 9999px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  text-transform: none;
  letter-spacing: normal;
}
${sel(['bg-neutral-900/90', 'bg-neutral-900/60', 'bg-neutral-900/50', 'bg-neutral-900/40', 'bg-neutral-900/35', 'bg-neutral-900/30', 'bg-neutral-900', 'bg-neutral-800', 'bg-neutral-800/50'])} { background: rgba(255,255,255,0.06) !important; }
${sel(['border-neutral-600', 'border-neutral-700', 'border-neutral-800', 'border-[#1f1f1f]'])} { border-color: rgba(255,255,255,0.12) !important; }
`

/**
 * Shared dropdowns and calendars (Select, DatePicker) open in a portal outside
 * the page, so they carry data-shell-popover / data-shell-field in the app
 * shell and get the same violet glass here.
 */
const POP = '[data-shell-popover]'
export const SHELL_POPOVER_CSS = `
${POP} {
  background: rgba(28,22,38,0.97) !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
  border-radius: 20px !important;
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important;
}
${POP} .${esc('bg-[#1F1F1F]')} {
  background: rgba(36,29,50,0.98) !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
}
${POP} .${esc('border-[#333]')}, ${POP} .${esc('border-neutral-800')}, ${POP} .${esc('border-neutral-700')} { border-color: rgba(255,255,255,0.14) !important; }
${POP} .${esc('hover:bg-[#333]')}:hover { background: rgba(255,255,255,0.08) !important; }
${POP} .${esc('bg-primary-500/20')} { background: rgba(57,255,20,0.14) !important; color: #39FF14 !important; }
${POP} button:not(.rounded-full) { border-radius: 10px; }
[data-app-shell] [data-shell-field] {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  border-radius: 9999px !important;
}
`
