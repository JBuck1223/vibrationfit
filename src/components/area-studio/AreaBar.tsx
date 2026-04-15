'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Check, X, Filter } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ───

export interface AreaBarTab {
  label: string
  path: string
  icon?: LucideIcon
}

export interface AreaBarPill {
  label: string
  value: string
}

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

export interface AreaBarProps {
  area: {
    name: string
    icon: LucideIcon
  }
  tabs: AreaBarTab[]
  pills?: AreaBarPill[]
  activePill?: string
  onPillChange?: (value: string) => void
  contextSelector?: {
    label: string
    options: ContextOption[]
    selectedId: string
    onSelect: (id: string) => void
  }
  menuItems?: React.ReactNode
  breadcrumb?: AreaBarBreadcrumb
  /** Rich context bar rendered as a second row (also suppresses tab highlighting like breadcrumb) */
  contextBar?: React.ReactNode
  /** "default" = neutral dark card, "hero" = PageHero-style gradient border & bg */
  variant?: 'default' | 'hero'
}

// ─── Tab active detection ───

function isTabActive(pathname: string, tabPath: string, allTabs: AreaBarTab[]): boolean {
  if (pathname === tabPath) return true

  if (pathname.startsWith(tabPath + '/')) {
    const hasMoreSpecificMatch = allTabs.some(
      t => t.path !== tabPath &&
        t.path.startsWith(tabPath + '/') &&
        (pathname === t.path || pathname.startsWith(t.path + '/'))
    )
    if (!hasMoreSpecificMatch) return true
  }

  return false
}

// ─── Grid cols helper ───

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

// ─── Component ───

export function AreaBar({
  area,
  tabs,
  pills,
  activePill,
  onPillChange,
  contextSelector,
  menuItems,
  breadcrumb,
  contextBar,
  variant = 'default',
}: AreaBarProps) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const AreaIcon = area.icon
  const gridCols = GRID_COLS[tabs.length] || 'grid-cols-3'
  const isHero = variant === 'hero'
  const suppressActiveTab = !!(breadcrumb || contextBar)

  return (
    <>
      {/* ═══ MOBILE (below md) ═══ */}
      <div className="md:hidden">
        {isHero ? (
          <>
            {/* Hero mobile: gradient-bordered card matching desktop */}
            <div className="sticky top-0 z-30 p-[1.5px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
              <div className="rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                {/* Identity row (centered) + context absolute-right */}
                <div className="relative flex items-center justify-center px-4 pt-4 pb-2">
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    {area.name}
                  </h1>
                  {(contextSelector || menuItems) && (
                    <div className="absolute right-4 flex items-center gap-2">
                      {contextSelector && (
                        <button
                          type="button"
                          onClick={() => setSheetOpen(true)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 border border-white/[0.06] active:bg-black/50 transition-colors"
                        >
                          {(() => {
                            const sel = contextSelector.options.find(o => o.id === contextSelector.selectedId)
                            return sel?.badge ? (
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold ${
                                sel.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
                              }`}>
                                {sel.badge}
                              </span>
                            ) : null
                          })()}
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </button>
                      )}
                      {menuItems}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="px-3 pb-2">
                  <nav className={`grid ${gridCols} p-1 gap-1 rounded-xl bg-black/30 backdrop-blur-sm`}>
                    {tabs.map(tab => {
                      const active = !suppressActiveTab && isTabActive(pathname, tab.path, tabs)
                      const TabIcon = tab.icon
                      return (
                        <Link
                          key={tab.path}
                          href={tab.path}
                          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                            active
                              ? 'bg-primary-500/20 text-primary-500'
                              : 'text-neutral-400 active:text-neutral-200 active:bg-white/5'
                          }`}
                        >
                          {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                          <span>{tab.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Breadcrumb */}
                {breadcrumb && !contextBar && (
                  <div className="px-4 pb-2.5 relative">
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                    <div className="flex justify-center pt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-500">
                        {breadcrumb.icon && <breadcrumb.icon className="w-3 h-3" />}
                        {breadcrumb.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Context Bar */}
                {contextBar && (
                  <div className="px-3 pb-2.5 relative">
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                    <div className="flex justify-center pt-2">
                      {contextBar}
                    </div>
                  </div>
                )}

                {/* Pills */}
                {pills && pills.length > 0 && activePill !== undefined && onPillChange && (
                  <div className="px-3 pb-2.5 relative">
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                    <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
                      <div className="flex items-center gap-1 flex-shrink-0 pl-1">
                        <Filter className="w-3 h-3 text-[#39FF14]/50" />
                        <span className="text-[10px] text-[#39FF14]/50 uppercase tracking-wide whitespace-nowrap">FILTER BY:</span>
                      </div>
                      {pills.map(pill => (
                        <button
                          key={pill.value}
                          type="button"
                          onClick={() => onPillChange(pill.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            activePill === pill.value
                              ? 'bg-[#39FF14]/15 text-white border border-[#39FF14]/30 shadow-sm shadow-[#39FF14]/10'
                              : 'text-neutral-400 border border-transparent active:text-neutral-200 active:border-[#39FF14]/15'
                          }`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Default mobile */}
            <div className="sticky top-0 z-30 bg-[#0A0A0A] border-b border-neutral-800/60 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              <div className="relative flex items-center justify-center px-4 pt-3 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#39FF14]/10 flex items-center justify-center">
                    <AreaIcon className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <span className="text-base font-bold text-white tracking-tight">
                    {area.name}
                  </span>
                </div>
                {(contextSelector || menuItems) && (
                  <div className="absolute right-4 flex items-center gap-2">
                    {contextSelector && (
                      <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 active:bg-neutral-800 transition-colors"
                      >
                        {(() => {
                          const sel = contextSelector.options.find(o => o.id === contextSelector.selectedId)
                          return sel?.badge ? (
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold ${
                              sel.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
                            }`}>
                              {sel.badge}
                            </span>
                          ) : null
                        })()}
                        <ChevronDown className="w-3 h-3 text-neutral-500" />
                      </button>
                    )}
                    {menuItems}
                  </div>
                )}
              </div>

              <div className="px-3 pb-2.5">
                <nav className={`grid ${gridCols} p-1 gap-1 rounded-xl bg-neutral-900/60`}>
                  {tabs.map(tab => {
                    const active = !suppressActiveTab && isTabActive(pathname, tab.path, tabs)
                    const TabIcon = tab.icon
                    return (
                      <Link
                        key={tab.path}
                        href={tab.path}
                        className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                          active
                            ? 'bg-primary-500/20 text-primary-500'
                            : 'text-neutral-500 active:text-neutral-300 active:bg-white/5'
                        }`}
                      >
                        {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                        <span>{tab.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {breadcrumb && !contextBar && (
                <div className="px-4 pb-2.5 relative">
                  <div className="absolute inset-x-4 top-0 h-px bg-neutral-800/60" />
                  <div className="flex justify-center pt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-500">
                      {breadcrumb.icon && <breadcrumb.icon className="w-3 h-3" />}
                      {breadcrumb.label}
                    </span>
                  </div>
                </div>
              )}

              {contextBar && (
                <div className="px-3 pb-2.5 relative">
                  <div className="absolute inset-x-4 top-0 h-px bg-neutral-800/60" />
                  <div className="pt-2 w-full">
                    {contextBar}
                  </div>
                </div>
              )}

              {pills && pills.length > 0 && activePill !== undefined && onPillChange && (
                <div className="px-3 pb-2.5 relative">
                  <div className="absolute inset-x-4 top-0 h-px bg-neutral-800/60" />
                  <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
                    <div className="flex items-center gap-1 flex-shrink-0 pl-1">
                      <Filter className="w-3 h-3 text-neutral-500" />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wide whitespace-nowrap">FILTER BY:</span>
                    </div>
                    {pills.map(pill => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => onPillChange(pill.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          activePill === pill.value
                            ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                            : 'text-neutral-500 border border-transparent active:text-neutral-300 active:border-neutral-700'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ DESKTOP (md and up) ═══ */}
      {isHero ? (
        <div className="hidden md:block relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Single row: identity left | tabs centered | context right */}
            <div className="px-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                    <AreaIcon className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {area.name}
                  </h1>
                </div>

                <nav className="flex items-center gap-1 p-1.5 rounded-xl bg-black/30 backdrop-blur-sm">
                  {tabs.map(tab => {
                    const TabIcon = tab.icon
                    const active = !suppressActiveTab && isTabActive(pathname, tab.path, tabs)
                    return (
                      <Link
                        key={tab.path}
                        href={tab.path}
                        className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                          active
                            ? 'bg-primary-500/20 text-primary-500'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                        }`}
                      >
                        {TabIcon && <TabIcon className="w-4 h-4" />}
                        <span>{tab.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="flex items-center gap-2 justify-end py-3">
                  {contextSelector && (
                    <DesktopDropdown
                      {...contextSelector}
                      isOpen={dropdownOpen}
                      onToggle={() => setDropdownOpen(prev => !prev)}
                      onClose={() => setDropdownOpen(false)}
                    />
                  )}
                  {menuItems}
                </div>
              </div>
            </div>

            {/* Breadcrumb bar (same row style as pills) */}
            {breadcrumb && !contextBar && (
              <div className="px-6 py-3 relative">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-primary-500/20 text-primary-500">
                    {breadcrumb.icon && <breadcrumb.icon className="w-3.5 h-3.5" />}
                    {breadcrumb.label}
                  </span>
                </div>
              </div>
            )}

            {/* Context Bar */}
            {contextBar && (
              <div className="px-6 py-3 relative">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                <div className="flex justify-center">
                  {contextBar}
                </div>
              </div>
            )}

            {/* Pills (optional) */}
            {pills && pills.length > 0 && activePill !== undefined && onPillChange && (
              <div className="px-6 py-3 relative">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/20 to-transparent" />
                <div className="flex justify-center">
                  <div className="relative flex items-center gap-2">
                    <div className="absolute right-full mr-2 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#39FF14]/50" />
                      <span className="text-[10px] text-[#39FF14]/50 uppercase tracking-wide whitespace-nowrap">FILTER BY:</span>
                    </div>
                    {pills.map(pill => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => onPillChange(pill.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          activePill === pill.value
                            ? 'bg-[#39FF14]/15 text-white border border-[#39FF14]/30 shadow-sm shadow-[#39FF14]/10'
                            : 'text-neutral-400 border border-transparent hover:text-neutral-200 hover:border-[#39FF14]/15'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:block rounded-2xl border border-neutral-800 bg-[#0A0A0A]">
          {/* Single row: identity left | tabs centered | context right */}
          <div className="px-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                  <AreaIcon className="w-5 h-5 text-[#39FF14]" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {area.name}
                </h1>
              </div>

              <nav className="flex items-center gap-1 p-1.5 rounded-xl bg-neutral-900/60">
                {tabs.map(tab => {
                  const TabIcon = tab.icon
                  const active = !suppressActiveTab && isTabActive(pathname, tab.path, tabs)
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                        active
                          ? 'bg-primary-500/20 text-primary-500'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {TabIcon && <TabIcon className="w-4 h-4" />}
                      <span>{tab.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="flex items-center gap-2 justify-end py-3">
                {contextSelector && (
                  <DesktopDropdown
                    {...contextSelector}
                    isOpen={dropdownOpen}
                    onToggle={() => setDropdownOpen(prev => !prev)}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
                {menuItems}
              </div>
            </div>
          </div>

          {/* Breadcrumb bar (same row style as pills) */}
          {breadcrumb && !contextBar && (
            <div className="px-6 py-3 border-t border-neutral-800/50">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-primary-500/20 text-primary-500">
                  {breadcrumb.icon && <breadcrumb.icon className="w-3.5 h-3.5" />}
                  {breadcrumb.label}
                </span>
              </div>
            </div>
          )}

          {/* Context Bar */}
          {contextBar && (
            <div className="px-6 py-3 border-t border-neutral-800/50">
              <div className="flex justify-center">
                {contextBar}
              </div>
            </div>
          )}

          {/* Pills (optional) */}
          {pills && pills.length > 0 && activePill !== undefined && onPillChange && (
            <div className="px-6 py-3 border-t border-neutral-800/50">
              <div className="flex justify-center">
                <div className="relative flex items-center gap-2">
                  <div className="absolute right-full mr-2 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wide whitespace-nowrap">FILTER BY:</span>
                  </div>
                  {pills.map(pill => (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => onPillChange(pill.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        activePill === pill.value
                          ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                          : 'text-neutral-500 border border-transparent hover:text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MOBILE BOTTOM SHEET (context selector) ═══ */}
      {contextSelector && (
        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          label={contextSelector.label}
          options={contextSelector.options}
          selectedId={contextSelector.selectedId}
          onSelect={(id) => {
            contextSelector.onSelect(id)
            setSheetOpen(false)
          }}
        />
      )}

    </>
  )
}

// ─── Desktop Dropdown (context selector) ───

function DesktopDropdown({
  label,
  options,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string
  options: ContextOption[]
  selectedId: string
  onSelect: (id: string) => void
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const selected = options.find(o => o.id === selectedId)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors text-sm"
      >
        {selected?.badge && (
          <span className="w-6 h-6 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-[10px] font-bold">
            {selected.badge}
          </span>
        )}
        <span className="text-white font-medium text-sm">
          {selected?.label || label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 w-64 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
          {options.map(option => {
            const isSelected = option.id === selectedId
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option.id)
                  onClose()
                }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                  isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                }`}
              >
                {option.badge && (
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      option.isActive
                        ? 'bg-[#39FF14] text-black'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {option.badge}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {option.label}
                  </p>
                  {option.sublabel && (
                    <p className="text-[11px] text-neutral-500">{option.sublabel}</p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mobile Bottom Sheet ───

function BottomSheet({
  isOpen,
  onClose,
  label,
  options,
  selectedId,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  label: string
  options: ContextOption[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex items-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div className="relative w-full bg-[#1A1A1A] rounded-t-2xl pb-8 animate-in slide-in-from-bottom duration-200">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 active:bg-neutral-700"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Options */}
        <div className="px-3">
          {options.map(option => {
            const isSelected = option.id === selectedId
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`w-full px-4 py-3.5 flex items-center gap-3 rounded-xl text-left transition-colors mb-1 ${
                  isSelected ? 'bg-[#39FF14]/10' : 'active:bg-neutral-800'
                }`}
              >
                {option.badge && (
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                      option.isActive
                        ? 'bg-[#39FF14] text-black'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {option.badge}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{option.label}</p>
                  {option.sublabel && (
                    <p className="text-xs text-neutral-500 mt-0.5">{option.sublabel}</p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
