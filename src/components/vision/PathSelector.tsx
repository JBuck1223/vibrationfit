"use client"

import React, { useEffect } from 'react'
import { Compass } from 'lucide-react'

interface PathSelectorProps {
  onSelectPath: (path: 'discovery') => void
  category: string
}

// Simplified to Discovery Path only
// Auto-starts the discovery journey without path selection
export function PathSelector({ onSelectPath, category }: PathSelectorProps) {
  // Auto-select Discovery path on mount
  useEffect(() => {
    onSelectPath('discovery')
  }, [onSelectPath])

  return (
    <div className="mb-8 animate-fadeIn text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#B629D4] flex items-center justify-center animate-pulse-subtle">
        <Compass className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">
        Let's Discover Your {category} Vision
      </h2>
      
      <p className="text-neutral-400 max-w-md mx-auto">
        I'll guide you through a few questions to help you discover what truly matters in this area of your life...
      </p>
    </div>
  )
}
