'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Stack, Card, Button } from '@/lib/design-system/components'
import { Headphones, BookOpen, Music2, ArrowRight, Mic, Wand2 } from 'lucide-react'
import { useAudioStudio } from '@/components/audio-studio'

type PillCategory = 'life-vision' | 'focus-stories' | 'music'

interface CreateTile {
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  href: string
  primary?: boolean
  disabled?: boolean
  tag?: string
  pills: PillCategory[]
}

const CREATE_TILES: CreateTile[] = [
  {
    title: 'Create Vision Audio',
    description: 'Generate voice narration of your life vision, add background music and binaural beats.',
    icon: Headphones,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    href: '/audio/generate',
    primary: true,
    pills: ['life-vision'],
  },
  {
    title: 'Create Focus Story',
    description: 'Turn a vision board item, journal entry, or life vision into an immersive audio story.',
    icon: BookOpen,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    href: '/story/new',
    pills: ['focus-stories'],
  },
  {
    title: 'Record in Your Voice',
    description: 'Read your life vision aloud and create a personal recording for each section.',
    icon: Mic,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    href: '/audio/record',
    pills: ['life-vision'],
  },
  {
    title: 'Create Track',
    description: 'Advanced tools for generating your own high-vibe music and soundscapes.',
    icon: Music2,
    iconColor: 'text-neutral-500',
    iconBg: 'bg-neutral-800',
    href: '#',
    disabled: true,
    tag: 'Coming Soon',
    pills: ['music'],
  },
]

export default function CreatePage() {
  const { activePill } = useAudioStudio()
  const visibleTiles = CREATE_TILES.filter(t => t.pills.includes(activePill as PillCategory))

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">What do you want to create?</h2>
          <p className="text-sm text-neutral-400">Choose a creation flow to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          {visibleTiles.map(tile => {
            const TileIcon = tile.icon
            const inner = (
              <Card
                variant="elevated"
                hover={!tile.disabled}
                className={`p-6 transition-all ${
                  tile.primary
                    ? 'border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent'
                    : tile.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tile.iconBg}`}>
                    <TileIcon className={`w-6 h-6 ${tile.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{tile.title}</h3>
                      {tile.tag && (
                        <span className="text-[10px] font-medium text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">{tile.tag}</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">{tile.description}</p>
                  </div>
                  {!tile.disabled && <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />}
                </div>
              </Card>
            )

            if (tile.disabled) return <div key={tile.title}>{inner}</div>
            return <Link key={tile.title} href={tile.href} className="block">{inner}</Link>
          })}
        </div>

        {/* Quick links */}
        {activePill === 'life-vision' && (
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-2">Already have voice tracks?</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/audio/mix">
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                Add Background Music
              </Link>
            </Button>
          </div>
        )}
      </Stack>
    </Container>
  )
}
