'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Headphones,
  Target,
  Image,
  BookOpen,
  User,
  DollarSign,
  Heart,
  Wand2,
  Compass,
  Eye,
  Edit,
  History,
  Plus,
  FileText,
  PenLine,
  BarChart3,
  TrendingUp,
  ChevronDown,
  Check,
  X,
  Info,
} from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { type AreaBarTab, type AreaBarPill, type ContextOption } from '@/components/area-studio'

// ─── Area configurations ───

interface AreaConfig {
  area: { name: string; icon: typeof Headphones }
  tabs: AreaBarTab[]
  pills?: Record<string, AreaBarPill[]>
  defaultPill?: Record<string, string>
  contextSelector?: {
    label: string
    options: ContextOption[]
    defaultId: string
  }
  primaryAction: string
}

const AREA_CONFIGS: AreaConfig[] = [
  {
    area: { name: 'Audio Studio', icon: Headphones },
    tabs: [
      { label: 'Activate', path: '/audio/activate', icon: Heart },
      { label: 'Create', path: '/audio/create', icon: Wand2 },
      { label: 'Explore', path: '/audio/explore', icon: Compass },
    ],
    pills: {
      '/audio/activate': [
        { label: 'Life Vision', value: 'life-vision' },
        { label: 'Focus Stories', value: 'stories' },
        { label: 'Music', value: 'music' },
      ],
      '/audio/create': [
        { label: 'Life Vision', value: 'life-vision' },
        { label: 'Focus Stories', value: 'stories' },
        { label: 'Music', value: 'music' },
      ],
    },
    defaultPill: { '/audio/activate': 'life-vision', '/audio/create': 'life-vision' },
    contextSelector: {
      label: 'Select Vision',
      options: [
        { id: 'v3', label: 'Active Vision', sublabel: 'Mar 19, 2026', badge: 'V3', isActive: true },
        { id: 'v2', label: 'Version 2', sublabel: 'Feb 1, 2026', badge: 'V2' },
        { id: 'v1', label: 'Version 1', sublabel: 'Jan 5, 2026', badge: 'V1' },
      ],
      defaultId: 'v3',
    },
    primaryAction: 'Play My Vision',
  },
  {
    area: { name: 'Life Vision Studio', icon: Target },
    tabs: [
      { label: 'My Vision', path: '/life-vision/view', icon: Eye },
      { label: 'Refine', path: '/life-vision/refine', icon: Edit },
      { label: 'Versions', path: '/life-vision/versions', icon: History },
    ],
    pills: {
      '/life-vision/view': [
        { label: 'By Category', value: 'category' },
        { label: 'Full View', value: 'full' },
      ],
      '/life-vision/versions': [
        { label: 'All', value: 'all' },
        { label: 'Drafts', value: 'drafts' },
        { label: 'Household', value: 'household' },
      ],
    },
    defaultPill: { '/life-vision/view': 'category', '/life-vision/versions': 'all' },
    contextSelector: {
      label: 'Select Vision',
      options: [
        { id: 'v3', label: 'Active Vision', sublabel: 'Mar 19, 2026', badge: 'V3', isActive: true },
        { id: 'v2', label: 'Version 2', sublabel: 'Feb 1, 2026', badge: 'V2' },
        { id: 'v1', label: 'Version 1', sublabel: 'Jan 5, 2026', badge: 'V1' },
      ],
      defaultId: 'v3',
    },
    primaryAction: 'Play My Vision',
  },
  {
    area: { name: 'Vision Board Studio', icon: Image },
    tabs: [
      { label: 'My Board', path: '/vision-board', icon: Image },
      { label: 'Create', path: '/vision-board/create', icon: Plus },
    ],
    pills: {
      '/vision-board': [
        { label: 'Grid', value: 'grid' },
        { label: 'By Category', value: 'category' },
      ],
      '/vision-board/create': [
        { label: 'VIVA Ideas', value: 'ideas' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    defaultPill: { '/vision-board': 'grid', '/vision-board/create': 'ideas' },
    primaryAction: 'View My Board',
  },
  {
    area: { name: 'Journal Studio', icon: BookOpen },
    tabs: [
      { label: 'Entries', path: '/journal', icon: BookOpen },
      { label: 'Write', path: '/journal/write', icon: PenLine },
    ],
    pills: {
      '/journal': [
        { label: 'All', value: 'all' },
        { label: 'By Category', value: 'category' },
      ],
    },
    defaultPill: { '/journal': 'all' },
    primaryAction: 'Read Latest Entry',
  },
  {
    area: { name: 'Profile Studio', icon: User },
    tabs: [
      { label: 'My Profile', path: '/profile/view', icon: User },
      { label: 'Revise', path: '/profile/revise', icon: Edit },
      { label: 'Versions', path: '/profile/versions', icon: History },
    ],
    pills: {
      '/profile/view': [
        { label: 'By Section', value: 'section' },
        { label: 'Full View', value: 'full' },
      ],
      '/profile/versions': [
        { label: 'All', value: 'all' },
        { label: 'Drafts', value: 'drafts' },
      ],
    },
    defaultPill: { '/profile/view': 'section', '/profile/versions': 'all' },
    contextSelector: {
      label: 'Select Profile',
      options: [
        { id: 'p2', label: 'Active Profile', sublabel: 'Mar 10, 2026', badge: 'V2', isActive: true },
        { id: 'p1', label: 'Version 1', sublabel: 'Jan 12, 2026', badge: 'V1' },
      ],
      defaultId: 'p2',
    },
    primaryAction: 'View My Profile',
  },
  {
    area: { name: 'Abundance Tracker', icon: DollarSign },
    tabs: [
      { label: 'Log', path: '/abundance-tracker', icon: FileText },
      { label: 'Goals', path: '/abundance-tracker/goals', icon: TrendingUp },
      { label: 'Reports', path: '/abundance-tracker/reports', icon: BarChart3 },
    ],
    pills: {
      '/abundance-tracker': [
        { label: 'All', value: 'all' },
        { label: 'Money', value: 'money' },
        { label: 'Value', value: 'value' },
      ],
    },
    defaultPill: { '/abundance-tracker': 'all' },
    primaryAction: 'Log Abundance',
  },
]

// ─── Grid cols helper ───

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

// ─── Interactive demo ───

function AreaBarDemo({ config }: { config: AreaConfig }) {
  const [activeTab, setActiveTab] = useState(config.tabs[0].path)
  const [activePills, setActivePills] = useState<Record<string, string>>(config.defaultPill || {})
  const [contextId, setContextId] = useState(config.contextSelector?.defaultId || '')
  const [sheetOpen, setSheetOpen] = useState(false)

  const currentPills = config.pills?.[activeTab]
  const currentActivePill = activePills[activeTab]
  const AreaIcon = config.area.icon
  const gridCols = GRID_COLS[config.tabs.length] || 'grid-cols-3'

  return (
    <div>
      {/* ═══ MOBILE DEMO (below md) ═══ */}
      <div className="md:hidden">
        {/* Identity row */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-white truncate">
            {config.area.name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {config.contextSelector && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-900 border border-neutral-800 active:bg-neutral-800 transition-colors"
              >
                {(() => {
                  const sel = config.contextSelector!.options.find(o => o.id === contextId)
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
          </div>
        </div>

        {/* Tabs: full-width grid */}
        <nav className={`grid ${gridCols} border-b border-neutral-800/30`}>
          {config.tabs.map(tab => {
            const active = tab.path === activeTab
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => setActiveTab(tab.path)}
                className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-[#39FF14] text-white'
                    : 'border-transparent text-neutral-500 active:text-neutral-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Pills: full-width grid */}
        {currentPills && currentPills.length > 0 && currentActivePill && (
          <div className={`grid ${GRID_COLS[currentPills.length] || 'grid-cols-3'} border-b border-neutral-800/20`}>
            {currentPills.map(pill => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setActivePills(prev => ({ ...prev, [activeTab]: pill.value }))}
                className={`flex items-center justify-center py-2 text-xs font-medium transition-colors ${
                  currentActivePill === pill.value
                    ? 'text-white bg-white/5'
                    : 'text-neutral-500 active:text-neutral-300'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* Content placeholder */}
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-neutral-600">
            {config.tabs.find(t => t.path === activeTab)?.label}
            {currentActivePill && ` / ${currentPills?.find(p => p.value === currentActivePill)?.label}`}
          </p>
        </div>
      </div>

      {/* ═══ DESKTOP DEMO (md and up) ═══ */}
      <div className="hidden md:block rounded-2xl border border-neutral-800 bg-[#0A0A0A] overflow-hidden">
        <div className="relative px-6 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                <AreaIcon className="w-5 h-5 text-[#39FF14]" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {config.area.name}
              </h1>
            </div>

            <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2 bottom-0">
              {config.tabs.map(tab => {
                const TabIcon = tab.icon
                const active = tab.path === activeTab
                return (
                  <button
                    key={tab.path}
                    type="button"
                    onClick={() => setActiveTab(tab.path)}
                    className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      active
                        ? 'border-[#39FF14] text-white'
                        : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    {TabIcon && <TabIcon className="w-4 h-4" />}
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {config.contextSelector && (
              <DesktopContextDemo
                options={config.contextSelector.options}
                selectedId={contextId}
                onSelect={setContextId}
                label={config.contextSelector.label}
              />
            )}
          </div>
        </div>

        {currentPills && currentPills.length > 0 && currentActivePill && (
          <div className="px-6 py-3 border-t border-neutral-800/50">
            <div className="flex justify-center items-center gap-2">
              {currentPills.map(pill => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setActivePills(prev => ({ ...prev, [activeTab]: pill.value }))}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    currentActivePill === pill.value
                      ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                      : 'text-neutral-500 border border-transparent hover:text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop content placeholder */}
        <div className="px-6 py-6 text-center border-t border-dashed border-neutral-800/30">
          <p className="text-xs text-neutral-600">
            {config.tabs.find(t => t.path === activeTab)?.label}
            {currentActivePill && ` / ${currentPills?.find(p => p.value === currentActivePill)?.label}`}
            {config.contextSelector && ` / ${config.contextSelector.options.find(o => o.id === contextId)?.label}`}
          </p>
        </div>
      </div>

      {/* Mobile bottom sheet for demo */}
      {config.contextSelector && sheetOpen && (
        <DemoBottomSheet
          label={config.contextSelector.label}
          options={config.contextSelector.options}
          selectedId={contextId}
          onSelect={(id) => { setContextId(id); setSheetOpen(false) }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Desktop context dropdown for demo ───

function DesktopContextDemo({
  options,
  selectedId,
  onSelect,
  label,
}: {
  options: ContextOption[]
  selectedId: string
  onSelect: (id: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === selectedId)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors text-sm"
      >
        {selected?.badge && (
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
            selected.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
          }`}>{selected.badge}</span>
        )}
        <span className="text-white font-medium text-sm">{selected?.label || label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 right-0 mt-2 w-64 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
          {options.map(option => {
            const isSelected = option.id === selectedId
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => { onSelect(option.id); setOpen(false) }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                  isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                }`}
              >
                {option.badge && (
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    option.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
                  }`}>{option.badge}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{option.label}</p>
                  {option.sublabel && <p className="text-[11px] text-neutral-500">{option.sublabel}</p>}
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Demo bottom sheet ───

function DemoBottomSheet({
  label,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  label: string
  options: ContextOption[]
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex items-end"
      onClick={handleBackdrop}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full bg-[#1A1A1A] rounded-t-2xl pb-8">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>
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
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                    option.isActive ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
                  }`}>{option.badge}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{option.label}</p>
                  {option.sublabel && <p className="text-xs text-neutral-500 mt-0.5">{option.sublabel}</p>}
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───

export default function AreaBarShowcase() {
  const router = useRouter()
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 pt-4 pb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/design-system')}
          className="flex items-center gap-2 w-fit mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">Design System</span>
        </Button>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white">AreaBar</h1>
            <p className="text-xs md:text-sm text-neutral-500 mt-1">
              Universal navigation for all member areas
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo(prev => !prev)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-neutral-600 transition-colors"
          >
            <Info className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Collapsible info */}
      {showInfo && (
        <div className="px-4 md:px-8 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h3 className="text-xs font-semibold text-[#39FF14] mb-1">Row 1: Identity + Tabs</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Mobile: name left, badge right. Desktop: icon + name left, tabs centered, context right.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h3 className="text-xs font-semibold text-[#39FF14] mb-1">Tabs: Segmented Control</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Mobile: full-width grid, equal columns, sticky. Desktop: centered in identity row.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h3 className="text-xs font-semibold text-[#39FF14] mb-1">Context: Bottom Sheet</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Mobile: badge-only trigger, full bottom sheet. Desktop: dropdown with labels.
              </p>
            </div>
          </div>

          <details className="group">
            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
              Show usage code
            </summary>
            <div className="mt-2 rounded-lg bg-neutral-900 p-3 overflow-x-auto">
              <pre className="text-[11px] text-neutral-300 font-mono whitespace-pre">{`<AreaBar
  area={{ name: 'Audio Studio', icon: Headphones }}
  tabs={[
    { label: 'Ritual', path: '/audio/ritual', icon: Heart },
    { label: 'Create', path: '/audio/create', icon: Wand2 },
    { label: 'Explore', path: '/audio/explore', icon: Compass },
  ]}
  pills={ritualPills}
  activePill={activePill}
  onPillChange={setActivePill}
  contextSelector={{ ... }}
/>`}</pre>
            </div>
          </details>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-neutral-800/50" />

      {/* All area demos */}
      <div className="divide-y divide-neutral-800/30 md:space-y-6 md:divide-y-0 md:px-8 md:py-6">
        {AREA_CONFIGS.map(config => (
          <div key={config.area.name} className="md:mb-0">
            {/* Desktop label */}
            <div className="hidden md:flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">{config.area.name}</span>
              <span className="text-[10px] text-neutral-600">{config.primaryAction}</span>
            </div>
            <AreaBarDemo config={config} />
          </div>
        ))}
      </div>
    </div>
  )
}
