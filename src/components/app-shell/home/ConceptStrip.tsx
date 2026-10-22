'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Globe, Image as ImageIcon, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useManifestationsSnapshot } from '@/components/dashboard/widgets/queries'
import { useThemeImage } from '../ThemeProvider'
import type { ThemeSlot } from '@/lib/app-shell/theme-slots'

interface ConceptCardProps {
  eyebrow: string
  title: string
  body: string
  href: string
  icon: LucideIcon
  image: string | null
}

function ConceptCard({ eyebrow, title, body, href, icon: Icon, image }: ConceptCardProps) {
  return (
    <Link
      href={href}
      className="glass-panel group relative flex min-h-[150px] items-stretch overflow-hidden transition-colors hover:border-[#39FF14]/60"
    >
      <div className="relative w-[112px] shrink-0 md:w-[128px]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <Icon className="h-7 w-7 text-[#39FF14]" />
          </div>
        )}
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-[rgba(20,20,22,0.62)]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{eyebrow}</p>
        <h3 className="truncate text-lg font-semibold text-white">{title}</h3>
        <p className="line-clamp-2 text-sm text-white/70">{body}</p>
      </div>
      <ChevronRight className="my-auto mr-3 h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

interface ConceptStripProps {
  vision: { id: string; title: string } | null
}

/** Vision · Manifestations · My World: the three concepts the member holds. */
export function ConceptStrip({ vision }: ConceptStripProps) {
  const { data: manifestations } = useManifestationsSnapshot()
  const visionImage = useThemeImage('studio.life-vision' as ThemeSlot)
  const manifestationTheme = useThemeImage('studio.manifestations' as ThemeSlot)
  const worldImage = useThemeImage('card.2' as ThemeSlot)
  const newest = manifestations?.items?.[0] ?? null

  return (
    <section aria-label="Your concepts" className="grid gap-3 md:grid-cols-3 md:gap-4">
      <ConceptCard
        eyebrow="Life Vision"
        title={vision?.title ?? 'The Life I Choose'}
        body={vision ? 'Reconnect with the life you choose.' : 'Write the life you choose, in your words.'}
        href={vision ? `/life-vision/${vision.id}` : '/life-vision/start'}
        icon={Target}
        image={visionImage}
      />
      <ConceptCard
        eyebrow="Manifestations"
        title={newest?.name ?? 'Manifestations'}
        body={
          manifestations
            ? `${manifestations.active} active · ${manifestations.actualized} actualized`
            : 'What you are calling in, made visible.'
        }
        href={newest ? `/manifestations/${newest.id}` : '/manifestations'}
        icon={ImageIcon}
        image={newest?.image_url ?? manifestationTheme}
      />
      <ConceptCard
        eyebrow="My World"
        title="My World"
        body="Your name, people, home and work."
        href="/your-world"
        icon={Globe}
        image={worldImage}
      />
    </section>
  )
}
