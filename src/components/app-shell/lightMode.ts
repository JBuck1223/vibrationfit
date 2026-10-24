/**
 * Light mode for the app shell (the Light theme). The app is built light-on-
 * dark with Tailwind utilities, so rather than touching every component this
 * remaps the colors the shell and studios actually use, scoped to
 * html[data-shell-mode="light"] [data-app-shell]. Injected by ThemeProvider.
 *
 * Ink is a deep violet-black; surfaces are frosted white; the brand green
 * darkens for text so it reads on white, while green buttons stay green.
 */

const P = 'html[data-shell-mode="light"] [data-app-shell]'
const INK = '27,22,38'

const esc = (cls: string) => cls.replace(/([:/[\].#!%(),])/g, '\\$1')
const sel = (classes: string[], suffix = '') => classes.map((c) => `${P} .${esc(c)}${suffix}`).join(',\n')

// White text at an opacity → ink at a slightly stronger opacity (white text
// on dark reads lighter than the same alpha of ink on white).
const whiteText = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]
  .map((a) => `${P} .${esc(`text-white/${a}`)}, ${P} .${esc(`placeholder:text-white/${a}`)}::placeholder { color: rgba(${INK},${Math.min(0.95, a / 100 + 0.12).toFixed(2)}); }`)
  .join('\n')

const surfaceTint = ['[0.04]', '[0.05]', '[0.06]', '[0.07]', '[0.08]', '5', '10', '[0.09]']
  .map((a) => {
    const alpha = a.startsWith('[') ? Number(a.slice(1, -1)) : Number(a) / 100
    return `${P} .${esc(`bg-white/${a}`)}, ${P} .${esc(`hover:bg-white/${a}`)}:hover { background-color: rgba(${INK},${Math.max(0.04, alpha * 0.8).toFixed(3)}); }`
  })
  .join('\n')

export const LIGHT_MODE_CSS = `
html[data-shell-mode="light"], html[data-shell-mode="light"] body { background: #f4f1f8 !important; color: rgb(${INK}); }

${P} {
  --glass-fill: rgba(255,255,255,0.74);
  --glass-fill-strong: rgba(255,255,255,0.86);
  --glass-border: rgba(${INK},0.10);
  --section-accent: #15913a;
  --section-accent-ink: #ffffff;
  --section-accent-soft: rgba(21,145,58,0.12);
  color: rgb(${INK});
}
${P} [data-section='viva'], html[data-shell-mode="light"] [data-app-shell][data-section='viva'] {
  --section-accent: #8a1fd1;
  --section-accent-soft: rgba(138,31,209,0.12);
}

/* Backdrop: a soft lavender-white wash, no photo */
${P} [data-theme-backdrop] { background: linear-gradient(180deg, #f7f4fb 0%, #efeaf6 55%, #e9e3f2 100%) !important; }

/* Glass surfaces */
${P} .glass-panel, ${P} .glass-chrome, ${P} .vf-glass {
  background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.72)) !important;
  border-color: rgba(${INK},0.09) !important;
  box-shadow: 0 8px 28px rgba(60,40,90,0.10) !important;
}
${P} .vf-glass-tint {
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.74)) !important;
  box-shadow: 0 8px 24px rgba(60,40,90,0.10) !important;
}

/* Text */
${sel(['text-white', 'hover:text-white'], '')} { color: rgb(${INK}); }
${P} .${esc('hover:text-white')}:hover { color: rgb(${INK}); }
${whiteText}
${sel(['text-neutral-100', 'text-neutral-200', 'hover:text-neutral-200', 'text-zinc-200', 'hover:text-zinc-200'])} { color: rgba(${INK},0.92); }
${sel(['text-neutral-300', 'hover:text-neutral-300', 'text-zinc-300'])} { color: rgba(${INK},0.82); }
${sel(['text-neutral-400', 'text-zinc-400'])} { color: rgba(${INK},0.68); }
${sel(['text-neutral-500', 'text-zinc-500'])} { color: rgba(${INK},0.58); }
${sel(['text-neutral-600'])} { color: rgba(${INK},0.48); }
${P} .${esc('placeholder:text-neutral-500')}::placeholder { color: rgba(${INK},0.40); }
${sel(['text-[#39FF14]', 'text-primary-400', 'text-primary-500'])} { color: #15913a; }
${sel(['text-[#BF00FF]'])} { color: #8a1fd1; }
${P} [class*="text-shadow"] { text-shadow: none !important; }

/* Surfaces */
${surfaceTint}
${sel(['bg-black', 'bg-neutral-900', 'bg-neutral-950', 'bg-neutral-850', 'bg-[#1F1F1F]', 'bg-zinc-950/90', 'bg-zinc-900/85', 'bg-neutral-900/80', 'bg-neutral-900/60', 'bg-neutral-900/50', 'bg-[#1F1F1F]/50', 'bg-[rgba(28,22,38,0.45)]', 'bg-[rgba(28,22,38,0.97)]', 'bg-[rgba(28,22,38,0.96)]', 'bg-[#141414]', 'bg-[#101010]', 'bg-[#0f0c16]', 'bg-zinc-950', 'bg-neutral-950'])} { background-color: rgba(255,255,255,0.78); }
/* Scrims behind dialogs: a soft ink veil instead of black. */
${sel(['bg-black/40', 'bg-black/50', 'bg-black/55', 'bg-black/60', 'bg-black/80', 'bg-black/95'])} { background-color: rgba(${INK},0.35); }
/* Popovers and floating menus (solid violet glass in dark themes). */
html[data-shell-mode="light"] [data-shell-popover], ${P} [data-shell-menu] { background: rgba(255,255,255,0.96) !important; border-color: rgba(${INK},0.12) !important; box-shadow: 0 16px 40px rgba(60,40,90,0.16) !important; }
/* Media viewers keep white controls over the picture. */
${P} [data-shell-mode-skip] .text-white, ${P} [data-shell-mode-skip] .text-white * { color: #fff !important; }
${sel(['bg-neutral-800', 'bg-neutral-800/80', 'bg-neutral-800/50', 'bg-neutral-800/30'])} { background-color: rgba(${INK},0.05); }
${sel(['bg-neutral-700', 'bg-neutral-600'])} { background-color: rgba(${INK},0.10); }
${P} .${esc('hover:bg-neutral-800')}:hover, ${P} .${esc('hover:bg-neutral-900')}:hover, ${P} .${esc('hover:bg-neutral-800/50')}:hover { background-color: rgba(${INK},0.06); }
${P} .${esc('hover:bg-neutral-700')}:hover { background-color: rgba(${INK},0.10); }

/* Borders and rings */
${sel(['border-white/10', 'border-white/[0.12]', 'border-white/[0.14]', 'border-white/[0.16]', 'border-white/15', 'border-white/20', 'border-neutral-900', 'border-neutral-800', 'border-neutral-800/60', 'border-neutral-700', 'border-neutral-700/50', 'border-neutral-600', 'border-neutral-500', 'border-[#333]', 'border-[#333]/50', 'border-[#1F1F1F]'])} { border-color: rgba(${INK},0.12); }
${P} .${esc('hover:border-white/25')}:hover, ${P} .${esc('hover:border-white/40')}:hover, ${P} .${esc('hover:border-neutral-600')}:hover, ${P} .${esc('hover:border-neutral-500')}:hover { border-color: rgba(${INK},0.28); }
${sel(['ring-white/[0.08]', 'ring-white/10', 'ring-white/20'])} { --tw-ring-color: rgba(${INK},0.10); }
`
