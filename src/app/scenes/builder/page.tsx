'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Container,
  Card,
  Button,
  Textarea,
  Input,
  Select,
  Badge,
  Spinner,
  Stack,
  Inline,
} from '@/lib/design-system/components'
import type { EmotionalValence, SceneRecord } from '@/lib/types/vibration'

interface SceneEditorState extends SceneRecord {
  draftTitle: string
  draftText: string
  isSaving: boolean
}

const LIFE_CATEGORIES = [
  { value: 'fun', label: 'Fun & Recreation' },
  { value: 'travel', label: 'Variety, Travel & Adventure' },
  { value: 'home', label: 'Home & Environment' },
  { value: 'family', label: 'Family & Parenting' },
  { value: 'love', label: 'Love & Partnership' },
  { value: 'health', label: 'Health & Vitality' },
  { value: 'money', label: 'Money & Wealth' },
  { value: 'work', label: 'Business & Work' },
  { value: 'social', label: 'Social & Friendship' },
  { value: 'giving', label: 'Giving & Legacy' },
  { value: 'stuff', label: 'Things & Lifestyle' },
  { value: 'spirituality', label: 'Expansion & Spirituality' },
]

const DATA_RICHNESS_OPTIONS = [
  { value: 'A', label: 'Tier A – Rich data' },
  { value: 'B', label: 'Tier B – Moderate data' },
  { value: 'C', label: 'Tier C – Minimal data' },
]

export default function SceneBuilderPage() {
  const [category, setCategory] = useState('fun')
  const [profileGoesWellText, setProfileGoesWellText] = useState('')
  const [profileNotWellTextFlipped, setProfileNotWellTextFlipped] = useState('')
  const [assessmentSnippets, setAssessmentSnippets] = useState('')
  const [existingVisionParagraph, setExistingVisionParagraph] = useState('')
  const [dataRichnessTier, setDataRichnessTier] = useState<'A' | 'B' | 'C'>('C')
  const [scenes, setScenes] = useState<SceneEditorState[]>([])
  const [isLoadingScenes, setIsLoadingScenes] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formattedSnippets = useMemo(() => {
    return assessmentSnippets
      .split('\n')
      .map((snippet) => snippet.trim())
      .filter(Boolean)
  }, [assessmentSnippets])

  const fetchScenes = useCallback(async (selectedCategory: string) => {
    setIsLoadingScenes(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/vibration/scenes?category=${encodeURIComponent(selectedCategory)}`)
      if (!response.ok) {
        throw new Error('Failed to load scenes')
      }
      const data = await response.json()
      const loadedScenes: SceneEditorState[] = (data.scenes ?? []).map((scene: SceneRecord) => ({
        ...scene,
        draftTitle: scene.title,
        draftText: scene.text,
        isSaving: false,
      }))
      setScenes(loadedScenes)
    } catch (error) {
      console.error(error)
      setErrorMessage('Unable to load scenes right now.')
    } finally {
      setIsLoadingScenes(false)
    }
  }, [])

  useEffect(() => {
    fetchScenes(category)
  }, [category, fetchScenes])

  const handleGenerateScenes = async () => {
    setIsGenerating(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/vibration/scenes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          profileGoesWellText: profileGoesWellText || undefined,
          profileNotWellTextFlipped: profileNotWellTextFlipped || undefined,
          assessmentSnippets: formattedSnippets.length ? formattedSnippets : undefined,
          existingVisionParagraph: existingVisionParagraph || undefined,
          dataRichnessTier,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate scenes.')
      }

      const data = await response.json()
      setStatusMessage(
        data.scenes?.length
          ? `✨ Generated ${data.scenes.length} scene${data.scenes.length === 1 ? '' : 's'} and saved them.`
          : 'No new scenes generated.'
      )
      await fetchScenes(category)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSceneChange = (sceneId: string, field: 'draftTitle' | 'draftText', value: string) => {
    setScenes((prev) =>
      prev.map((scene) => (scene.id === sceneId ? { ...scene, [field]: value } : scene))
    )
  }

  const handleSaveScene = async (sceneId: string) => {
    setScenes((prev) =>
      prev.map((scene) => (scene.id === sceneId ? { ...scene, isSaving: true } : scene))
    )
    setStatusMessage(null)
    setErrorMessage(null)

    const scene = scenes.find((item) => item.id === sceneId)
    if (!scene) return

    try {
      const response = await fetch(`/api/vibration/scenes/${sceneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scene.draftTitle,
          text: scene.draftText,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save scene.')
      }

      const data = await response.json()
      const updatedScene: SceneRecord = data.scene

      setScenes((prev) =>
        prev.map((item) =>
          item.id === sceneId
            ? {
                ...item,
                ...updatedScene,
                draftTitle: updatedScene.title,
                draftText: updatedScene.text,
                isSaving: false,
              }
            : item
        )
      )

      setStatusMessage('Scene updated and vibrationally aligned.')
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save scene.')
      setScenes((prev) =>
        prev.map((scene) => (scene.id === sceneId ? { ...scene, isSaving: false } : scene))
      )
    }
  }

  const valenceBadgeVariant = (valence: EmotionalValence): 'success' | 'warning' | 'error' => {
    switch (valence) {
      case 'above_green_line':
        return 'success'
      case 'near_green_line':
        return 'warning'
      default:
        return 'error'
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Stack gap="sm" className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            Creative Visualization Scene Builder
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Generate cinematic, present-tense scenes per life category and fine-tune them with VIVA’s
            vibrational analyzer.
          </p>
        </Stack>

        <Card className="space-y-6">
          <Stack gap="md">
            <Inline gap="md" className="flex-col md:flex-row md:items-end">
              <div className="w-full md:w-1/3">
                <Select
                  label="Category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  options={LIFE_CATEGORIES}
                />
              </div>

              <div className="w-full md:w-1/3">
                <Select
                  label="Data Richness"
                  value={dataRichnessTier}
                  onChange={(event) => setDataRichnessTier(event.target.value as 'A' | 'B' | 'C')}
                  options={DATA_RICHNESS_OPTIONS}
                />
              </div>

              <Button
                variant="primary"
                onClick={handleGenerateScenes}
                loading={isGenerating}
                className="w-full md:w-auto"
              >
                {isGenerating ? 'Generating...' : 'Generate Scenes'}
              </Button>
            </Inline>

            <Textarea
              label="What’s Going Well"
              placeholder="Use direct language from their profile — what’s already working in this category."
              value={profileGoesWellText}
              onChange={(event) => setProfileGoesWellText(event.target.value)}
              rows={4}
            />

            <Textarea
              label="Contrast Flip"
              placeholder="Flip contrast notes into desired outcomes (AI-friendly)."
              value={profileNotWellTextFlipped}
              onChange={(event) => setProfileNotWellTextFlipped(event.target.value)}
              rows={4}
            />

            <Textarea
              label="Assessment Snippets"
              placeholder="Optional: one highlight per line."
              value={assessmentSnippets}
              onChange={(event) => setAssessmentSnippets(event.target.value)}
              rows={4}
            />

            <Textarea
              label="Vision Paragraph"
              placeholder="Paste the current vision paragraph for this category."
              value={existingVisionParagraph}
              onChange={(event) => setExistingVisionParagraph(event.target.value)}
              rows={4}
            />

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
          </Stack>
        </Card>

        <Card>
          <Stack gap="md">
            <Inline justify="between" align="center" className="flex-col md:flex-row gap-3">
              <h2 className="text-2xl font-semibold text-white">
                Active Scenes
              </h2>
              {isLoadingScenes && (
                <Inline gap="sm" align="center" className="text-neutral-400">
                  <Spinner size="sm" />
                  <span className="text-sm">Refreshing scenes…</span>
                </Inline>
              )}
            </Inline>

            {scenes.length === 0 && !isLoadingScenes ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400 text-sm">
                No scenes yet in this category. Generate fresh ones above to get started.
              </div>
            ) : (
              <Stack gap="lg">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-6 shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
                  >
                    <Inline gap="sm" justify="between" align="center" className="mb-4 flex-col md:flex-row md:items-center">
                      <Stack gap="xs" className="w-full">
                        <Input
                          value={scene.draftTitle}
                          onChange={(event) => handleSceneChange(scene.id, 'draftTitle', event.target.value)}
                          label="Scene Title"
                        />
                        <Inline gap="sm" wrap={false} className="text-sm text-neutral-400">
                          <Badge variant={valenceBadgeVariant(scene.emotional_valence)}>
                            {scene.emotional_valence.replace(/_/g, ' ')}
                          </Badge>
                          {scene.essence_word ? (
                            <Badge variant="info">
                              Essence: {scene.essence_word}
                            </Badge>
                          ) : null}
                          <Badge variant="premium">
                            {scene.created_from === 'ai_suggested' ? 'AI Suggested' : scene.created_from === 'hybrid' ? 'Hybrid' : 'User Written'}
                          </Badge>
                        </Inline>
                      </Stack>
                    </Inline>

                    <Textarea
                      value={scene.draftText}
                      onChange={(event) => handleSceneChange(scene.id, 'draftText', event.target.value)}
                      rows={8}
                      className="mb-4"
                    />

                    <Inline gap="md" justify="end" className="flex-col md:flex-row md:justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSaveScene(scene.id)}
                        loading={scene.isSaving}
                        className="w-full md:w-auto"
                      >
                        {scene.isSaving ? 'Saving...' : 'Save Updates'}
                      </Button>
                    </Inline>
                  </div>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

