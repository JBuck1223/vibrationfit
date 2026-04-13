'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, AudioLines, Music, Mic, Clock, BookOpen, Music2 } from 'lucide-react'
import { useAudioStudio } from './AudioStudioContext'
import { VersionBadge, StatusBadge } from '@/lib/design-system/components'

interface StudioTab {
  label: string
  path: string
  icon: React.ElementType
  badge?: number
}

interface StudioSection {
  id: string
  label: string
  icon: React.ElementType
  basePath: string
  tabs: StudioTab[]
  comingSoon?: boolean
}

const STUDIO_SECTIONS: StudioSection[] = [
  {
    id: 'vision-audio',
    label: 'Vision Audio',
    icon: Headphones,
    basePath: '/audio/listen',
    tabs: [
      { label: 'Listen', path: '/audio/listen', icon: Headphones },
      { label: 'Generate', path: '/audio/generate', icon: AudioLines },
      { label: 'Mix', path: '/audio/mix', icon: Music },
      { label: 'Record', path: '/audio/record', icon: Mic },
    ],
  },
  {
    id: 'focus-stories',
    label: 'Focus Stories',
    icon: BookOpen,
    basePath: '/audio/stories',
    tabs: [
      { label: 'Stories', path: '/audio/stories', icon: BookOpen },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    icon: Music2,
    basePath: '/audio/music',
    tabs: [],
    comingSoon: true,
  },
]

function getActiveSection(pathname: string): StudioSection {
  for (const section of STUDIO_SECTIONS) {
    if (section.tabs.some(tab => pathname.startsWith(tab.path))) {
      return section
    }
    if (pathname.startsWith(section.basePath)) {
      return section
    }
  }
  return STUDIO_SECTIONS[0]
}

function isTabActive(pathname: string, tabPath: string): boolean {
  return pathname === tabPath || pathname.startsWith(tabPath + '/')
}

export function AudioStudioHeader() {
  const pathname = usePathname()
  const { vision, activeBatchCount } = useAudioStudio()
  const activeSection = getActiveSection(pathname)

  return (
    <div className="border-b border-neutral-800 bg-[#0A0A0A]">
      {/* Vision info + section selector */}
      <div className="px-4 md:px-6 pt-5 pb-3">
        <div className="flex flex-col items-center gap-3">
          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Audio Studio
          </h1>

          {/* Vision badge row */}
          {vision && (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-neutral-900/60 border border-neutral-700/50">
              <VersionBadge
                versionNumber={vision.version_number}
                status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'}
                isHouseholdVision={!!vision.household_id}
              />
              <StatusBadge
                status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'}
                subtle={!vision.is_active}
                className="uppercase tracking-[0.25em]"
              />
            </div>
          )}

          {/* Section selector (only show when there are multiple active sections) */}
          {STUDIO_SECTIONS.filter(s => !s.comingSoon).length > 1 && (
            <div className="flex items-center gap-1 p-1 rounded-full bg-neutral-900 border border-neutral-800">
              {STUDIO_SECTIONS.map(section => {
                const SectionIcon = section.icon
                const isActive = activeSection.id === section.id
                return (
                  <Link
                    key={section.id}
                    href={section.comingSoon ? '#' : section.basePath}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      section.comingSoon
                        ? 'text-neutral-600 cursor-not-allowed'
                        : isActive
                          ? 'bg-white/10 text-white'
                          : 'text-neutral-400 hover:text-white'
                    }`}
                    onClick={e => section.comingSoon && e.preventDefault()}
                  >
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                    {section.comingSoon && (
                      <span className="text-[10px] text-neutral-600 ml-0.5">Soon</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab bar */}
      {activeSection.tabs.length > 0 && (
        <div className="px-4 md:px-6">
          <nav className="flex items-center justify-center gap-1 -mb-px">
            {activeSection.tabs.map(tab => {
              const TabIcon = tab.icon
              const active = isTabActive(pathname, tab.path)
              const badgeCount = tab.path === '/audio/generate' ? activeBatchCount : (tab.badge || 0)

              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-[#39FF14] text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
