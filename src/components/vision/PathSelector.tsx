"use client"

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { Lightbulb, Zap, Compass } from 'lucide-react'

interface PathSelectorProps {
  onSelectPath: (path: 'clarity' | 'contrast' | 'discovery') => void
  category: string
}

export function PathSelector({ onSelectPath, category }: PathSelectorProps) {
  const paths = [
    {
      id: 'clarity' as const,
      name: 'Clarity Path',
      icon: Lightbulb,
      color: '#14B8A6',
      description: 'I know what I want in this area',
      questions: '2 focused questions',
      gradient: 'from-[#14B8A6] to-[#2DD4BF]'
    },
    {
      id: 'contrast' as const,
      name: 'Contrast Path',
      icon: Zap,
      color: '#D03739',
      description: "I know what I don't want",
      questions: '4-5 guiding questions',
      gradient: 'from-[#D03739] to-[#EF4444]'
    },
    {
      id: 'discovery' as const,
      name: 'Discovery Path',
      icon: Compass,
      color: '#8B5CF6',
      description: "I'm exploring possibilities",
      questions: '3 questions with options',
      gradient: 'from-[#8B5CF6] to-[#B629D4]'
    }
  ]

  return (
    <div className="mb-8 animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Path for {category}
        </h2>
        <p className="text-neutral-400">
          How do you want to explore this area of your life?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.map((path) => {
          const Icon = path.icon
          return (
            <Card
              key={path.id}
              variant="default"
              className="cursor-pointer group hover:scale-105 transition-all duration-300"
              onClick={() => onSelectPath(path.id)}
            >
              <div className="text-center p-4">
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${path.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Path name */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {path.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-300 mb-3">
                  {path.description}
                </p>

                {/* Questions count */}
                <div className="text-xs text-neutral-500 bg-black/30 rounded-full px-3 py-1 inline-block">
                  {path.questions}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-neutral-500">
          Choose the path that feels most aligned with where you are right now
        </p>
      </div>
    </div>
  )
}
