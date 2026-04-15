'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, Wand2, Compass, ChevronDown, Check } from 'lucide-react'
import { useAudioStudio } from './AudioStudioContext'

interface StudioTab {
  label: string
  path: string
  icon: React.ElementType
}

const TABS: StudioTab[] = [
  { label: 'Listen', path: '/audio', icon: Headphones },
  { label: 'Create', path: '/audio/create', icon: Wand2 },
  { label: 'Explore', path: '/audio/explore', icon: Compass },
]

function isTabActive(pathname: string, tabPath: string): boolean {
  if (tabPath === '/audio') {
    return pathname === '/audio' || pathname === '/audio/'
  }
  return pathname.startsWith(tabPath)
}

export function AudioStudioHeader() {
  const pathname = usePathname()
  const { vision, allVisions, switchVision } = useAudioStudio()
  const [visionDropdownOpen, setVisionDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visionDropdownOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setVisionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [visionDropdownOpen])

  return (
    <div className="border-b border-neutral-800 bg-[#0A0A0A]">
      <div className="px-4 md:px-6 pt-5 pb-3">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Audio Studio
          </h1>

          {/* Vision selector dropdown */}
          {allVisions.length > 0 && vision && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setVisionDropdownOpen(prev => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors text-sm"
              >
                <span className="w-6 h-6 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-[10px] font-bold">
                  V{vision.version_number}
                </span>
                <span className="text-white font-medium">
                  {vision.is_active ? 'Active Vision' : `Version ${vision.version_number}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${visionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {visionDropdownOpen && (
                <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
                  {allVisions.map(v => {
                    const isSelected = v.id === vision.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          switchVision(v.id)
                          setVisionDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                          v.is_active ? 'bg-[#39FF14] text-black' : 'bg-neutral-700 text-neutral-300'
                        }`}>
                          V{v.version_number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {v.is_active ? 'Active Vision' : `Version ${v.version_number}`}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3-tab nav: Ritual / Create / Explore */}
      <div className="px-4 md:px-6">
        <nav className="flex items-center justify-center gap-1 -mb-px">
          {TABS.map(tab => {
            const TabIcon = tab.icon
            const active = isTabActive(pathname, tab.path)

            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-[#39FF14] text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
