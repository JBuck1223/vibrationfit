'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Image as ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { useManifestationsSnapshot } from './queries'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

const ROTATE_MS = 8000

export function ManifestationsWidget(chrome: WidgetChromeProps) {
  const { data, isLoading } = useManifestationsSnapshot()
  const items = useMemo(() => data?.items ?? [], [data])
  const slots = isWideWidget(chrome.size) ? 4 : 2
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (items.length <= slots) return
    const id = setInterval(() => setOffset((o) => (o + slots) % items.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [items.length, slots])

  const visible = useMemo(() => {
    if (items.length === 0) return []
    return Array.from({ length: Math.min(slots, items.length) }, (_, i) => items[(offset + i) % items.length])
  }, [items, offset, slots])

  return (
    <WidgetFrame
      {...chrome}
      title="Manifestations"
      icon={ImageIcon}
      accent="#BF00FF"
      href="/manifestations"
      hrefLabel="Open board"
      loading={isLoading}
    >
      {items.length === 0 ? (
        <WidgetEmpty
          title="Your board is waiting"
          body="Add the things you are living into. VIVA can generate the images from your vision."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/manifestations/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add a manifestation
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className={cn('grid gap-2', slots === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}>
            {visible.map((item) => (
              <Link
                key={item.id}
                href={`/manifestations/${item.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.05]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.name ?? ''}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-[11px] font-medium text-white">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-neutral-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
              <span className="font-semibold text-white">{data?.actualized ?? 0}</span> actualized ·{' '}
              <span className="font-semibold text-white">{data?.active ?? 0}</span> active
            </p>
            <Link
              href="/manifestations?status=active"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-500 hover:underline"
            >
              Mark one actualized
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
