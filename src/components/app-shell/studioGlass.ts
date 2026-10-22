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
const PANELS = ['bg-[#101010]', 'bg-[#0c0c0c]', 'bg-[#111111]', 'bg-[#111]', 'bg-[#101010]/90', 'md:!bg-[#101010]']
// Insets inside a panel: a faint lift instead of a darker well.
const INSETS = ['bg-[#0a0a0a]', 'bg-[#131313]', 'bg-[#0c0c0c]/50', 'bg-[#1A1A1A]', '!bg-[#1A1A1A]']
const BORDERS = ['border-[#282828]', 'border-[#252525]', 'border-[#2a2a2a]', 'border-[#333]', 'border-[#1F1F1F]', 'md:!border-[#1F1F1F]', '!border-[#282828]']

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
${sel(['bg-neutral-900/90', 'bg-neutral-900/60', 'bg-neutral-900/50', 'bg-neutral-900'])} { background: rgba(255,255,255,0.06) !important; }
${sel(['border-neutral-600', 'border-neutral-700', 'border-neutral-800', 'border-[#1f1f1f]'])} { border-color: rgba(255,255,255,0.12) !important; }
`
