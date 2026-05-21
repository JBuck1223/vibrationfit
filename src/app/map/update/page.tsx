'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Stack, Card } from '@/lib/design-system/components'
import { Target, PenLine, ChevronRight } from 'lucide-react'
interface UpdateTile {
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  hoverBg: string
  path: string
}

const UPDATE_TILES: Omit<UpdateTile, 'description'>[] = [
  {
    title: 'System MAP',
    icon: Target,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    hoverBg: 'hover:bg-[#39FF14]/[0.11]',
    path: '/map/update/system',
  },
  {
    title: 'Custom Actions',
    icon: PenLine,
    iconColor: 'text-[#BF00FF]',
    iconBg: 'bg-[#BF00FF]/15',
    hoverBg: 'hover:bg-[#BF00FF]/[0.11]',
    path: '/map/update/custom',
  },
]

const TILE_DESCRIPTIONS: Record<string, string> = {
  'System MAP': 'Update your Activate, Create, Connect, and Attend commitments.',
  'Custom Actions': 'Add personal commitments by life category.',
}

export default function MapUpdateLandingPage() {
  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Update MAP</h1>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {UPDATE_TILES.map(tile => {
            const TileIcon = tile.icon
            return (
              <Link
                key={tile.title}
                href={tile.path}
                className="group block min-w-0 touch-manipulation"
              >
                <Card
                  variant="glass"
                  className={`flex h-full min-h-[5.5rem] items-center gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 hover:border-neutral-500 ${tile.hoverBg} active:scale-[0.99]`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tile.iconBg}`}
                  >
                    <TileIcon className={`h-5 w-5 ${tile.iconColor}`} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="text-sm font-semibold leading-snug text-white">{tile.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500">
                      {TILE_DESCRIPTIONS[tile.title]}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                    aria-hidden
                  />
                </Card>
              </Link>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
