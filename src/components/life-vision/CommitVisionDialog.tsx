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

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mic, Music, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Modal, Button, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { commitDraft } from '@/lib/life-vision/draft-helpers'
import { keys } from '@/lib/query/keys'

interface KitRow {
  id: string
  name: string
  is_default: boolean
  include_voice: boolean
  include_mix: boolean
  include_board: boolean
  voice_id: string
  background_track_id: string | null
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

  const [step, setStep] = useState<'confirm' | 'committing' | 'kit'>('confirm')
  const [committedVisionId, setCommittedVisionId] = useState<string | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [settings, setSettings] = useState<KitSettingsState | null>(null)
  const [saveToKit, setSaveToKit] = useState(false)
  const [launching, setLaunching] = useState(false)

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
      setSaveToKit(false)
      setLaunching(false)
    }
  }, [isOpen, skipCommitConfirmation, kitOnlyVisionId])

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

  const { data: voices = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['activation-kit-dialog', 'voices'],
    enabled: isOpen,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/audio/voices')
      const { voices } = await res.json()
      return voices || []
    },
  })

  const { data: tracks } = useQuery<{
    background: Array<{ id: string; display_name: string }>
    frequency: Array<{ id: string; display_name: string }>
  }>({
    queryKey: ['activation-kit-dialog', 'background-tracks'],
    enabled: isOpen,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from('audio_background_tracks')
        .select('id, display_name, category')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      const rows = data || []
      return {
        background: rows.filter((t) => t.category !== 'binaural' && t.category !== 'solfeggio_binaural'),
        frequency: rows.filter((t) => t.category === 'binaural' || t.category === 'solfeggio_binaural'),
      }
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
    setSelectedKitId(kit.id)
    setSettings({
      include_voice: kit.include_voice,
      include_mix: kit.include_mix,
      include_board: kit.include_board,
      voice_id: kit.voice_id,
      background_track_id: kit.background_track_id,
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
    if (saveToKit && selectedKitId) {
      fetch('/api/activation-kit/kits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedKitId, ...settings }),
      })
        .then(() => queryClient.invalidateQueries({ queryKey: keys.activationKits }))
        .catch(() => {})
    }

    // Fire the kit run; the vision page progress card tracks it from here
    fetch('/api/activation-kit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visionId: committedVisionId, kitId: selectedKitId, settings }),
    })
      .then(() => queryClient.invalidateQueries({ queryKey: keys.activationKitRuns }))
      .catch((err) => console.error('Activation Kit generation failed to start:', err))

    finish(committedVisionId)
  }

  const anyAssetSelected = settings
    ? settings.include_voice || settings.include_mix || settings.include_board
    : false

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

  // Kit step
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => committedVisionId && finish(committedVisionId)}
      title="Generate your Activation Kit?"
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
            disabled={!settings || !anyAssetSelected || launching}
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
        <p className="text-neutral-300 text-sm">
          Your vision is now active. VIVA can generate fresh assets from it — only what changed
          costs anything new.
        </p>

        {!settings ? (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        ) : (
          <>
            {/* Saved kit selector */}
            {kits.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Saved kit</label>
                <select
                  value={selectedKitId || ''}
                  onChange={(e) => {
                    const kit = kits.find((k) => k.id === e.target.value)
                    if (kit) applyKit(kit)
                  }}
                  className="w-full bg-[#0A0A0A] border-2 border-[#333] rounded-xl px-4 py-2.5 text-white"
                >
                  {kits.map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name}{kit.is_default ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Asset toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { key: 'include_voice' as const, label: 'Voice Tracks', desc: 'Narration of each section', icon: Mic },
                { key: 'include_mix' as const, label: 'Audio Mixes', desc: 'Voice + background music', icon: Music },
                { key: 'include_board' as const, label: 'Board Images', desc: 'Manifestations from changes', icon: ImageIcon },
              ]).map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
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

            {/* Voice */}
            {(settings.include_voice || settings.include_mix) && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Voice</label>
                <select
                  value={settings.voice_id}
                  onChange={(e) => setSettings({ ...settings, voice_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border-2 border-[#333] rounded-xl px-4 py-2.5 text-white"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                  {/* Keep an unknown / composite saved voice selectable */}
                  {settings.voice_id && !voices.some((v) => v.id === settings.voice_id) && (
                    <option value={settings.voice_id}>{settings.voice_id}</option>
                  )}
                </select>
              </div>
            )}

            {/* Mix settings */}
            {settings.include_mix && (
              <div className="space-y-4 rounded-xl border-2 border-[#333] p-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Background track</label>
                  <select
                    value={settings.background_track_id || ''}
                    onChange={(e) => setSettings({ ...settings, background_track_id: e.target.value || null })}
                    className="w-full bg-[#0A0A0A] border-2 border-[#333] rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="">Choose a track…</option>
                    {(tracks?.background || []).map((t) => (
                      <option key={t.id} value={t.id}>{t.display_name}</option>
                    ))}
                  </select>
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
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Frequency layer</label>
                    <select
                      value={settings.binaural_track_id || ''}
                      onChange={(e) => {
                        const id = e.target.value || null
                        setSettings({
                          ...settings,
                          binaural_track_id: id,
                          binaural_volume: id ? (settings.binaural_volume || 15) : 0,
                        })
                      }}
                      className="w-full bg-[#0A0A0A] border-2 border-[#333] rounded-xl px-4 py-2.5 text-white"
                    >
                      <option value="">None</option>
                      {(tracks?.frequency || []).map((t) => (
                        <option key={t.id} value={t.id}>{t.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Output</label>
                    <select
                      value={settings.mix_output_format}
                      onChange={(e) => setSettings({ ...settings, mix_output_format: e.target.value as KitSettingsState['mix_output_format'] })}
                      className="w-full bg-[#0A0A0A] border-2 border-[#333] rounded-xl px-4 py-2.5 text-white"
                    >
                      {OUTPUT_FORMAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {settings.binaural_track_id && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Frequency volume — {settings.binaural_volume}%
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

            {/* Save back to kit */}
            {selectedKitId && (
              <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToKit}
                  onChange={(e) => setSaveToKit(e.target.checked)}
                  className="w-4 h-4 accent-[#39FF14]"
                />
                Save these settings to this kit
              </label>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
