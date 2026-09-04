'use client'

/**
 * CommitVisionDialog — shared commit-as-active flow for every Life Vision
 * commit entry point.
 *
 * Step 1: confirm the commit (existing POST /api/vision/draft/commit).
 * Step 2: "Generate your Activation Kit?" — default kit prefilled, saved-kit
 *         selector, every setting editable inline, optional save-back, Skip.
 *
 * Nothing generates until the member confirms; generation fires in the
 * background and the vision page's progress card takes over.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mic, Music, Image as ImageIcon, Loader2, Play, Pause, Plus, ChevronDown, ChevronUp, Trash2, Package } from 'lucide-react'
import { Modal, Button, Spinner, Select, Checkbox, Input } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { commitDraft } from '@/lib/life-vision/draft-helpers'
import { keys } from '@/lib/query/keys'
import { NATURAL_VIBE_ID, VOICE_VIBES, buildVoiceId, parseVoiceId } from '@/lib/audio/voice-vibes'
import { LIFE_CATEGORY_KEYS, getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

const MAX_BOARD_PICKS = 8

interface BoardSuggestion {
  id: string
  category: string
  title: string
  description: string
  image_prompt?: string
}

interface KitRow {
  id: string
  name: string
  is_default: boolean
  include_voice: boolean
  include_mix: boolean
  include_board: boolean
  voice_id: string
  background_track_id: string | null
  extra_background_track_ids: string[]
  voice_volume: number
  bg_volume: number
  binaural_track_id: string | null
  binaural_volume: number
  mix_output_format: 'individual' | 'combined' | 'both'
}

type KitSettingsState = Omit<KitRow, 'id' | 'name' | 'is_default'>

interface CommitVisionDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Draft to commit. Omit when opening kit-only for an already-active vision. */
  draftId?: string
  /** Kit-only mode: skip the commit and configure a kit for this committed vision. */
  kitOnlyVisionId?: string
  /** Called after a successful commit with the new active vision id (both confirm and skip paths). */
  onCommitted?: (visionId: string) => void
  /** Skip the initial "commit?" confirmation (when the caller already confirmed). */
  skipCommitConfirmation?: boolean
}

const OUTPUT_FORMAT_OPTIONS = [
  { value: 'both', label: 'Sections + combined full track' },
  { value: 'individual', label: 'Individual sections only' },
  { value: 'combined', label: 'Combined full track only' },
] as const

/** Round play/pause button that sits beside a Select and previews the selected audio. */
function PreviewButton({
  playing,
  disabled,
  onClick,
  label,
}: {
  playing: boolean
  disabled: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={playing ? `Pause ${label} preview` : `Play ${label} preview`}
      title={disabled ? 'No preview available' : playing ? 'Pause preview' : 'Preview'}
      className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border transition-colors ${
        playing
          ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]'
          : 'border-[#666666] bg-[#404040] text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14]'
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#666666] disabled:hover:text-neutral-300`}
    >
      {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
    </button>
  )
}

function IconActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border border-[#666666] bg-[#404040] text-neutral-300 transition-colors hover:border-[#FF0040] hover:text-[#FF0040]"
    >
      {children}
    </button>
  )
}

function BoardSuggestionPicker({
  suggestions,
  selectedIds,
  loading,
  error,
  onRetry,
  onToggle,
  onSelectAll,
  onClear,
}: {
  suggestions: BoardSuggestion[]
  selectedIds: string[]
  loading: boolean
  error: boolean
  onRetry: () => void
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  const selectedSet = new Set(selectedIds)
  const atCap = selectedIds.length >= MAX_BOARD_PICKS
  const groups = LIFE_CATEGORY_KEYS
    .map((key) => ({
      key,
      label: getVisionCategoryLabel(key as VisionCategoryKey),
      items: suggestions.filter((s) => s.category === key),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-3 rounded-xl border border-[#333] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-white">Board scenes</div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Check the scenes you want VIVA to generate. Nothing is selected until you choose.
            {suggestions.length > 0 ? ` Up to ${MAX_BOARD_PICKS}.` : ''}
          </p>
        </div>
        {suggestions.length > 0 && (
          <div className="flex gap-3 text-xs font-medium">
            <button type="button" onClick={onSelectAll} className="text-[#00FFFF] hover:opacity-80">
              Select all
            </button>
            <button type="button" onClick={onClear} className="text-neutral-400 hover:text-white">
              Clear
            </button>
          </div>
        )}
      </div>

      {loading && suggestions.length === 0 && (
        <div className="flex items-center gap-2 py-3 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          VIVA is reading your vision for board scenes…
        </div>
      )}

      {error && suggestions.length === 0 && (
        <div className="space-y-2 py-1">
          <p className="text-sm text-neutral-400">
            VIVA could not load scenes. You can still generate voice or mixes, or try again.
          </p>
          <button type="button" onClick={onRetry} className="text-sm font-medium text-[#00FFFF] hover:opacity-80">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <p className="text-sm text-neutral-400">
          No board scenes yet. Add more specific moments to your vision, or generate voice and mixes now.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {group.label}
          </div>
          <div className="space-y-2">
            {group.items.map((suggestion) => {
              const checked = selectedSet.has(suggestion.id)
              const locked = !checked && atCap
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(suggestion.id)}
                  className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                    checked
                      ? 'border-[#39FF14] bg-[#39FF14]/5'
                      : locked
                        ? 'cursor-not-allowed border-[#333] bg-[#0A0A0A] opacity-50'
                        : 'border-[#333] bg-[#0A0A0A] hover:border-[#555]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
                        checked ? 'border-[#39FF14] bg-[#39FF14]' : 'border-[#666666]'
                      }`}
                    >
                      {checked && <span className="block h-2 w-2 rounded-sm bg-black" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-white">{suggestion.title}</span>
                      {suggestion.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">
                          {suggestion.description}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {settingsHint(selectedIds.length, suggestions.length)}
    </div>
  )
}

function settingsHint(selectedCount: number, total: number) {
  if (total === 0) return null
  if (selectedCount === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No scenes selected — board images will be skipped.
      </p>
    )
  }
  return (
    <p className="text-xs text-neutral-500">
      {selectedCount} of {Math.min(total, MAX_BOARD_PICKS)} selected
    </p>
  )
}

export function CommitVisionDialog({
  isOpen,
  onClose,
  draftId,
  kitOnlyVisionId,
  onCommitted,
  skipCommitConfirmation = false,
}: CommitVisionDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<'confirm' | 'committing' | 'kit' | 'started'>('confirm')
  const [committedVisionId, setCommittedVisionId] = useState<string | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [settings, setSettings] = useState<KitSettingsState | null>(null)
  const [saveToKit, setSaveToKit] = useState(true)
  const [kitName, setKitName] = useState('')
  const [launching, setLaunching] = useState(false)
  const [openMixIndex, setOpenMixIndex] = useState(0)
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([])

  // Audio preview (voice / background / frequency)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.src = ''
    }
    setPreviewing(null)
  }

  const togglePreview = (key: string, url: string | null | undefined) => {
    if (!url) return
    if (previewing === key) {
      stopPreview()
      return
    }
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio()
      previewAudioRef.current.addEventListener('ended', () => setPreviewing(null))
    }
    previewAudioRef.current.src = url
    previewAudioRef.current.currentTime = 0
    previewAudioRef.current.play().catch(() => setPreviewing(null))
    setPreviewing(key)
  }

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (kitOnlyVisionId) {
        setCommittedVisionId(kitOnlyVisionId)
        setStep('kit')
      } else {
        setStep(skipCommitConfirmation ? 'committing' : 'confirm')
        setCommittedVisionId(null)
      }
      setCommitError(null)
      setSaveToKit(true)
      setKitName('')
      setLaunching(false)
      setOpenMixIndex(0)
      setSelectedBoardIds([])
    } else if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.src = ''
      setPreviewing(null)
    }
  }, [isOpen, skipCommitConfirmation, kitOnlyVisionId])

  // Tear the preview player down on unmount
  useEffect(() => () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.src = ''
    }
  }, [])

  // Saved kits (lazily seeded server-side)
  const { data: kits = [] } = useQuery<KitRow[]>({
    queryKey: keys.activationKits,
    enabled: isOpen,
    queryFn: async () => {
      const res = await fetch('/api/activation-kit/kits')
      if (!res.ok) throw new Error('Failed to load kits')
      const { kits } = await res.json()
      return kits
    },
  })

  const { data: voices = [] } = useQuery<Array<{ id: string; name: string; previewUrl?: string | null }>>({
    queryKey: ['activation-kit-dialog', 'voices'],
    enabled: isOpen,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/audio/voices')
      const { voices } = await res.json()
      return voices || []
    },
  })

  const { data: vibes = [] } = useQuery<Array<{ id: string; name: string; description?: string; previewUrl?: string | null }>>({
    queryKey: ['activation-kit-dialog', 'vibes'],
    enabled: isOpen,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/audio/vibes')
      const { vibes } = await res.json()
      return vibes || VOICE_VIBES.map((v) => ({ id: v.id, name: v.label, description: v.description, previewUrl: null }))
    },
  })

  const { data: tracks } = useQuery<{
    background: Array<{ id: string; display_name: string; file_url: string | null }>
    frequency: Array<{ id: string; display_name: string; file_url: string | null }>
  }>({
    queryKey: ['activation-kit-dialog', 'background-tracks', 'v3'],
    enabled: isOpen,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from('audio_background_tracks')
        .select('id, display_name, category, file_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      const rows = data || []
      const FREQUENCY_CATEGORIES = ['binaural', 'solfeggio', 'solfeggio_binaural']
      return {
        background: rows.filter((t) => !FREQUENCY_CATEGORIES.includes(t.category)),
        frequency: rows.filter((t) => FREQUENCY_CATEGORIES.includes(t.category)),
      }
    },
  })

  const {
    data: boardSuggestions = [],
    isFetching: boardSuggestionsLoading,
    isError: boardSuggestionsError,
    refetch: refetchBoardSuggestions,
  } = useQuery<BoardSuggestion[]>({
    queryKey: ['activation-kit-dialog', 'board-suggestions', committedVisionId],
    enabled: isOpen && step === 'kit' && Boolean(committedVisionId) && Boolean(settings?.include_board),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch('/api/activation-kit/board-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: committedVisionId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load board suggestions')
      }
      const { suggestions } = await res.json()
      return Array.isArray(suggestions) ? suggestions : []
    },
  })

  // Prefill from the default kit once kits load
  useEffect(() => {
    if (!isOpen || settings || kits.length === 0) return
    const defaultKit = kits.find((k) => k.is_default) || kits[0]
    applyKit(defaultKit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, kits, settings])

  function applyKit(kit: KitRow) {
    stopPreview()
    setOpenMixIndex(0)
    setSelectedKitId(kit.id)
    setKitName(kit.name && kit.name !== 'My Activation Kit' ? kit.name : '')
    setSettings({
      include_voice: kit.include_voice,
      include_mix: kit.include_mix,
      include_board: kit.include_board,
      voice_id: kit.voice_id,
      background_track_id: kit.background_track_id,
      extra_background_track_ids: Array.isArray(kit.extra_background_track_ids)
        ? kit.extra_background_track_ids.filter((id) => typeof id === 'string' && id.length > 0)
        : [],
      voice_volume: kit.voice_volume,
      bg_volume: kit.bg_volume,
      binaural_track_id: kit.binaural_track_id,
      binaural_volume: kit.binaural_volume,
      mix_output_format: kit.mix_output_format,
    })
  }

  // Commit step
  useEffect(() => {
    if (step !== 'committing' || !draftId) return
    let cancelled = false
    ;(async () => {
      try {
        const vision = await commitDraft(draftId)
        if (cancelled) return
        setCommittedVisionId(vision.id)
        queryClient.invalidateQueries({ queryKey: keys.visions })
        setStep('kit')
      } catch (err) {
        if (cancelled) return
        setCommitError(err instanceof Error ? err.message : 'Failed to commit draft')
        setStep('confirm')
      }
    })()
    return () => { cancelled = true }
  }, [step, draftId, queryClient])

  function finish(visionId: string) {
    onClose()
    if (onCommitted) onCommitted(visionId)
    else router.push(`/life-vision/${visionId}`)
  }

  async function handleGenerate() {
    if (!committedVisionId || !settings) return
    setLaunching(true)

    // Persist settings back to the kit when asked
    const selectedSuggestions = settings.include_board
      ? boardSuggestions.filter((s) => selectedBoardIds.includes(s.id)).slice(0, MAX_BOARD_PICKS)
      : []
    const payloadSettings = {
      ...settings,
      extra_background_track_ids: settings.extra_background_track_ids.filter(
        (id) => id && id !== settings.background_track_id,
      ),
      board_suggestions: selectedSuggestions,
    }
    const { board_suggestions: _boardSuggestions, ...kitSettings } = payloadSettings

    if (saveToKit) {
      const name = kitName.trim()
      const kitPayload = {
        ...kitSettings,
        ...(name ? { name } : {}),
      }
      if (selectedKitId) {
        fetch('/api/activation-kit/kits', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedKitId, ...kitPayload }),
        })
          .then(() => queryClient.invalidateQueries({ queryKey: keys.activationKits }))
          .catch(() => {})
      } else {
        fetch('/api/activation-kit/kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_default: true, ...kitPayload }),
        })
          .then(() => queryClient.invalidateQueries({ queryKey: keys.activationKits }))
          .catch(() => {})
      }
    }

    // Fire the kit run; the vision page progress card tracks it from here
    fetch('/api/activation-kit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visionId: committedVisionId, kitId: selectedKitId, settings: payloadSettings }),
    })
      .then(() => queryClient.invalidateQueries({ queryKey: keys.activationKitRuns }))
      .catch((err) => console.error('Activation Kit generation failed to start:', err))

    setLaunching(false)
    setStep('started')
  }

  const anyAssetSelected = settings
    ? settings.include_voice || settings.include_mix || settings.include_board
    : false
  const mixReady = !settings?.include_mix || Boolean(settings.background_track_id)
  const boardOnly = Boolean(settings?.include_board && !settings.include_voice && !settings.include_mix)
  const boardPicksReady = !settings?.include_board
    || boardSuggestionsError
    || (!boardSuggestionsLoading && (selectedBoardIds.length > 0 || !boardOnly))
  const canGenerate = Boolean(settings && anyAssetSelected && mixReady && boardPicksReady && !launching)

  const backgroundTracks = tracks?.background || []
  const extraIds = settings?.extra_background_track_ids || []
  const takenTrackIds = new Set(
    [settings?.background_track_id, ...extraIds].filter((id): id is string => Boolean(id)),
  )
  const unusedBackgroundCount = backgroundTracks.filter((t) => !takenTrackIds.has(t.id)).length
  const emptyMixCount = extraIds.filter((id) => !id).length + (settings?.background_track_id ? 0 : 1)
  const canAddMix = unusedBackgroundCount > emptyMixCount

  function backgroundOptions(currentId: string | null) {
    return backgroundTracks
      .filter((t) => t.id === currentId || !takenTrackIds.has(t.id))
      .map((t) => ({ value: t.id, label: t.display_name }))
  }

  // The extra layer is a frequency (Hz) track
  const extraLayerTrack = settings?.binaural_track_id
    ? (tracks?.frequency || []).find((t) => t.id === settings.binaural_track_id) || null
    : null

  const parsedVoice = parseVoiceId(settings?.voice_id)
  const selectedVibeId = parsedVoice.vibe || NATURAL_VIBE_ID
  const selectedVibe = vibes.find((v) => v.id === selectedVibeId)
  const toneOptions = (vibes.length > 0
    ? vibes
    : VOICE_VIBES.map((v) => ({ id: v.id, name: v.label, description: v.description, previewUrl: null as string | null }))
  ).map((v) => ({ value: v.id, label: v.name }))

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (step === 'confirm') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Commit as Active Vision"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => { setCommitError(null); setStep('committing') }}>
              Commit as Active
            </Button>
          </div>
        }
      >
        <p className="text-neutral-300">
          This draft becomes your active Life Vision. Your current active vision is preserved
          as a previous version.
        </p>
        {commitError && (
          <p className="mt-4 text-sm text-[#FF0040]">{commitError}</p>
        )}
      </Modal>
    )
  }

  if (step === 'committing') {
    return (
      <Modal isOpen={isOpen} onClose={() => {}} showCloseButton={false} size="sm">
        <div className="flex flex-col items-center gap-4 py-6">
          <Spinner size="lg" />
          <p className="text-neutral-300">Committing your vision…</p>
        </div>
      </Modal>
    )
  }

  if (step === 'started') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => committedVisionId && finish(committedVisionId)}
        title="Your Activation Kit is generating"
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                onClose()
                router.push('/audio/queue')
              }}
            >
              View audio queue
            </Button>
            <Button
              variant="primary"
              onClick={() => committedVisionId && finish(committedVisionId)}
            >
              View my vision
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BF00FF]/10">
            <Package className="h-6 w-6 text-[#BF00FF]" />
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed">
            VIVA is building your voice tracks first, then mixes and board images.
            This keeps going if you leave. Watch progress on your Life Vision page,
            or the audio queue once mixes start.
          </p>
        </div>
      </Modal>
    )
  }

  // Kit step
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => committedVisionId && finish(committedVisionId)}
      title="Generate Activation Kit"
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => committedVisionId && finish(committedVisionId)}
            disabled={launching}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {launching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Starting…
              </span>
            ) : (
              'Generate My Kit'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-neutral-300 text-sm text-center">
          Let VIVA generate fresh assets to activate your Life Vision.
        </p>

        {!settings ? (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        ) : (
          <>
            {/* Saved kit selector */}
            {kits.length > 1 && (
              <Select
                label="Saved kit"
                value={selectedKitId || ''}
                onChange={(kitId) => {
                  const kit = kits.find((k) => k.id === kitId)
                  if (kit) applyKit(kit)
                }}
                options={kits.map((kit) => ({
                  value: kit.id,
                  label: `${kit.name}${kit.is_default ? ' (default)' : ''}`,
                }))}
              />
            )}

            {/* Asset toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { key: 'include_voice' as const, label: 'Voice Tracks', desc: 'Narration of each section', icon: Mic },
                { key: 'include_mix' as const, label: 'Audio Mixes', desc: 'Voice + background music', icon: Music },
                { key: 'include_board' as const, label: 'Board Images', desc: 'Pick scenes from your vision', icon: ImageIcon },
              ]).map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const next = !settings[key]
                    setSettings({ ...settings, [key]: next })
                    if (key === 'include_board' && !next) setSelectedBoardIds([])
                  }}
                  className={`text-left rounded-xl border-2 p-4 transition-colors ${
                    settings[key]
                      ? 'border-[#39FF14] bg-[#39FF14]/5'
                      : 'border-[#333] bg-[#0A0A0A] opacity-60'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${settings[key] ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>

            {settings.include_board && (
              <BoardSuggestionPicker
                suggestions={boardSuggestions}
                selectedIds={selectedBoardIds}
                loading={boardSuggestionsLoading}
                error={boardSuggestionsError}
                onRetry={() => refetchBoardSuggestions()}
                onToggle={(id) => {
                  setSelectedBoardIds((prev) => {
                    if (prev.includes(id)) return prev.filter((item) => item !== id)
                    if (prev.length >= MAX_BOARD_PICKS) return prev
                    return [...prev, id]
                  })
                }}
                onSelectAll={() => {
                  setSelectedBoardIds(boardSuggestions.slice(0, MAX_BOARD_PICKS).map((s) => s.id))
                }}
                onClear={() => setSelectedBoardIds([])}
              />
            )}

            {/* Voice + tone */}
            {(settings.include_voice || settings.include_mix) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">Voice</label>
                  <div className="flex items-start gap-2">
                    <Select
                      className="flex-1 min-w-0"
                      value={parsedVoice.voice}
                      onChange={(voice) => {
                        stopPreview()
                        setSettings({ ...settings, voice_id: buildVoiceId(voice, selectedVibeId) })
                      }}
                      options={[
                        ...voices.map((v) => ({ value: v.id, label: v.name })),
                        ...(parsedVoice.voice && !voices.some((v) => v.id === parsedVoice.voice)
                          ? [{ value: parsedVoice.voice, label: parsedVoice.voice }]
                          : []),
                      ]}
                    />
                    <PreviewButton
                      label="voice"
                      playing={previewing === 'voice'}
                      disabled={!voices.find((v) => v.id === parsedVoice.voice)?.previewUrl}
                      onClick={() => togglePreview('voice', voices.find((v) => v.id === parsedVoice.voice)?.previewUrl)}
                    />
                  </div>
                </div>

                {parsedVoice.voice && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-2">Tone</label>
                    <div className="flex items-start gap-2">
                      <Select
                        className="flex-1 min-w-0"
                        value={selectedVibeId}
                        onChange={(vibe) => {
                          stopPreview()
                          setSettings({ ...settings, voice_id: buildVoiceId(parsedVoice.voice, vibe) })
                        }}
                        options={toneOptions}
                      />
                      <PreviewButton
                        label="tone"
                        playing={previewing === 'tone'}
                        disabled={!selectedVibe?.previewUrl}
                        onClick={() => togglePreview('tone', selectedVibe?.previewUrl)}
                      />
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      {selectedVibe?.description || 'Choose the feel of the narration. Previews use a sample voice.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mix settings */}
            {settings.include_mix && (
              <div className="space-y-4">
                {[
                  { index: 0, trackId: settings.background_track_id || '' },
                  ...settings.extra_background_track_ids.map((trackId, extraIndex) => ({
                    index: extraIndex + 1,
                    trackId,
                  })),
                ].map(({ index, trackId }) => {
                  const isOpen = openMixIndex === index
                  const track = backgroundTracks.find((t) => t.id === trackId)
                  const previewKey = index === 0 ? 'bg' : `bg-extra-${index - 1}`
                  const Caret = isOpen ? ChevronUp : ChevronDown
                  return (
                    <div key={`mix-card-${index}`} className="rounded-xl border-2 border-[#333]">
                      <div className={`flex items-center justify-between gap-3 px-4 ${isOpen ? 'border-b border-[#333] pt-3 pb-2' : 'py-2'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            stopPreview()
                            setOpenMixIndex(isOpen ? -1 : index)
                          }}
                          className="text-sm font-semibold tracking-wide text-white"
                        >
                          MIX {index + 1}
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                stopPreview()
                                const next = settings.extra_background_track_ids.filter((_, i) => i !== index - 1)
                                setSettings({ ...settings, extra_background_track_ids: next })
                                setOpenMixIndex(isOpen ? Math.max(0, next.length) : openMixIndex)
                              }}
                              aria-label="Remove this mix"
                              title="Remove this mix"
                              className="text-neutral-500 transition-colors hover:text-[#FF0040]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              stopPreview()
                              setOpenMixIndex(isOpen ? -1 : index)
                            }}
                            aria-label={isOpen ? `Collapse mix ${index + 1}` : `Expand mix ${index + 1}`}
                            className="text-neutral-400 transition-colors hover:text-white"
                          >
                            <Caret className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="space-y-4 px-4 pb-4 pt-2">
                          <div>
                            <label className="block text-sm font-medium text-neutral-200 mb-2">Background track</label>
                            <div className="flex items-start gap-2">
                              <Select
                                className="flex-1 min-w-0"
                                placeholder="Choose a track…"
                                value={trackId}
                                onChange={(nextId) => {
                                  stopPreview()
                                  if (index === 0) {
                                    setSettings({
                                      ...settings,
                                      background_track_id: nextId || null,
                                      extra_background_track_ids: settings.extra_background_track_ids.filter(
                                        (id) => id && id !== nextId,
                                      ),
                                    })
                                  } else {
                                    const next = [...settings.extra_background_track_ids]
                                    next[index - 1] = nextId
                                    setSettings({ ...settings, extra_background_track_ids: next })
                                  }
                                }}
                                options={backgroundOptions(trackId || null)}
                              />
                              <PreviewButton
                                label={index === 0 ? 'background track' : `mix ${index + 1} background`}
                                playing={previewing === previewKey}
                                disabled={!track?.file_url}
                                onClick={() => togglePreview(previewKey, track?.file_url)}
                              />
                            </div>
                            <p className="mt-2 text-xs text-neutral-500">
                              Each background track becomes its own mix — sleep, meditation, workout, and so on.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                              Balance — voice {settings.voice_volume}% / background {settings.bg_volume}%
                            </label>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={5}
                              value={settings.voice_volume}
                              onChange={(e) => {
                                const voiceVol = Number(e.target.value)
                                setSettings({ ...settings, voice_volume: voiceVol, bg_volume: 100 - voiceVol })
                              }}
                              className="w-full accent-[#39FF14]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-200 mb-2">Extra layer</label>
                              <div className="flex items-start gap-2">
                                <Select
                                  className="flex-1 min-w-0"
                                  placeholder="None"
                                  value={settings.binaural_track_id || ''}
                                  onChange={(value) => {
                                    stopPreview()
                                    const id = value || null
                                    setSettings({
                                      ...settings,
                                      binaural_track_id: id,
                                      binaural_volume: id ? (settings.binaural_volume || 15) : 0,
                                    })
                                  }}
                                  options={[
                                    { value: '', label: 'None' },
                                    ...(tracks?.frequency || []).map((t) => ({ value: t.id, label: t.display_name })),
                                  ]}
                                />
                                <PreviewButton
                                  label="extra layer"
                                  playing={previewing === 'extra'}
                                  disabled={!extraLayerTrack?.file_url}
                                  onClick={() => togglePreview('extra', extraLayerTrack?.file_url)}
                                />
                              </div>
                            </div>
                            <Select
                              label="Output"
                              value={settings.mix_output_format}
                              onChange={(value) =>
                                setSettings({ ...settings, mix_output_format: value as KitSettingsState['mix_output_format'] })
                              }
                              options={OUTPUT_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                            />
                          </div>

                          {settings.binaural_track_id && (
                            <div>
                              <label className="block text-sm font-medium text-neutral-200 mb-2">
                                Extra layer volume — {settings.binaural_volume}%
                              </label>
                              <input
                                type="range"
                                min={5}
                                max={30}
                                step={5}
                                value={settings.binaural_volume}
                                onChange={(e) => setSettings({ ...settings, binaural_volume: Number(e.target.value) })}
                                className="w-full accent-[#39FF14]"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {canAddMix && (
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview()
                      setSettings({
                        ...settings,
                        extra_background_track_ids: [...settings.extra_background_track_ids, ''],
                      })
                      setOpenMixIndex(settings.extra_background_track_ids.length + 1)
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00FFFF] transition-opacity hover:opacity-80"
                  >
                    <Plus className="h-4 w-4" />
                    Add another mix
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Checkbox
                label="Save these kit settings for future Activation Kits"
                checked={saveToKit}
                onCheckedChange={setSaveToKit}
              />
              {saveToKit && (
                <Input
                  label="Kit name"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="Sleep & Workout Activation"
                  helperText="Optional — name this kit so you can reuse it next time."
                />
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
