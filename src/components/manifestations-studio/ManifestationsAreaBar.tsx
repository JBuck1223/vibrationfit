'use client'

import { useSyncExternalStore } from 'react'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { Plus, Wand2 } from 'lucide-react'
import { AreaBar, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useManifestationsStudio } from './ManifestationsStudioContext'

const emptySubscribe = () => () => {}

function AreaBarSkeleton() {
  return (
    <>
      <div className="md:hidden">
        <div className="sticky top-0 z-30 w-full min-w-0 border-b border-neutral-800/60 bg-neutral-850">
          <div
            className="flex items-center justify-center gap-2.5 px-4 pb-2.5"
            style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
              <Wand2 className="h-4 w-4 text-[#39FF14]" />
            </div>
            <span className="max-w-[min(72vw,18rem)] truncate text-base font-bold tracking-tight text-white">
              My Manifestations
            </span>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="border-b border-neutral-800/60 bg-neutral-850">
          <div className="px-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#39FF14]/10">
                  <Wand2 className="h-5 w-5 text-[#39FF14]" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">My Manifestations</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function ManifestationsAreaBar() {
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const segment = useSelectedLayoutSegment()
  const router = useRouter()
  const { kits } = useManifestationsStudio()

  const isDetail = Boolean(segment && segment !== 'new')
  const kitId = segment && segment !== 'new' ? segment : ''

  let versionSelectors: AreaBarVersionSelector[] | undefined
  if (isDetail) {
    versionSelectors = [{
      id: 'manifestation',
      label: 'Manifestation',
      icon: Wand2,
      position: 'contextRow',
      searchable: true,
      options: kits.map(kit => ({
        id: kit.id,
        label: kit.title,
        sublabel: kit.status === 'actualized' ? 'Actualized' : 'Open',
        icon: Wand2,
      })),
      selectedId: kitId,
      onSelect: (id: string) => {
        if (id !== kitId) router.push(`/manifestations/${id}`)
      },
    }]
  }

  if (!hydrated) return <AreaBarSkeleton />

  return (
    <AreaBar
      area={{ name: 'My Manifestations', icon: Wand2 }}
      tabs={[
        { label: 'My Manifestations', path: '/manifestations', icon: Wand2 },
        { label: 'New', path: '/manifestations/new', icon: Plus },
      ]}
      versionSelectors={versionSelectors}
      keepTabActive
      activeParentPath={isDetail ? '/manifestations' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
