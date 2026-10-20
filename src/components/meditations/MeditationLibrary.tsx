'use client'

import { useMemo, useState } from 'react'
import { Copy, Heart, Pencil, Play, Share2, Trash2 } from 'lucide-react'
import { Button, DeleteConfirmationDialog, Spinner } from '@/lib/design-system/components'
import type { MeditationCard } from '@/lib/meditations/catalog'
import { PatternThumb } from './BreathWave'
import { CreatorLink } from './CreatorLink'

type Tab = 'mine' | 'hearted' | 'members'

interface MeditationLibraryProps {
  loading: boolean
  mine: MeditationCard[]
  community: MeditationCard[]
  editingId: string | null
  onPlay: (card: MeditationCard) => void
  onEdit: (card: MeditationCard) => void
  onRemix: (card: MeditationCard) => void
  onUpdate: (card: MeditationCard, body: { is_favorite?: boolean; is_shared?: boolean }) => Promise<void>
  onDelete: (card: MeditationCard) => Promise<void>
}

export function MeditationLibrary({
  loading,
  mine,
  community,
  editingId,
  onPlay,
  onEdit,
  onRemix,
  onUpdate,
  onDelete,
}: MeditationLibraryProps) {
  const [tab, setTab] = useState<Tab>('mine')
  const [pendingDelete, setPendingDelete] = useState<MeditationCard | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sortedMine = useMemo(
    () => [...mine].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [mine],
  )
  const hearted = useMemo(() => mine.filter((card) => card.isFavorite), [mine])

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'mine', label: 'Mine', count: mine.length },
    { id: 'hearted', label: 'Hearted', count: hearted.length },
    { id: 'members', label: 'From members', count: community.length },
  ]

  const cards = tab === 'mine' ? sortedMine : tab === 'hearted' ? hearted : community
  const empty = {
    mine: 'Save a meditation above and it lands here.',
    hearted: 'Heart the meditations you return to most.',
    members: 'When members share a meditation, it shows up here.',
  }[tab]

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await onDelete(pendingDelete)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-white">Library</h2>
        <div className="flex gap-1 rounded-full bg-neutral-900 p-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs md:text-sm transition-colors ${
                tab === item.id ? 'bg-[#39FF14] text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
              {item.count > 0 && <span className="ml-1 opacity-70">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : cards.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-neutral-800 px-4 py-10 text-center text-sm text-neutral-500">
          {empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <LibraryCard
              key={card.id}
              card={card}
              editing={card.id === editingId}
              onPlay={() => onPlay(card)}
              onEdit={() => onEdit(card)}
              onRemix={() => onRemix(card)}
              onHeart={() => onUpdate(card, { is_favorite: !card.isFavorite })}
              onShare={() => onUpdate(card, { is_shared: !card.isShared })}
              onDelete={() => setPendingDelete(card)}
            />
          ))}
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete meditation"
        itemName={pendingDelete?.title}
        itemType="meditation"
        isDeleting={deleting}
      />
    </section>
  )
}

function LibraryCard({
  card,
  editing,
  onPlay,
  onEdit,
  onRemix,
  onHeart,
  onShare,
  onDelete,
}: {
  card: MeditationCard
  editing: boolean
  onPlay: () => void
  onEdit: () => void
  onRemix: () => void
  onHeart: () => void
  onShare: () => void
  onDelete: () => void
}) {
  const sound = [card.musicTitle, card.binauralTitle].filter(Boolean).join(' · ')

  return (
    <div
      className={`group flex flex-col rounded-2xl border-2 bg-gradient-to-b from-neutral-900 to-black p-4 transition-all duration-300 hover:-translate-y-1 ${
        editing ? 'border-[#00FFFF]/50' : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <div className="mb-3 rounded-xl bg-black/60 px-2 py-1">
        <PatternThumb inhale={card.inhaleSeconds} exhale={card.exhaleSeconds} />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{card.title}</p>
          {!card.isMine && (
            <p className="truncate text-xs">
              <CreatorLink userId={card.userId} name={card.creatorName} />
            </p>
          )}
        </div>
        {card.isMine && (
          <div className="flex shrink-0 gap-1">
            {card.isShared && (
              <span className="rounded-full bg-[#00FFFF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00FFFF]">
                Shared
              </span>
            )}
            {editing && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Editing
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-neutral-300">
        <span className="rounded-full bg-white/5 px-2 py-0.5 tabular-nums">{card.inhaleSeconds}s in · {card.exhaleSeconds}s out</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 tabular-nums">{card.durationMinutes} min</span>
        {card.bpm && <span className="rounded-full bg-white/5 px-2 py-0.5">{card.bpm} BPM</span>}
      </div>
      {sound && <p className="mt-2 truncate text-xs text-neutral-500">{sound}</p>}

      <div className="mt-auto flex items-center gap-1 pt-4">
        <Button size="sm" variant="primary" onClick={onPlay} className="mr-auto">
          <Play className="mr-1.5 h-4 w-4" />
          Start
        </Button>
        {card.isMine ? (
          <>
            <CardIcon label={card.isFavorite ? 'Remove heart' : 'Heart'} active={card.isFavorite} onClick={onHeart} tone="#FF0040">
              <Heart className={`h-4 w-4 ${card.isFavorite ? 'fill-current' : ''}`} />
            </CardIcon>
            <CardIcon label={card.isShared ? 'Stop sharing' : 'Share with members'} active={card.isShared} onClick={onShare} tone="#00FFFF">
              <Share2 className="h-4 w-4" />
            </CardIcon>
            <CardIcon label="Edit" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </CardIcon>
            <CardIcon label="Delete" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </CardIcon>
          </>
        ) : (
          <CardIcon label="Make a copy to edit" onClick={onRemix}>
            <Copy className="h-4 w-4" />
          </CardIcon>
        )}
      </div>
    </div>
  )
}

function CardIcon({
  label,
  active,
  tone = '#39FF14',
  onClick,
  children,
}: {
  label: string
  active?: boolean
  tone?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      style={active ? { color: tone, backgroundColor: `${tone}1A` } : undefined}
      className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}
