'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Stack, Card, PageHero } from '@/lib/design-system/components'
import { Plus, ArrowRight, Sparkles, Clock } from 'lucide-react'

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
    title: 'Add New Item',
    description: 'Manually create a new vision board item with your own image and description.',
    icon: Plus,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    href: '/vision-board/new',
    primary: true,
  },
  {
    title: 'VIVA Ideas',
    description: 'Let VIVA generate personalized vision board ideas based on your Life Vision categories.',
    icon: Sparkles,
    iconColor: 'text-[#BF00FF]',
    iconBg: 'bg-[#BF00FF]/15',
    href: '/vision-board/ideas',
  },
  {
    title: 'Generation Queue',
    description: 'Track the progress of VIVA-generated vision board items being created.',
    icon: Clock,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    href: '/vision-board/queue',
  },
]

export default function VisionBoardCreatePage() {
  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <PageHero
          title="Create Vision Board Items"
          subtitle="Add new items to your vision board manually or let VIVA inspire you."
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
