'use client'

import React from 'react'
import Link from 'next/link'
import { Check, ChevronDown, MoreHorizontal, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AreaBarContextNavItem, AreaBarVersionSelector } from '@/lib/design-system/components'
import { StudioToggle, type StudioToggleOption } from './StudioToggle'
import { ShellWalkthroughButton } from './ShellWalkthroughButton'

const PILL = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors'
const PILL_ON = 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]'
const PILL_OFF = 'border-white/15 bg-white/[0.05] text-white/85 hover:text-white'
const MENU = 'vf-glass absolute top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/[0.14] bg-[rgba(28,22,38,0.96)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl'

/** Closes a popover on an outside tap or Escape. */
function useDismiss(open: boolean, setOpen: (o: boolean) => void) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, setOpen])
  return ref
}

/** A studio's version picker (Life Vision versions, audio sets...) as a glass dropdown. */
function ShellVersionSelect({ selector }: { selector: AreaBarVersionSelector }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [menuLeft, setMenuLeft] = React.useState(0)
  const ref = useDismiss(open, setOpen)
  // Center the menu under the picker but keep it inside the screen edges.
  React.useLayoutEffect(() => {
    if (!open || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    const width = Math.min(window.innerWidth - 32, 360)
    const left = Math.max(16, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - 16 - width))
    setMenuLeft(left - box.left)
  }, [open, ref])
  const selected = selector.options.find((o) => o.id === selector.selectedId) ?? selector.options[0]
  const Icon = selector.icon
  const q = query.trim().toLowerCase()
  const options = q ? selector.options.filter((o) => `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(q)) : selector.options
  let lastGroup: string | undefined

  return (
    <div ref={ref} className="relative" data-tour={selector.dataTour}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={selected?.label}
        className={cn(PILL, PILL_OFF, 'max-w-[min(calc(100vw-2rem),360px)]')}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#39FF14]" /> : null}
        <span className="truncate">{selected?.label ?? selector.label}</span>
        {selected?.badge ? (
          <span
            className={cn(
              'rounded-full px-1.5 py-px text-[10px] font-semibold',
              selected.badgeVariant === 'draft' ? 'bg-[rgba(255,176,32,0.18)] text-[#FFB020]' : 'bg-[rgba(57,255,20,0.16)] text-[#39FF14]',
            )}
          >
            {selected.badge}
          </span>
        ) : null}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/60 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="listbox" aria-label={selector.label} className={cn(MENU, 'w-[min(calc(100vw-2rem),360px)]')} style={{ left: menuLeft }}>
          {selector.searchable && selector.options.length > 6 ? (
            <div className="mb-1 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-white/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label={`Search ${selector.label.toLowerCase()}`}
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
          ) : null}
          {options.length === 0 ? <p className="px-3 py-2 text-sm text-white/50">Nothing matches</p> : null}
          {options.map((o) => {
            const header = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group
            const OptionIcon = o.icon
            const isSelected = o.id === selector.selectedId
            return (
              <React.Fragment key={o.id}>
                {header ? <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-white/45">{header}</p> : null}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setOpen(false)
                    selector.onSelect(o.id)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                    isSelected ? 'bg-[rgba(57,255,20,0.10)] text-white' : 'text-white/85 hover:bg-white/[0.06]',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-1.5">
                      {/* Long names (story titles) wrap instead of cutting off. */}
                      <span className="line-clamp-2 break-words">{o.label}</span>
                      {typeof o.count === 'number' ? <span className="text-xs text-white/40">{o.count}</span> : null}
                      {OptionIcon ? <OptionIcon className="h-3.5 w-3.5 shrink-0 text-white/50" /> : null}
                      {o.badge ? (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-px text-[10px] font-semibold',
                            o.badgeVariant === 'draft' ? 'bg-[rgba(255,176,32,0.18)] text-[#FFB020]' : 'bg-[rgba(57,255,20,0.16)] text-[#39FF14]',
                          )}
                        >
                          {o.badge}
                        </span>
                      ) : null}
                    </span>
                    {o.sublabel ? <span className="block truncate text-xs text-white/45">{o.sublabel}</span> : null}
                  </span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#39FF14]" /> : null}
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NavPill({ item, className }: { item: AreaBarContextNavItem; className?: string }) {
  const Icon = item.icon
  const body = (
    <>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {item.label}
    </>
  )
  const cls = cn(PILL, item.isActive ? PILL_ON : PILL_OFF, className)
  if (item.path && !item.onClick) {
    return (
      <Link href={item.path} className={cls} aria-current={item.isActive ? 'page' : undefined} data-tour={item.dataTour}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={item.onClick} className={cls} aria-pressed={item.isActive} data-tour={item.dataTour}>
      {body}
    </button>
  )
}

/** Actions that aren't a place to be (Convert, Merge, Download PDF...) behind one More button. */
function ActionsMenu({ items }: { items: AreaBarContextNavItem[] }) {
  const [open, setOpen] = React.useState(false)
  const ref = useDismiss(open, setOpen)
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className={cn(PILL, open ? PILL_ON : PILL_OFF)}>
        <MoreHorizontal className="h-4 w-4" />
        More
      </button>
      {open && (
        <div role="menu" className={cn(MENU, 'right-0 w-[260px] md:left-1/2 md:right-auto md:-translate-x-1/2')}>
          {items.map((item) => {
            const Icon = item.icon
            const inner = (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/85">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span className="text-sm text-white">{item.label}</span>
              </>
            )
            const cls = 'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.06]'
            return item.path && !item.onClick ? (
              <Link key={item.label} href={item.path} role="menuitem" className={cls} data-tour={item.dataTour} onClick={() => setOpen(false)}>
                {inner}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={cls}
                data-tour={item.dataTour}
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
              >
                {inner}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * A studio's header in the app shell, built from the same pieces as its old
 * area bar: a centered two-way toggle, then one row with the version pickers,
 * the mode pills (Edit with VIVA / Start Fresh...), and one-off actions
 * gathered under More.
 */
export function ShellStudioBar({
  label,
  toggle,
  contextNav = [],
  subNav = [],
  versionSelectors = [],
  walkthrough,
  className,
}: {
  label: string
  toggle: StudioToggleOption[]
  contextNav?: AreaBarContextNavItem[]
  subNav?: AreaBarContextNavItem[]
  versionSelectors?: AreaBarVersionSelector[]
  walkthrough?: { active: boolean; onToggle: () => void }
  className?: string
}) {
  // A nav strip with a highlighted item is a set of modes (Edit with VIVA |
  // Start Fresh) shown as pills; otherwise its items are actions for More.
  // Download PDF is always an action, even while you're on it.
  const isAction = (i: AreaBarContextNavItem) => i.label === 'Download PDF'
  const modes = contextNav.some((i) => i.isActive && !isAction(i)) ? contextNav.filter((i) => !isAction(i)) : []
  const actions = [...contextNav.filter((i) => !modes.includes(i)), ...subNav]
  const hasRow = versionSelectors.length > 0 || modes.length > 0 || actions.length > 0

  return (
    <div className={cn('mb-5 space-y-3', className)}>
      <h1 className="sr-only">{label}</h1>
      <div className="flex justify-center">
        <StudioToggle label={label} className="w-full md:w-[320px]" options={toggle} />
        <ShellWalkthroughButton walkthrough={walkthrough} />
      </div>
      {hasRow ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {versionSelectors.map((s) => (
            <ShellVersionSelect key={s.id} selector={s} />
          ))}
          {modes.map((item) => (
            <NavPill key={item.label} item={item} />
          ))}
          {actions.length === 1 ? <NavPill item={actions[0]} /> : actions.length > 1 ? <ActionsMenu items={actions} /> : null}
        </div>
      ) : null}
    </div>
  )
}
