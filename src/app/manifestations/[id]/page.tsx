'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowUpRight, Check, Plus, Unlink } from 'lucide-react'
import { Container, Card, Button, ButtonLink, Spinner, Stack } from '@/lib/design-system'
import { keys } from '@/lib/query/keys'
import {
  SLOT_LABELS,
  HANDOFF_SLOTS,
  assetLink,
  type KitSlot,
  type ManifestationKit,
  type ManifestationKitAsset,
} from '@/lib/manifestations/types'
import { AddExistingToKitModal } from '@/components/manifestations-studio/AddExistingToKitModal'
import { GatherFromLibrary } from '@/components/manifestations-studio/GatherFromLibrary'

const STUDIO_CARD =
  '!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]'

interface KitProject {
  id: string
  title: string
  description: string | null
  status: string
}

interface KitAsset extends ManifestationKitAsset {
  label?: string | null
}

interface KitDetail {
  kit: ManifestationKit
  assets: KitAsset[]
  activations_this_week: number
  activations_since_opened: number
  projects: KitProject[]
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2A2A2A]" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{children}</p>
      <div className="h-px flex-1 bg-[#2A2A2A]" />
    </div>
  )
}

async function fetchKit(id: string): Promise<KitDetail> {
  const res = await fetch(`/api/manifestations/${id}`)
  if (!res.ok) throw new Error('Failed to load manifestation')
  return res.json()
}

function AssetRow({
  asset,
  onUnlink,
}: {
  asset: KitAsset
  onUnlink: (id: string) => void
}) {
  const href = assetLink(asset.slot as KitSlot, asset.entity_id, asset.handoff_path)
  const statusLabel =
    asset.status === 'handoff' ? 'Handoff' :
    asset.status === 'ready' ? 'Ready' :
    asset.status === 'actualized' ? 'Actualized' :
    asset.status === 'skipped' ? 'Skipped' : 'Queued'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3">
      <Link href={href} className="flex-1 min-w-0 hover:text-white">
        <p className="text-sm text-white truncate">{asset.label || SLOT_LABELS[asset.slot as KitSlot] || asset.slot}</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{SLOT_LABELS[asset.slot as KitSlot]} · {statusLabel}</p>
      </Link>
      <Link href={href} className="text-neutral-500 hover:text-white">
        <ArrowUpRight className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => onUnlink(asset.id)}
        className="text-neutral-500 hover:text-white"
        title="Remove from this manifestation"
      >
        <Unlink className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ManifestationKitPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const id = params.id
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSlot, setPickerSlot] = useState<KitSlot>('journal')
  const [showGather, setShowGather] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: keys.manifestationKit(id),
    queryFn: () => fetchKit(id),
    enabled: Boolean(id),
  })

  const suite = useMemo(() => (data?.assets || []).filter(a => a.layer === 'suite'), [data])
  const evidence = useMemo(() => (data?.assets || []).filter(a => a.layer === 'evidence'), [data])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.manifestationKit(id) })
    queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
  }

  const unlink = async (assetId: string) => {
    await fetch(`/api/manifestations/${id}/assets/${assetId}`, { method: 'DELETE' })
    refresh()
  }

  const actualize = async () => {
    if (!data || data.kit.status === 'actualized') return
    if (!confirm(`Actualize "${data.kit.title}"? Only do this when it is real.`)) return
    const res = await fetch(`/api/manifestations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'actualized' }),
    })
    if (res.ok) refresh()
  }

  const markShowedUp = async () => {
    await fetch(`/api/manifestations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate' }),
    })
    refresh()
  }

  const openPicker = (slot: KitSlot) => {
    setPickerSlot(slot)
    setPickerOpen(true)
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const { kit } = data
  const isActualized = kit.status === 'actualized'
  const isEmpty = data.assets.length === 0 && data.projects.length === 0

  return (
    <Container size="xl">
      <Card variant="outlined" className={STUDIO_CARD}>
        <Stack gap="lg">
          <section className="space-y-3 text-center">
            <SectionLabel>Manifestation</SectionLabel>
            <p className="text-base font-medium text-white text-center rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3">
              {kit.title}
            </p>
            {kit.chosen_reality && (
              <p className="text-sm text-neutral-400">{kit.chosen_reality}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isActualized
                  ? 'text-primary-400 bg-primary-500/10 border-primary-500/30'
                  : 'text-neutral-400 bg-[#1A1A1A] border-[#282828]'
              }`}>
                {isActualized ? 'Actualized' : 'Open'}
              </span>
              {kit.life_categories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#282828] text-neutral-300 bg-[#1A1A1A]"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              ))}
            </div>
            <div className="flex justify-center">
              <ButtonLink href="/viva" variant="ghost" size="sm">Continue in VIVA</ButtonLink>
            </div>
          </section>

          {isEmpty && !isActualized && (
            <section className="space-y-3">
              <SectionLabel>Gather</SectionLabel>
              <p className="text-sm text-neutral-400 text-center">
                Gather from what you already have, or add one item.
              </p>
              {showGather ? (
                <GatherFromLibrary
                  kitId={id}
                  categories={kit.life_categories}
                  query={kit.title}
                  onPinned={() => { setShowGather(false); refresh() }}
                />
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button size="sm" variant="primary" onClick={() => setShowGather(true)}>
                    Gather from what I have
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openPicker('journal')}>
                    Add an item
                  </Button>
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <SectionLabel>Suite</SectionLabel>
            <p className="text-sm text-neutral-500 text-center">The new vibe, queued.</p>
            {!isActualized && (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" onClick={() => openPicker('story')}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            )}
            <Stack gap="sm">
              {suite.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center">No suite slots yet.</p>
              ) : (
                suite.map(asset => <AssetRow key={asset.id} asset={asset} onUnlink={unlink} />)
              )}
              {Object.entries(HANDOFF_SLOTS).map(([slot, path]) => {
                if (suite.some(a => a.slot === slot)) return null
                return (
                  <Link
                    key={slot}
                    href={path}
                    className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#282828] bg-[#1A1A1A] px-4 py-3 text-sm text-neutral-400 hover:border-neutral-600"
                  >
                    <span>{SLOT_LABELS[slot as KitSlot]} — handoff</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )
              })}
            </Stack>
          </section>

          <section className="space-y-3">
            <SectionLabel>Activations</SectionLabel>
            <p className="text-sm text-neutral-500 text-center">You showed up for this reality.</p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl text-white">{data.activations_this_week}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">This week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-white">{data.activations_since_opened}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Since opened</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={markShowedUp} disabled={isActualized}>
                I showed up
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <SectionLabel>Projects</SectionLabel>
            <p className="text-sm text-neutral-500 text-center">Inspired action for this reality.</p>
            {!isActualized && (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" onClick={() => openPicker('project')}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            )}
            <Stack gap="sm">
              {data.projects.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center">No projects yet.</p>
              ) : (
                data.projects.map(project => {
                  const asset = data.assets.find(a => a.slot === 'project' && a.entity_id === project.id)
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3"
                    >
                      <Link href={`/projects/${project.id}`} className="flex-1 min-w-0 hover:text-white">
                        <p className="text-sm text-white truncate">{project.title}</p>
                        {project.description && (
                          <p className="text-xs text-neutral-500 line-clamp-1">{project.description}</p>
                        )}
                      </Link>
                      <Link href={`/projects/${project.id}`} className="text-neutral-500 hover:text-white">
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      {asset && (
                        <button
                          type="button"
                          onClick={() => unlink(asset.id)}
                          className="text-neutral-500 hover:text-white"
                          title="Remove from this manifestation"
                        >
                          <Unlink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </Stack>
          </section>

          <section className="space-y-3">
            <SectionLabel>Becoming</SectionLabel>
            <p className="text-sm text-neutral-500 text-center">Pinned evidence. Nothing is attached silently.</p>
            {!isActualized && (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" onClick={() => openPicker('journal')}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            )}
            <Stack gap="sm">
              {evidence.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center">No pins yet.</p>
              ) : (
                evidence.map(asset => <AssetRow key={asset.id} asset={asset} onUnlink={unlink} />)
              )}
            </Stack>
          </section>

          <section className="space-y-3">
            <SectionLabel>Actualize</SectionLabel>
            <p className="text-sm text-neutral-400 text-center">
              Only you mark this. There is no percentage bar. When this reality is real, Actualize it.
            </p>
            <div className="flex justify-center">
              {isActualized ? (
                <p className="inline-flex items-center gap-2 text-sm text-[#39FF14]">
                  <Check className="h-4 w-4" /> Actualized
                  {kit.actualized_at ? ` · ${new Date(kit.actualized_at).toLocaleDateString()}` : ''}
                </p>
              ) : (
                <Button variant="primary" onClick={actualize}>Actualize</Button>
              )}
            </div>
          </section>
        </Stack>
      </Card>

      <AddExistingToKitModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        kitId={id}
        defaultSlot={pickerSlot}
        onPinned={refresh}
      />
    </Container>
  )
}
