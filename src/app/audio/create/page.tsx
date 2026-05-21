'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container, Stack, Card } from '@/lib/design-system/components'
import { AudioLines, ChevronRight, Mic, Sliders, Clock, Music2 } from 'lucide-react'

interface CreateTile {
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  hoverBg: string
  path: string
}

const CREATE_TILES: CreateTile[] = [
  {
    title: 'Generate Voice Audio',
    description: 'Generate voice narration from your Life Vision or Stories with VIVA voices.',
    icon: AudioLines,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    hoverBg: 'hover:bg-[#39FF14]/[0.11]',
    path: '/audio/generate',
  },
  {
    title: 'Record in Your Voice',
    description: 'Read your Life Vision or Story aloud and create a personal voice recording.',
    icon: Mic,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    hoverBg: 'hover:bg-cyan-500/[0.11]',
    path: '/audio/record',
  },
  {
    title: 'Mix Audio',
    description: 'Add background music and binaural beats to your existing voice tracks.',
    icon: Sliders,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/15',
    hoverBg: 'hover:bg-teal-500/[0.11]',
    path: '/audio/mix',
  },
  {
    title: 'Songwriter',
    description: 'Create original songs from your visions, journals, and life experiences with VIVA.',
    icon: Music2,
    iconColor: 'text-[#FFFF00]',
    iconBg: 'bg-[#FFFF00]/15',
    hoverBg: 'hover:bg-[#FFFF00]/[0.11]',
    path: '/audio/songwriter',
  },
  {
    title: 'Generation Queue',
    description: 'Track the progress of your audio generation and mixing jobs.',
    icon: Clock,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    hoverBg: 'hover:bg-purple-500/[0.11]',
    path: '/audio/queue',
  },
]

export default function CreatePage() {
  const pathname = usePathname()
  const pathPrefix = pathname.startsWith('/intensive/') ? '/intensive' : ''

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Create Audio</h1>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {CREATE_TILES.map(tile => {
            const TileIcon = tile.icon
            return (
              <Link
                key={tile.title}
                href={`${pathPrefix}${tile.path}`}
                className="group block min-w-0 touch-manipulation"
              >
                <Card
                  variant="glass"
                  className={`flex h-full min-h-[5.5rem] items-center gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 lg:flex-col lg:items-center lg:gap-2.5 lg:p-3 lg:text-center hover:border-neutral-500 ${tile.hoverBg} active:scale-[0.99]`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:h-10 lg:w-10 ${tile.iconBg}`}
                  >
                    <TileIcon className={`h-5 w-5 ${tile.iconColor}`} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5 lg:flex-none lg:w-full">
                    <h3 className="text-sm font-semibold leading-snug text-white lg:text-[13px]">
                      {tile.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500 lg:line-clamp-3 lg:text-[11px]">
                      {tile.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400 lg:hidden"
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
