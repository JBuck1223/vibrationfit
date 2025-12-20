'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Container,
  Card,
  Stack,
  Inline,
  Button,
  Textarea,
  Spinner,
  Badge,
  Checkbox,
  PageHero,
} from '@/lib/design-system/components'
import { renderVoiceProfileForPrompt } from '@/lib/viva/voice-profile'

interface SceneSample {
  id: string
  title: string
  preview: string
  text: string
  updated_at?: string
}

interface JournalSample {
  id: string
  title: string
  preview: string
  text: string
  created_at?: string
}

interface VisionSample {
  id: string
  label: string
  text: string
}

interface AnalyzeContextResponse {
  scenes: SceneSample[]
  journalEntries: JournalSample[]
  visionParagraphs: VisionSample[]
  defaults: {
    scenes: string[]
    journalEntries: string[]
    visionParagraphs: string[]
  }
  maxSelectable: number
}

interface VoiceProfileVersion {
  id: string
  word_flow: string
  emotional_range: string
  detail_level: string
  energy_tempo: string
  woo_level: number
  humor_personality: string
  speech_rhythm: string
  emotional_intensity_preference?: string | null
  narrative_preference?: string | null
  depth_preference?: string | null
  style_label?: string | null
  forbidden_styles?: string[] | null
  forbidden_words?: string[] | null
  sample_phrases?: string[] | null
  source?: string | null
  created_at?: string | null
  last_refined_at?: string | null
  is_active?: boolean | null
  versionNumber?: number
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function sourceLabel(source?: string | null): string {
  switch (source) {
    case 'quiz':
      return 'Quiz'
    case 'ai_analysis':
      return 'Analyzer'
    case 'manual_edit':
      return 'Manual Edit'
    case 'hybrid':
      return 'Hybrid'
    default:
      return 'Unknown'
  }
}

export default function VoiceProfileAnalyzePage() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [context, setContext] = useState<AnalyzeContextResponse | null>(null)
  const [profile, setProfile] = useState<VoiceProfileVersion | null>(null)
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set())
  const [selectedJournals, setSelectedJournals] = useState<Set<string>>(new Set())
  const [selectedVision, setSelectedVision] = useState<Set<string>>(new Set())
  const [manualSamples, setManualSamples] = useState<Array<{ id: string; text: string }>>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const maxSelectable = context?.maxSelectable ?? 10

  const selectedCount = useMemo(() => {
    const baseCount = selectedScenes.size + selectedJournals.size + selectedVision.size
    const manualCount = manualSamples.filter(s => s.text.trim().length > 0).length
    return baseCount + manualCount
  }, [selectedScenes, selectedJournals, selectedVision, manualSamples])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)

      const [contextRes, profileRes] = await Promise.all([
        fetch('/api/voice-profile/analyze/context', { cache: 'no-store' }),
        fetch('/api/voice-profile', { cache: 'no-store' }),
      ])

      if (!contextRes.ok) {
        const error = await contextRes.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to load analyze context.')
      }

      const contextData = (await contextRes.json()) as AnalyzeContextResponse
      setContext(contextData)

      const defaultsScenes = new Set(contextData.defaults.scenes)
      const defaultsJournals = new Set(contextData.defaults.journalEntries)
      const defaultsVision = new Set(contextData.defaults.visionParagraphs)
      setSelectedScenes(defaultsScenes)
      setSelectedJournals(defaultsJournals)
      setSelectedVision(defaultsVision)

      if (!profileRes.ok) {
        const error = await profileRes.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to load current voice profile.')
      }

      const profileData = await profileRes.json()
      setProfile(profileData.profile ?? null)
    } catch (error) {
      console.error('voice_profile analyze load error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load analyzer data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggle = (category: 'scenes' | 'journal' | 'vision', id: string) => {
    setStatusMessage(null)
    setErrorMessage(null)

    const currentSelectedCount = selectedCount
    const isSelected =
      category === 'scenes'
        ? selectedScenes.has(id)
        : category === 'journal'
        ? selectedJournals.has(id)
        : selectedVision.has(id)

    if (!isSelected && currentSelectedCount >= maxSelectable) {
      setErrorMessage(`You can include up to ${maxSelectable} samples. Deselect one to add another.`)
      return
    }

    if (category === 'scenes') {
      setSelectedScenes((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    } else if (category === 'journal') {
      setSelectedJournals((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    } else {
      setSelectedVision((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }
  }

  const selectedTexts = useMemo(() => {
    if (!context) return []
    const texts: string[] = []
    context.scenes.forEach((scene) => {
      if (selectedScenes.has(scene.id)) {
        texts.push(scene.text)
      }
    })
    context.journalEntries.forEach((entry) => {
      if (selectedJournals.has(entry.id)) {
        texts.push(entry.text)
      }
    })
    context.visionParagraphs.forEach((vision) => {
      if (selectedVision.has(vision.id)) {
        texts.push(vision.text)
      }
    })
    manualSamples.forEach((sample) => {
      if (sample.text.trim().length > 0) {
        texts.push(sample.text.trim())
      }
    })
    return texts
  }, [context, selectedScenes, selectedJournals, selectedVision, manualSamples])

  const promptPreview = useMemo(() => {
    if (!profile) return null
    return renderVoiceProfileForPrompt({
      word_flow: profile.word_flow as any,
      emotional_range: profile.emotional_range as any,
      detail_level: profile.detail_level as any,
      energy_tempo: profile.energy_tempo as any,
      woo_level: profile.woo_level as any,
      humor_personality: profile.humor_personality as any,
      speech_rhythm: profile.speech_rhythm as any,
      emotional_intensity_preference: profile.emotional_intensity_preference as any,
      narrative_preference: profile.narrative_preference as any,
      depth_preference: profile.depth_preference as any,
      style_label: profile.style_label,
      forbidden_styles: profile.forbidden_styles ?? [],
      forbidden_words: profile.forbidden_words ?? [],
      sample_phrases: profile.sample_phrases ?? [],
    })
  }, [profile])

  const handleRunAnalysis = async () => {
    try {
      setStatusMessage(null)
      setErrorMessage(null)

      if (selectedTexts.length === 0) {
        setErrorMessage('Select at least one sample or add manual text before running the analyzer.')
        return
      }

      if (selectedTexts.length > maxSelectable) {
        setErrorMessage(`Please reduce your selection to ${maxSelectable} samples or fewer.`)
        return
      }

      setRunning(true)
      const response = await fetch('/api/voice-profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: selectedTexts }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to analyze voice profile.')
      }

      const data = await response.json()
      setStatusMessage('Analyzer complete. New version saved and set active.')
      setManualSamples([])
      await loadData()

      return data
    } catch (error) {
      console.error('voice_profile run analyzer error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to analyze voice profile.')
      return null
    } finally {
      setRunning(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <PageHero
          title="Voice Analyzer"
          subtitle="Feed VIVA your latest writing from anywhere — scenes, journals, visions, or your own samples. We'll analyze up to 10 pieces at a time and create a new version that keeps your voice aligned across every output."
        />

        {loading ? (
          <Card className="p-6 text-center">
            <Inline gap="sm" justify="center" align="center">
              <Spinner size="sm" />
              <span className="text-neutral-300">Loading analyzer context…</span>
            </Inline>
          </Card>
        ) : (
          <Stack gap="lg">
            {profile && (
              <Card className="p-6 space-y-4">
                <Stack gap="sm">
                  <Inline gap="sm" align="center" wrap>
                    <h2 className="text-xl md:text-2xl font-semibold text-white">Current Active Profile</h2>
                    <Badge variant="success">Active</Badge>
                    {profile.source && <Badge variant="info">{sourceLabel(profile.source)}</Badge>}
                  </Inline>
                  <p className="text-sm text-neutral-400">
                    Version {profile.versionNumber ?? '—'} · Last updated {formatDate(profile.created_at)} · Last refined{' '}
                    {formatDate(profile.last_refined_at)}
                  </p>
                </Stack>
                {promptPreview && (
                  <pre className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-200 whitespace-pre-wrap">
                    {promptPreview}
                  </pre>
                )}
              </Card>
            )}

            {context && (
              <Stack gap="lg">
                <Card className="p-6 space-y-6">
                  <Stack gap="sm">
                    <Inline gap="sm" align="start" wrap>
                      <h2 className="text-xl md:text-2xl font-semibold text-white">Select Samples</h2>
                      <Badge variant="neutral">{selectedCount}/{maxSelectable} selected</Badge>
                    </Inline>
                    <p className="text-sm text-neutral-400">
                      We automatically picked your last three entries from each tool. Keep up to {maxSelectable} total samples
                      (including manual additions).
                    </p>
                  </Stack>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Scenes</h3>
                      <p className="text-xs text-neutral-500">Last {context.scenes.length} scenes (newest first).</p>
                      <Stack gap="sm">
                        {context.scenes.length === 0 && (
                          <p className="text-xs text-neutral-500">No scenes yet. Create one in the Scene Builder.</p>
                        )}
                        {context.scenes.map((scene) => (
                          <div
                            key={scene.id}
                            className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 cursor-pointer flex items-start gap-3"
                            onClick={() => handleToggle('scenes', scene.id)}
                          >
                            <div className="mt-1">
                              <Checkbox
                                checked={selectedScenes.has(scene.id)}
                                onChange={() => handleToggle('scenes', scene.id)}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{scene.title}</p>
                              <p className="text-xs text-neutral-500 mt-1">{scene.preview}{scene.text.length > scene.preview.length ? '…' : ''}</p>
                              <p className="text-xs text-neutral-600 mt-1">Updated {formatDate(scene.updated_at)}</p>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Journal Entries</h3>
                      <p className="text-xs text-neutral-500">Last {context.journalEntries.length} journal entries.</p>
                      <Stack gap="sm">
                        {context.journalEntries.length === 0 && (
                          <p className="text-xs text-neutral-500">No journal entries yet.</p>
                        )}
                        {context.journalEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 cursor-pointer flex items-start gap-3"
                            onClick={() => handleToggle('journal', entry.id)}
                          >
                            <div className="mt-1">
                              <Checkbox
                                checked={selectedJournals.has(entry.id)}
                                onChange={() => handleToggle('journal', entry.id)}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{entry.title}</p>
                              <p className="text-xs text-neutral-500 mt-1">{entry.preview}{entry.text.length > entry.preview.length ? '…' : ''}</p>
                              <p className="text-xs text-neutral-600 mt-1">Created {formatDate(entry.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Vision Paragraphs</h3>
                      <p className="text-xs text-neutral-500">Active Life Vision excerpts.</p>
                      <Stack gap="sm">
                        {context.visionParagraphs.length === 0 && (
                          <p className="text-xs text-neutral-500">No vision paragraphs found.</p>
                        )}
                        {context.visionParagraphs.map((item) => (
                          <div
                            key={item.id}
                            className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 cursor-pointer flex items-start gap-3"
                            onClick={() => handleToggle('vision', item.id)}
                          >
                            <div className="mt-1">
                              <Checkbox
                                checked={selectedVision.has(item.id)}
                                onChange={() => handleToggle('vision', item.id)}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-neutral-500 mt-1">{item.text.slice(0, 160)}{item.text.length > 160 ? '…' : ''}</p>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>
                  </div>

                  <Stack gap="sm">
                    <Inline gap="sm" align="center" justify="between" wrap>
                      <div>
                        <h3 className="text-lg font-semibold text-white">My Writings</h3>
                        <p className="text-xs text-neutral-500">Add up to 10 samples from anywhere — emails, posts, messages, or notes.</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (manualSamples.length >= 10) {
                            setErrorMessage('Maximum 10 writing samples allowed.')
                            return
                          }
                          setManualSamples([...manualSamples, { id: `manual-${Date.now()}`, text: '' }])
                          setStatusMessage(null)
                          setErrorMessage(null)
                        }}
                        disabled={manualSamples.length >= 10}
                      >
                        + Add Sample
                      </Button>
                    </Inline>
                    
                    {manualSamples.length === 0 ? (
                      <div className="border border-dashed border-neutral-700 rounded-xl p-6 text-center">
                        <p className="text-sm text-neutral-500">No writing samples added yet.</p>
                        <p className="text-xs text-neutral-600 mt-1">Click "Add Sample" to paste your own writing.</p>
                      </div>
                    ) : (
                      <Stack gap="sm">
                        {manualSamples.map((sample, index) => (
                          <div key={sample.id} className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/60">
                            <Inline gap="sm" align="start" justify="between" className="mb-2">
                              <span className="text-sm font-medium text-white">Sample {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setManualSamples(manualSamples.filter((s) => s.id !== sample.id))
                                  setStatusMessage(null)
                                  setErrorMessage(null)
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                Remove
                              </button>
                            </Inline>
                            <Textarea
                              value={sample.text}
                              onChange={(event) => {
                                setManualSamples(
                                  manualSamples.map((s) =>
                                    s.id === sample.id ? { ...s, text: event.target.value } : s
                                  )
                                )
                                setStatusMessage(null)
                                setErrorMessage(null)
                              }}
                              rows={4}
                              placeholder="Paste a post, email, message, journal entry, or any writing sample..."
                            />
                            <p className="text-xs text-neutral-600 mt-2">
                              {sample.text.trim().length} characters
                            </p>
                          </div>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>

                {statusMessage && (
                  <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
                    {statusMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                <Inline gap="sm" wrap justify="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedScenes(new Set(context.defaults.scenes))
                      setSelectedJournals(new Set(context.defaults.journalEntries))
                      setSelectedVision(new Set(context.defaults.visionParagraphs))
                      setManualSamples([])
                      setStatusMessage(null)
                      setErrorMessage(null)
                    }}
                  >
                    Reset Defaults
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleRunAnalysis} loading={running}>
                    {running ? 'Analyzing…' : 'Run Analyzer'}
                  </Button>
                </Inline>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
