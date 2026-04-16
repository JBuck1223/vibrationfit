'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Stack, Card, Button } from '@/lib/design-system/components'
import { Headphones, BookOpen, ArrowRight, Mic, Wand2, Sliders } from 'lucide-react'

interface CreateTile {
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  href: string
  primary?: boolean
}

const CREATE_TILES: CreateTile[] = [
  {
    title: 'Generate Vision Audio',
    description: 'Generate voice narration of your life vision, add background music and binaural beats.',
    icon: Headphones,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    href: '/audio/generate',
    primary: true,
  },
  {
    title: 'Create Story Audio',
    description: 'Turn a vision board item, journal entry, or life vision into an immersive audio story.',
    icon: BookOpen,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    href: '/story/new',
  },
  {
    title: 'Mix Audio',
    description: 'Add background music and binaural beats to your existing voice tracks.',
    icon: Sliders,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/15',
    href: '/audio/mix',
  },
  {
    title: 'Record in Your Voice',
    description: 'Read your life vision aloud and create a personal recording for each section.',
    icon: Mic,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    href: '/audio/record',
  },
]

export default function CreatePage() {
  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">What do you want to create?</h2>
          <p className="text-sm text-neutral-400">Choose a creation flow to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          {CREATE_TILES.map(tile => {
            const TileIcon = tile.icon
            return (
              <Link key={tile.title} href={tile.href} className="block">
                <Card
                  variant="elevated"
                  hover
                  className={`p-6 transition-all ${
                    tile.primary
                      ? 'border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tile.iconBg}`}>
                      <TileIcon className={`w-6 h-6 ${tile.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">{tile.title}</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">{tile.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
