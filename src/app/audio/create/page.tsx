'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Stack, Card, PageHero } from '@/lib/design-system/components'
import { AudioLines, ArrowRight, Mic, Sliders, Clock } from 'lucide-react'

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
    title: 'Generate Voice Audio',
    description: 'Generate voice narration from your Life Vision or Stories with VIVA voices.',
    icon: AudioLines,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    href: '/audio/generate',
    primary: true,
  },
  {
    title: 'Record in Your Voice',
    description: 'Read your Life Vision or Story aloud and create a personal voice recording.',
    icon: Mic,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    href: '/audio/record',
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
    title: 'Generation Queue',
    description: 'Track the progress of your audio generation and mixing jobs.',
    icon: Clock,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    href: '/audio/queue',
  },
]

export default function CreatePage() {
  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <PageHero
          title="Create Audio"
          subtitle="Choose a creation flow to get started."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
