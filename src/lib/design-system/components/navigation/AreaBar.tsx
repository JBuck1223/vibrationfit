'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Check, X, Filter, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ───

export interface AreaBarTab {
  label: string
  path: string
  icon?: LucideIcon
  matchPaths?: string[]
}

export interface AreaBarPill {
  label: string
  value: string
}

/** @deprecated Use VersionOption instead */
export interface ContextOption {
  id: string
  label: string
  sublabel?: string
  badge?: string
  isActive?: boolean
}

export interface AreaBarBreadcrumb {
  label: string
  icon?: LucideIcon
}

export interface AreaBarContextNavItem {
  label: string
  path?: string
  icon?: LucideIcon
  isActive?: boolean
  onClick?: () => void
  badge?: React.ReactNode
}

export interface VersionOption {
  id: string
  label: string
  sublabel?: string
  badge?: string
  isActive?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  count?: number
}

export interface AreaBarVersionSelector {
  id: string
  label: string
  icon?: LucideIcon
  options: VersionOption[]
  selectedId: string
  onSelect: (id: string) => void
  position?: 'topRight' | 'contextRow'
  searchable?: boolean
}

export interface AreaBarProps {
  /** Title on Left */
  area: { name: string; icon: LucideIcon }
  /** Top Nav in Center */
  tabs: AreaBarTab[]
  /** Context Nav — secondary tab strip rendered below Top Nav */
  contextNav?: AreaBarContextNavItem[]
  /** Context Text — descriptive subtext rendered below Context Nav */
  contextText?: string
  /** Version Selectors — dropdown pickers, positioned topRight or contextRow */
  versionSelectors?: AreaBarVersionSelector[]
  pills?: AreaBarPill[]
  activePill?: string
  onPillChange?: (value: string) => void
  menuItems?: React.ReactNode
  breadcrumb?: AreaBarBreadcrumb
  keepTabActive?: boolean
  activeParentPath?: string
  variant?: 'default' | 'hero'
  appLikePrimaryTabs?: boolean
}

// ─── Tab active detection ───

function isTabActive(pathname: string, tab: AreaBarTab, allTabs: AreaBarTab[]): boolean {
  if (tab.matchPaths?.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  if (pathname === tab.path) return true
  if (pathname.startsWith(tab.path + '/')) {
    const hasMoreSpecificMatch = allTabs.some(
      t => t.path !== tab.path &&
        t.path.startsWith(tab.path + '/') &&
        (pathname === t.path || pathname.startsWith(t.path + '/'))
    )
    if (!hasMoreSpecificMatch) return true
  }
  return false
}

// ─── Helpers ───

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

const APP_LIKE_TAB_NAV =
  'w-full min-w-0 grid gap-0 overflow-hidden rounded-xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]'

function appLikePrimaryLinkClassName(isSelected: boolean, size: 'compact' | 'default' = 'compact') {
  const sizeCls =
    size === 'compact'
      ? 'min-h-[2.75rem] flex-col items-center justify-center gap-0.5 px-1.5 py-2 text-xs sm:min-h-11 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm'
      : 'min-h-10 flex-row items-center justify-center gap-1.5 px-2.5 py-2.5 text-sm'
  return `flex w-full min-w-0 border-b-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40 ${sizeCls} ${
    isSelected
      ? 'border-primary-500 bg-zinc-900/85 font-semibold text-primary-400'
      : 'border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 active:text-zinc-300'
  }`
}

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [active, ref, onClose])
}

// ─── Context Nav Strip ───

const CONTEXT_NAV_LINK_CLASS_ACTIVE =
  'border-primary-500 bg-zinc-900/85 font-semibold text-primary-400'
const CONTEXT_NAV_LINK_CLASS_INACTIVE =
  'border-transparent bg-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 active:text-zinc-300'
const CONTEXT_NAV_LINK_BASE =
  'flex min-h-[2.75rem] w-full min-w-0 flex-col items-center justify-center gap-0.5 border-b-2 px-0.5 py-2 sm:min-h-11 sm:flex-row sm:gap-1 sm:px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40'

function ContextNavStrip({ items }: { items: AreaBarContextNavItem[] }) {
  const n = Math.max(1, Math.min(6, items.length))
  const gridCols = GRID_COLS[n] ?? 'grid-cols-3'
  return (
    <div className="w-full sm:max-w-2xl sm:mx-auto">
      <div className="w-full overflow-hidden rounded-xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]">
        <nav className={`grid w-full ${gridCols}`}>
          {items.map((item, idx) => {
            const Icon = item.icon
            const cls = `${CONTEXT_NAV_LINK_BASE} ${item.isActive ? CONTEXT_NAV_LINK_CLASS_ACTIVE : CONTEXT_NAV_LINK_CLASS_INACTIVE}`
            if (item.path) {
              return (
                <Link key={item.path} href={item.path} className={cls} aria-current={item.isActive ? 'page' : undefined}>
                  {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${item.isActive ? 'text-primary-400' : ''}`} strokeWidth={2.25} aria-hidden />}
                  <span className="min-w-0 text-center text-[10px] font-medium leading-tight sm:text-xs">{item.label}</span>
                  {item.badge}
                </Link>
              )
            }
            return (
              <button key={item.label + idx} type="button" onClick={item.onClick} className={cls} aria-pressed={item.isActive}>
                {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${item.isActive ? 'text-primary-400' : ''}`} strokeWidth={2.25} aria-hidden />}
                <span className="min-w-0 text-center text-[10px] font-medium leading-tight sm:text-xs">{item.label}</span>
                {item.badge}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// ─── Version Selector Dropdown (desktop flyout + responsive trigger) ───

function VersionSelectorDropdown({
  selector,
  compact = false,
}: {
  selector: AreaBarVersionSelector
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => { setIsOpen(false); setSearch('') }, [])
  useClickOutside(ref, close, isOpen)

  const selected = selector.options.find(o => o.id === selector.selectedId)
  const SelectorIcon = selector.icon || selected?.icon
  const showSearch = selector.searchable !== false && selector.options.length > 3
  const filteredOptions = search.trim()
    ? selector.options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : selector.options

  const handleSelect = (id: string) => {
    selector.onSelect(id)
    close()
  }

  const triggerCls = compact
    ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors'
    : 'w-full px-3 py-2 md:py-1.5 min-h-[38px] md:min-h-[34px] rounded-xl md:rounded-lg bg-neutral-900/80 md:bg-black/40 border border-neutral-700/50 hover:border-neutral-600 active:bg-neutral-800 transition-colors flex items-center gap-2.5 text-left'

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setIsOpen(p => !p); setSearch('') }} className={triggerCls}>
        {SelectorIcon && (
          <SelectorIcon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-3.5 md:h-3.5'} text-[#39FF14] flex-shrink-0`} />
        )}
        {compact && selected?.badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
            selected.isActive ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-neutral-400 bg-neutral-800'
          }`}>{selected.badge}</span>
        )}
        <span className={`text-xs font-medium truncate ${compact ? 'max-w-[10rem]' : 'flex-1'} ${selected ? 'text-white' : 'text-neutral-500'}`}>
          {selected?.label || selector.label}
        </span>
        {!compact && selected?.badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
            selected.isActive ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-neutral-400 bg-neutral-800'
          }`}>{selected.badge}</span>
        )}
        {!compact && selected?.count !== undefined && (
          <span className="text-[10px] text-neutral-500 flex-shrink-0">{selected.count}</span>
        )}
        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5 md:w-3 md:h-3'} text-neutral-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-[100] ${compact ? 'right-0 w-64' : 'left-0 right-0'} mt-1.5 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden`}>
          {showSearch && (
            <div className="p-2 border-b border-neutral-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search...`}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="py-1 max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-neutral-500">{search.trim() ? `No results for "${search}"` : 'No options'}</p>
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = option.id === selector.selectedId
                const OptionIcon = option.icon
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${
                      isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'
                    }`}
                  >
                    {OptionIcon && option.iconPosition !== 'right' && (
                      <OptionIcon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm md:text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        {option.label}
                        {OptionIcon && option.iconPosition === 'right' && (
                          <OptionIcon className={`inline-block ml-1.5 w-3.5 h-3.5 md:w-3 md:h-3 align-[-2px] ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                        )}
                      </p>
                      {option.sublabel && (
                        <p className="text-xs md:text-[10px] text-neutral-500">{option.sublabel}</p>
                      )}
                    </div>
                    {option.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        option.isActive ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-neutral-400 bg-neutral-800'
                      }`}>{option.badge}</span>
                    )}
                    {option.count !== undefined && (
                      <span className="text-xs md:text-[10px] text-neutral-500 flex-shrink-0">{option.count}</span>
                    )}
                    {isSelected && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Version Selector Sheet (mobile bottom sheet for topRight selectors) ───

function VersionSelectorSheet({
  isOpen,
  onClose,
  selector,
}: {
  isOpen: boolean
  onClose: () => void
  selector: AreaBarVersionSelector
}) {
  const [search, setSearch] = useState('')

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  if (!isOpen) return null

  const showSearch = selector.searchable !== false && selector.options.length > 3
  const filteredOptions = search.trim()
    ? selector.options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : selector.options

  return (
    <div className="fixed inset-0 z-50 md:hidden flex items-end" onClick={handleBackdrop}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full bg-[#1A1A1A] rounded-t-2xl pb-8 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-sm font-semibold text-white">{selector.label}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 active:bg-neutral-700">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        {showSearch && (
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                autoFocus
              />
            </div>
          </div>
        )}
        <div className="px-3 max-h-[60vh] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-neutral-500">{search.trim() ? `No results for "${search}"` : 'No options'}</p>
            </div>
          ) : (
            filteredOptions.map(option => {
              const isSelected = option.id === selector.selectedId
              const OptionIcon = option.icon
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { selector.onSelect(option.id); onClose() }}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 rounded-xl text-left transition-colors mb-1 ${
                    isSelected ? 'bg-[#39FF14]/10' : 'active:bg-neutral-800'
                  }`}
                >
                  {OptionIcon && option.iconPosition !== 'right' && (
                    <OptionIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {option.label}
                      {OptionIcon && option.iconPosition === 'right' && (
                        <OptionIcon className={`inline-block ml-1.5 w-4 h-4 align-[-3px] ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                      )}
                    </p>
                    {option.sublabel && <p className="text-xs text-neutral-500 mt-0.5">{option.sublabel}</p>}
                  </div>
                  {option.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                      option.isActive ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-neutral-400 bg-neutral-800'
                    }`}>{option.badge}</span>
                  )}
                  {option.count !== undefined && <span className="text-xs text-neutral-500 flex-shrink-0">{option.count}</span>}
                  {isSelected && <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───

export function AreaBar({
  area,
  tabs,
  contextNav,
  contextText,
  versionSelectors,
  pills,
  activePill,
  onPillChange,
  menuItems,
  breadcrumb,
  keepTabActive = false,
  activeParentPath,
  variant = 'default',
  appLikePrimaryTabs = false,
}: AreaBarProps) {
  const pathname = usePathname()
  const [openSheetId, setOpenSheetId] = useState<string | null>(null)

  const AreaIcon = area.icon
  const tabGridCols = GRID_COLS[tabs.length] || 'grid-cols-3'
  const isHero = variant === 'hero'

  const topRightSelectors = versionSelectors?.filter(v => v.position === 'topRight') ?? []
  const contextRowSelectors = versionSelectors?.filter(v => v.position !== 'topRight') ?? []

  const hasContextNav = !!(contextNav && contextNav.length > 0)
  const hasContextText = !!contextText
  const hasContextRowSelectors = contextRowSelectors.length > 0
  const hasContextRows = hasContextNav || hasContextText || hasContextRowSelectors
  const suppressActiveTab = !!(breadcrumb || (hasContextRows && !keepTabActive))

  // Shared waterfall rendering — called from both mobile and desktop sections
  const renderWaterfallRows = (mode: { isMobile: boolean }) => {
    const { isMobile } = mode

    const rowCls = isMobile
      ? (isHero ? 'px-3 pb-2.5 relative' : 'border-t border-neutral-800/60 w-full min-w-0 px-3 pb-2.5')
      : (isHero ? 'px-6 py-3 relative' : 'px-6 py-3 border-t border-neutral-800/50')

    const sep = isHero
      ? <div className={`absolute ${isMobile ? 'inset-x-4' : 'inset-x-6'} top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent`} />
      : null

    const innerPad = isMobile ? (isHero ? 'pt-2' : 'pt-2.5') : ''
    const centerCls = isMobile ? '' : 'flex justify-center'

    return (
      <>
        {/* Breadcrumb (only when no context rows) */}
        {breadcrumb && !hasContextRows && (
          <div className={rowCls}>
            {sep}
            <div className={`${innerPad} flex justify-center`}>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-primary-500/20 text-primary-500">
                {breadcrumb.icon && <breadcrumb.icon className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
                {breadcrumb.label}
              </span>
            </div>
          </div>
        )}

        {/* Context Nav */}
        {hasContextNav && (
          <div className={rowCls}>
            {sep}
            <div className={`${innerPad} ${centerCls} w-full min-w-0`}>
              <ContextNavStrip items={contextNav!} />
            </div>
          </div>
        )}

        {/* Context Text */}
        {hasContextText && (
          <div className={rowCls}>
            {sep}
            <div className={innerPad}>
              <p className={`text-center text-balance text-zinc-400 ${isMobile ? 'text-[12px] leading-relaxed' : 'text-[13px] leading-normal'}`}>
                {contextText}
              </p>
            </div>
          </div>
        )}

        {/* Context Row Selectors */}
        {hasContextRowSelectors && (
          <div className={rowCls}>
            {sep}
            <div className={innerPad}>
              {isMobile ? (
                <div className="flex flex-col gap-2">
                  {contextRowSelectors.map(sel => (
                    <div key={sel.id} className="flex items-center gap-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 shrink-0 whitespace-nowrap">{sel.label}</p>
                      <div className="flex-1 min-w-0">
                        <VersionSelectorDropdown selector={sel} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  {contextRowSelectors.map(sel => (
                    <div key={sel.id} className="flex items-center gap-3 flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 shrink-0 whitespace-nowrap">{sel.label}</p>
                      <div className="relative flex-1 min-w-0">
                        <VersionSelectorDropdown selector={sel} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pills */}
        {pills && pills.length > 0 && activePill !== undefined && onPillChange && (
          <div className={rowCls}>
            {sep}
            <div className={`${innerPad} flex items-center justify-center gap-1.5 flex-wrap`}>
              <div className="flex items-center gap-1 flex-shrink-0 pl-1">
                <Filter className={`w-3 h-3 ${isHero ? 'text-[#39FF14]/50' : isMobile ? 'text-neutral-500' : 'text-neutral-500'}`} />
                <span className={`text-[10px] uppercase tracking-wide whitespace-nowrap ${isHero ? 'text-[#39FF14]/50' : 'text-neutral-500'}`}>FILTER BY:</span>
              </div>
              {pills.map(pill => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => onPillChange(pill.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activePill === pill.value
                      ? isHero
                        ? 'bg-[#39FF14]/15 text-white border border-[#39FF14]/30 shadow-sm shadow-[#39FF14]/10'
                        : 'bg-white/10 text-white border border-white/20 shadow-sm'
                      : isHero
                        ? 'text-neutral-400 border border-transparent hover:text-neutral-200 hover:border-[#39FF14]/15 active:text-neutral-200 active:border-[#39FF14]/15'
                        : 'text-neutral-500 border border-transparent hover:text-neutral-300 hover:border-neutral-700 active:text-neutral-300 active:border-neutral-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  // Mobile topRight trigger content
  const renderMobileTopRightTrigger = (sel: AreaBarVersionSelector) => {
    const selected = sel.options.find(o => o.id === sel.selectedId)
    const SelectorIcon = sel.icon || selected?.icon
    return (
      <button
        key={sel.id}
        type="button"
        onClick={() => setOpenSheetId(sel.id)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
          isHero
            ? 'bg-black/30 border border-white/[0.06] active:bg-black/50'
            : 'bg-neutral-900 border border-neutral-800 active:bg-neutral-800'
        } transition-colors`}
      >
        {SelectorIcon && <SelectorIcon className="w-3.5 h-3.5 text-[#39FF14] flex-shrink-0" />}
        {selected?.badge && (
          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold ${
            selected.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
          }`}>{selected.badge}</span>
        )}
        <ChevronDown className="w-3 h-3 text-neutral-400" />
      </button>
    )
  }

  const hasTopRight = topRightSelectors.length > 0

  // ─── Tab link rendering (shared between mobile hero/default) ───
  const renderTabLinks = (size: 'compact' | 'default') =>
    tabs.map(tab => {
      const TabIcon = tab.icon
      const active = !suppressActiveTab && isTabActive(pathname, tab, tabs)
      const isParent = activeParentPath === tab.path
      const isSelected = appLikePrimaryTabs ? active || isParent : active
      const showParentCaret = isParent && !appLikePrimaryTabs
      return (
        <Link
          key={tab.path}
          href={tab.path}
          aria-current={isSelected && appLikePrimaryTabs ? 'page' : undefined}
          className={
            appLikePrimaryTabs
              ? `relative ${appLikePrimaryLinkClassName(isSelected, size)}`
              : `relative flex items-center ${size === 'compact' ? 'justify-center gap-1.5 py-2 text-xs' : 'gap-1.5 px-4 py-2 text-sm whitespace-nowrap'} font-medium rounded-lg transition-all ${
                  active
                    ? 'bg-primary-500/20 text-primary-500'
                    : isParent
                      ? isHero ? 'text-neutral-200' : 'text-neutral-300'
                      : isHero
                        ? 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 active:text-neutral-200 active:bg-white/5'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5 active:text-neutral-300 active:bg-white/5'
                }`
          }
        >
          {TabIcon && <TabIcon className={size === 'compact' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />}
          <span className="min-w-0 text-center font-medium leading-tight">{tab.label}</span>
          {showParentCaret && (
            <ChevronDown className={`absolute ${size === 'compact' ? '-bottom-1 w-3 h-3' : '-bottom-1.5 w-3.5 h-3.5'} left-1/2 -translate-x-1/2 text-primary-500/60`} />
          )}
        </Link>
      )
    })

  return (
    <>
      {/* ═══ MOBILE (below md) ═══ */}
      <div className="md:hidden">
        {isHero ? (
          <div className="sticky top-0 z-30 p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/40 via-[#14B8A6]/25 to-[#BF00FF]/40">
            <div className="rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              {/* Title row */}
              <div className="relative flex items-center justify-center px-4 pt-4 pb-2">
                <h1 className="text-2xl font-bold text-white leading-tight">{area.name}</h1>
                {(hasTopRight || menuItems) && (
                  <div className="absolute right-4 flex items-center gap-2">
                    {topRightSelectors.map(sel => renderMobileTopRightTrigger(sel))}
                    {menuItems}
                  </div>
                )}
              </div>
              {/* Tabs */}
              <div className="px-3 pb-2">
                <nav className={appLikePrimaryTabs ? `${APP_LIKE_TAB_NAV} ${tabGridCols}` : `grid ${tabGridCols} p-1 gap-1 rounded-xl bg-black/30 backdrop-blur-sm`}>
                  {renderTabLinks('compact')}
                </nav>
              </div>
              {/* Waterfall rows */}
              {renderWaterfallRows({ isMobile: true })}
            </div>
          </div>
        ) : (
          <div className="sticky top-0 z-30 w-full min-w-0 border-b border-neutral-800/60 bg-[#0A0A0A]">
            {/* Title row */}
            <div
              className="relative flex items-center justify-center px-4 pb-2.5"
              style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#39FF14]/10 flex items-center justify-center">
                  <AreaIcon className="w-4 h-4 text-[#39FF14]" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">{area.name}</span>
              </div>
              {(hasTopRight || menuItems) && (
                <div className="absolute right-4 flex items-center gap-2">
                  {topRightSelectors.map(sel => renderMobileTopRightTrigger(sel))}
                  {menuItems}
                </div>
              )}
            </div>
            {/* Tabs */}
            <div className="w-full min-w-0 px-3 pb-2.5">
              <nav className={appLikePrimaryTabs ? `${APP_LIKE_TAB_NAV} ${tabGridCols}` : `grid ${tabGridCols} w-full p-1 gap-1 rounded-xl bg-neutral-900/60`}>
                {renderTabLinks('compact')}
              </nav>
            </div>
            {/* Waterfall rows */}
            {renderWaterfallRows({ isMobile: true })}
          </div>
        )}
      </div>

      {/* ═══ DESKTOP (md and up) ═══ */}
      {isHero ? (
        <div className="hidden md:block relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/40 via-[#14B8A6]/25 to-[#BF00FF]/40">
          <div className="rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Row 1: Title | Tabs | Right */}
            <div className="px-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                    <AreaIcon className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight">{area.name}</h1>
                </div>
                <nav className={appLikePrimaryTabs ? `${APP_LIKE_TAB_NAV} min-w-[12rem] max-w-sm ${tabGridCols}` : 'flex items-center gap-1 p-1.5 rounded-xl bg-black/30 backdrop-blur-sm'}>
                  {renderTabLinks('default')}
                </nav>
                <div className="flex items-center gap-2 justify-end py-3">
                  {topRightSelectors.map(sel => (
                    <VersionSelectorDropdown key={sel.id} selector={sel} compact />
                  ))}
                  {menuItems}
                </div>
              </div>
            </div>
            {/* Waterfall rows */}
            {renderWaterfallRows({ isMobile: false })}
          </div>
        </div>
      ) : (
        <div className="hidden md:block rounded-2xl border-2 border-[#333] bg-[#0A0A0A]">
          {/* Row 1: Title | Tabs | Right */}
          <div className="px-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                  <AreaIcon className="w-5 h-5 text-[#39FF14]" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">{area.name}</h1>
              </div>
              <nav className={appLikePrimaryTabs ? `${APP_LIKE_TAB_NAV} min-w-[12rem] max-w-sm ${tabGridCols}` : 'flex items-center gap-1 p-1.5 rounded-xl bg-neutral-900/60'}>
                {renderTabLinks('default')}
              </nav>
              <div className="flex items-center gap-2 justify-end py-3">
                {topRightSelectors.map(sel => (
                  <VersionSelectorDropdown key={sel.id} selector={sel} compact />
                ))}
                {menuItems}
              </div>
            </div>
          </div>
          {/* Waterfall rows */}
          {renderWaterfallRows({ isMobile: false })}
        </div>
      )}

      {/* ═══ MOBILE BOTTOM SHEETS (for topRight selectors) ═══ */}
      {topRightSelectors.map(sel => (
        <VersionSelectorSheet
          key={sel.id}
          isOpen={openSheetId === sel.id}
          onClose={() => setOpenSheetId(null)}
          selector={sel}
        />
      ))}
    </>
  )
}
