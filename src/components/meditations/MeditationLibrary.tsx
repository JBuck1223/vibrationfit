'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Heart, ListChecks, ListPlus, Pause, Pencil, Play, Share2, Trash2 } from 'lucide-react'
import { Button, DeleteConfirmationDialog, Spinner } from '@/lib/design-system/components'
import type { MeditationCard, MeditationTrack } from '@/lib/meditations/catalog'
import { PatternThumb } from './BreathWave'
import { CreatorLink } from './CreatorLink'
import { musicKey, type Preview } from './SoundPicker'

type Tab = 'mine' | 'hearted' | 'members'

type PendingDelete =
  | { kind: 'meditation'; item: MeditationCard }
  | { kind: 'track'; item: MeditationTrack }

interface MeditationLibraryProps {
  loading: boolean
  mine: MeditationCard[]
  tracks: MeditationTrack[]
  community: MeditationCard[]
  selectedMusicKey: string
  preview: Preview
  onUseTrack: (track: MeditationTrack) => void
  onUpdateTrack: (track: MeditationTrack, body: { is_favorite?: boolean; in_music_list?: boolean }) => Promise<void>
  onDeleteTrack: (track: MeditationTrack) => Promise<void>
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
  tracks,
  community,
  selectedMusicKey,
  preview,
  onUseTrack,
  onUpdateTrack,
  onDeleteTrack,
  editingId,
  onPlay,
  onEdit,
  onRemix,
  onUpdate,
  onDelete,
}: MeditationLibraryProps) {
  const [tab, setTab] = useState<Tab>('mine')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sortedMine = useMemo(
    () => [...mine].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [mine],
  )
  const hearted = useMemo(() => mine.filter((card) => card.isFavorite), [mine])
  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [tracks],
  )
  const heartedTracks = useMemo(() => tracks.filter((track) => track.isFavorite), [tracks])

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'mine', label: 'Mine', count: mine.length + tracks.length },
    { id: 'hearted', label: 'Hearted', count: hearted.length + heartedTracks.length },
    { id: 'members', label: 'From members', count: community.length },
  ]

  const cards = tab === 'mine' ? sortedMine : tab === 'hearted' ? hearted : community
  const trackRows = tab === 'mine' ? sortedTracks : tab === 'hearted' ? heartedTracks : []
  const empty = {
    mine: 'Save a meditation or create a track above and it lands here.',
    hearted: 'Heart the meditations and tracks you return to most.',
    members: 'When members share a meditation, it shows up here.',
  }[tab]

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      if (pendingDelete.kind === 'meditation') await onDelete(pendingDelete.item)
      else await onDeleteTrack(pendingDelete.item)
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
      ) : cards.length === 0 && trackRows.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-neutral-800 px-4 py-10 text-center text-sm text-neutral-500">
          {empty}
        </p>
      ) : (
        <div className="space-y-6">
          {trackRows.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Tracks</p>
              <div className="divide-y divide-neutral-800 rounded-2xl border-2 border-neutral-800 bg-neutral-900/60">
                {trackRows.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    selected={selectedMusicKey === musicKey(track)}
                    previewing={preview.previewUrl === track.url}
                    onPreview={() => preview.toggle(track.url)}
                    onUse={() => onUseTrack(track)}
                    onHeart={() => onUpdateTrack(track, { is_favorite: !track.isFavorite })}
                    onToggleMusic={() => onUpdateTrack(track, { in_music_list: !track.inMusicList })}
                    onDelete={() => setPendingDelete({ kind: 'track', item: track })}
                  />
                ))}
              </div>
            </div>
          )}

          {cards.length > 0 && (
            <div>
              {trackRows.length > 0 && (
                <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Meditations</p>
              )}
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
                    onDelete={() => setPendingDelete({ kind: 'meditation', item: card })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.kind === 'track' ? 'Delete track' : 'Delete meditation'}
        itemName={pendingDelete?.item.title}
        itemType={pendingDelete?.kind === 'track' ? 'track' : 'meditation'}
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

function formatLength(seconds: number | null) {
  if (!seconds) return null
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function TrackRow({
  track,
  selected,
  previewing,
  onPreview,
  onUse,
  onHeart,
  onToggleMusic,
  onDelete,
}: {
  track: MeditationTrack
  selected: boolean
  previewing: boolean
  onPreview: () => void
  onUse: () => void
  onHeart: () => void
  onToggleMusic: () => void
  onDelete: () => void
}) {
  const details = [
    formatLength(track.durationSeconds),
    track.referenceTitle ? `Like “${track.referenceTitle}”` : track.mood,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-center gap-2 px-2 py-2 md:px-3">
      <button
        type="button"
        onClick={onPreview}
        aria-label={previewing ? `Stop preview of ${track.title}` : `Preview ${track.title}`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
          previewing ? 'bg-[#00FFFF] text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
        }`}
      >
        {previewing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm text-white">
          <span className="truncate">{track.title}</span>
          {track.inMusicList && (
            <span className="shrink-0 rounded-full bg-[#00FFFF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00FFFF]">
              In music
            </span>
          )}
        </p>
        {details && <p className="truncate text-xs text-neutral-500">{details}</p>}
      </div>
      <Button
        size="sm"
        variant={selected ? 'primary' : 'outline'}
        onClick={onUse}
        className="hidden shrink-0 sm:inline-flex"
      >
        {selected && <Check className="mr-1 h-4 w-4" />}
        {selected ? 'Selected' : 'Use'}
      </Button>
      <CardIcon label={track.isFavorite ? 'Remove heart' : 'Heart'} active={track.isFavorite} onClick={onHeart} tone="#FF0040">
        <Heart className={`h-4 w-4 ${track.isFavorite ? 'fill-current' : ''}`} />
      </CardIcon>
      <CardIcon
        label={track.inMusicList ? 'Remove from music' : 'Add to music'}
        active={track.inMusicList}
        onClick={onToggleMusic}
        tone="#00FFFF"
      >
        {track.inMusicList ? <ListChecks className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}
      </CardIcon>
      <CardIcon label="Use in session" active={selected} onClick={onUse} className="sm:hidden">
        <Check className="h-4 w-4" />
      </CardIcon>
      <CardIcon label="Delete" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </CardIcon>
    </div>
  )
}

function CardIcon({
  label,
  active,
  tone = '#39FF14',
  onClick,
  className = '',
  children,
}: {
  label: string
  active?: boolean
  tone?: string
  onClick: () => void
  className?: string
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
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      {children}
    </button>
  )
}
