'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Image,
  PenLine,
  FileText,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  ArrowRight,
  Edit3,
  Mic,
  Wand2,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Button,
  Card,
  Spinner,
  Container,
  Stack,
  Badge,
  PageHero,
  Text,
  Heading,
  Input,
  Toggle,
  CategoryGrid,
  AutoResizeTextarea,
  VIVALoadingOverlay,
} from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  VISION_CATEGORIES,
  LIFE_CATEGORY_KEYS,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import type { StoryEntityType } from '@/lib/stories/types'

type WizardStep = 'source' | 'entity' | 'create'
type CreateMode = 'viva' | 'manual'

interface SourceType {
  entityType: StoryEntityType
  label: string
  description: string
  icon: React.ElementType
  color: string
  skipEntity?: boolean
}

const SOURCE_TYPES: SourceType[] = [
  {
    entityType: 'life_vision',
    label: 'Life Vision',
    description: 'Weave your life vision categories into an immersive day-in-the-life story.',
    icon: Sparkles,
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    entityType: 'vision_board_item',
    label: 'Vision Board Item',
    description: 'Transform a vision board item into a vivid narrative of living that reality.',
    icon: Image,
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    entityType: 'journal_entry',
    label: 'Journal Entry',
    description: 'Turn a journal entry into an immersive story of your experience at its best.',
    icon: PenLine,
    color: 'bg-teal-500/20 text-teal-400',
  },
  {
    entityType: 'custom',
    label: 'Custom',
    description: 'Start from scratch with your own content and let VIVA bring it to life.',
    icon: FileText,
    color: 'bg-yellow-500/20 text-yellow-400',
    skipEntity: true,
  },
]

interface CategoryFocusData {
  key: LifeCategoryKey
  visionText: string
  focusNotes: string
  isExpanded: boolean
}

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => LIFE_CATEGORY_KEYS.includes(c.key as LifeCategoryKey)
)

export default function NewStoryWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const storyRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<WizardStep>('source')
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null)
  const [createMode, setCreateMode] = useState<CreateMode>('viva')

  // Entity selection state
  const [entityLoading, setEntityLoading] = useState(false)
  const [entities, setEntities] = useState<any[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)

  // Life Vision specific state
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [categoryData, setCategoryData] = useState<CategoryFocusData[]>([])
  const [vision, setVision] = useState<any>(null)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)
  const [focusNotes, setFocusNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Manual write state
  const [storyTitle, setStoryTitle] = useState('')
  const [storyContent, setStoryContent] = useState('')
  const [enhancing, setEnhancing] = useState(false)

  // Redirect story ID (set after generation)
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null)

  // Progress animation for generation
  useEffect(() => {
    if (generating) {
      const interval = setInterval(() => {
        setVivaProgress(prev => Math.min(prev + 0.5, 95))
      }, 500)
      return () => clearInterval(interval)
    } else {
      setVivaProgress(0)
    }
  }, [generating])

  // Life vision category data syncing
  useEffect(() => {
    if (!vision || selectedSource?.entityType !== 'life_vision') return
    setCategoryData(selectedCategories.map(key => {
      const existing = categoryData.find(c => c.key === key)
      return {
        key,
        visionText: existing?.visionText ?? (vision[key] || ''),
        focusNotes: existing?.focusNotes ?? '',
        isExpanded: existing?.isExpanded ?? true,
      }
    }))
  }, [selectedCategories, vision])

  // ── Step handlers ──

  function handleSourceSelect(source: SourceType) {
    setSelectedSource(source)
    setError(null)

    if (source.skipEntity) {
      setStep('create')
    } else {
      setStep('entity')
      loadEntities(source.entityType)
    }
  }

  async function loadEntities(entityType: StoryEntityType) {
    setEntityLoading(true)

    try {
      if (entityType === 'life_vision') {
        const response = await fetch('/api/vision?includeVersions=true')
        if (!response.ok) {
          if (response.status === 401) { router.push('/auth/login'); return }
          throw new Error('Failed to fetch visions')
        }
        const data = await response.json()
        const versions = (data.versions || []).filter((v: any) => !v.is_draft)
        if (data.vision?.id) {
          const alreadyIncluded = versions.some((v: any) => v.id === data.vision.id)
          if (!alreadyIncluded) {
            versions.unshift(data.vision)
          }
        }
        setEntities(versions)
      } else if (entityType === 'vision_board_item') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }
        const { data } = await supabase
          .from('vision_board_items')
          .select('id, name, description, categories, image_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setEntities(data || [])
      } else if (entityType === 'journal_entry') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }
        const { data } = await supabase
          .from('journal_entries')
          .select('id, title, content, categories, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        setEntities(data || [])
      }
    } catch (err) {
      console.error('Error loading entities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load entities')
    }

    setEntityLoading(false)
  }

  async function handleEntitySelect(entity: any) {
    setSelectedEntityId(entity.id)
    setSelectedEntity(entity)

    if (selectedSource?.entityType === 'life_vision') {
      const { data } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', entity.id)
        .single()
      if (data) setVision(data)
    }

    setStep('create')
  }

  // ── Category handlers (Life Vision) ──

  function handleCategoryToggle(key: string) {
    setSelectedCategories(prev =>
      prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]
    )
  }

  function updateVisionText(key: LifeCategoryKey, text: string) {
    setCategoryData(prev => prev.map(c => c.key === key ? { ...c, visionText: text } : c))
  }

  function updateFocusNotes(key: LifeCategoryKey, notes: string) {
    setCategoryData(prev => prev.map(c => c.key === key ? { ...c, focusNotes: notes } : c))
  }

  function toggleExpanded(key: LifeCategoryKey) {
    setCategoryData(prev => prev.map(c => c.key === key ? { ...c, isExpanded: !c.isExpanded } : c))
  }

  // ── VIVA generation ──

  async function handleGenerate() {
    if (!selectedSource) return
    setGenerating(true)
    setStreamingText('')
    setError(null)
    setCreatedStoryId(null)

    try {
      const body: Record<string, unknown> = { entityType: selectedSource.entityType }

      if (selectedSource.entityType === 'life_vision') {
        if (selectedCategories.length === 0) throw new Error('Select at least one category')
        const contentPayload = categoryData.reduce((acc, cat) => {
          acc[cat.key] = { visionText: cat.visionText, focusNotes: cat.focusNotes }
          return acc
        }, {} as Record<string, { visionText: string; focusNotes: string }>)
        body.entityId = selectedEntityId
        body.selectedCategories = selectedCategories
        body.categoryData = contentPayload
      } else if (selectedSource.entityType === 'vision_board_item' || selectedSource.entityType === 'journal_entry') {
        body.entityId = selectedEntityId
        if (focusNotes.trim()) body.focusNotes = focusNotes
      } else if (selectedSource.entityType === 'custom') {
        body.content = storyContent || focusNotes
        body.title = storyTitle || undefined
      }

      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate story')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamingText(fullText)
        }
      }

      setVivaProgress(100)

      // Fetch the created story to get its ID for navigation
      const entityId = response.headers.get('X-Story-Entity-Id') || selectedEntityId
      const entityType = selectedSource.entityType

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: storyData } = await supabase
          .from('stories')
          .select('id')
          .eq('entity_type', entityType)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (storyData) {
          setCreatedStoryId(storyData.id)
          setTimeout(() => {
            router.push(`/story/${storyData.id}`)
          }, 2000)
        }
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate story')
    } finally {
      setGenerating(false)
    }
  }

  // ── Manual create ──

  async function handleEnhanceWithViva() {
    if (!storyContent.trim() || enhancing) return
    setEnhancing(true)
    setError(null)

    try {
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `You are enhancing a user's raw notes/thoughts into a polished, immersive story.\n\nTheir raw input:\n"""\n${storyContent}\n"""\n\nTransform this into an immersive, first-person story that:\n- Keeps the essence of what they wrote\n- Is written in first person, present tense\n- Adds sensory details\n- Conveys emotions and gratitude\n- Flows naturally as a narrative\n- Is 300-500 words\n\nWrite the enhanced story directly without any preamble.` }],
          stream: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to enhance story')
      const data = await response.json()
      const enhanced = data.content || data.message || ''
      if (enhanced) setStoryContent(enhanced)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance story')
    } finally {
      setEnhancing(false)
    }
  }

  async function handleCreateManual() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const entityType = selectedSource?.entityType || 'custom'
      const entityId = selectedEntityId || crypto.randomUUID()

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          title: storyTitle || 'Custom Story',
          content: storyContent || '',
          source: storyContent ? 'user_written' : 'user_written',
          status: 'draft',
          word_count: storyContent.trim().split(/\s+/).filter(Boolean).length,
        })
        .select()
        .single()

      if (storyError) throw storyError
      router.push(`/story/${storyData.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story')
    }
  }

  // ── Render helpers ──

  function renderStepIndicator() {
    const steps = selectedSource?.skipEntity
      ? [{ key: 'source', label: 'Source' }, { key: 'create', label: 'Create' }]
      : [{ key: 'source', label: 'Source' }, { key: 'entity', label: 'Select' }, { key: 'create', label: 'Create' }]

    const currentIdx = steps.findIndex(s => s.key === step)

    return (
      <div className="flex items-center justify-center gap-2 mb-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i < currentIdx) setStep(s.key as WizardStep)
              }}
              disabled={i > currentIdx}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i === currentIdx
                  ? 'bg-white text-black'
                  : i < currentIdx
                    ? 'bg-primary-500 text-black cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-primary-500' : 'bg-neutral-700'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  function renderEntityPicker() {
    if (entityLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )
    }

    if (entities.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Text className="text-neutral-400 mb-4">
            No {selectedSource?.label.toLowerCase()}s found. Create one first.
          </Text>
          <Button variant="ghost" size="sm" onClick={() => setStep('source')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Choose Different Source
          </Button>
        </Card>
      )
    }

    if (selectedSource?.entityType === 'life_vision') {
      return (
        <div className="grid grid-cols-1 gap-3">
          {entities.map(v => (
            <button
              key={v.id}
              onClick={() => handleEntitySelect(v)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedEntityId === v.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
              }`}
            >
              <Text className="text-white font-medium">{v.title || `Vision v${v.version_number}`}</Text>
              <Text size="xs" className="text-neutral-400">Version {v.version_number}</Text>
            </button>
          ))}
        </div>
      )
    }

    if (selectedSource?.entityType === 'vision_board_item') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entities.map(item => (
            <button
              key={item.id}
              onClick={() => handleEntitySelect(item)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedEntityId === item.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
              }`}
            >
              <Text className="text-white font-medium">{item.name}</Text>
              {item.description && (
                <Text size="xs" className="text-neutral-400 line-clamp-2 mt-1">{item.description}</Text>
              )}
              {item.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.categories.slice(0, 3).map((c: string) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )
    }

    if (selectedSource?.entityType === 'journal_entry') {
      return (
        <div className="grid grid-cols-1 gap-3">
          {entities.map(entry => (
            <button
              key={entry.id}
              onClick={() => handleEntitySelect(entry)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedEntityId === entry.id
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Text className="text-white font-medium">{entry.title || 'Untitled Entry'}</Text>
                <Text size="xs" className="text-neutral-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </Text>
              </div>
              {entry.content && (
                <Text size="xs" className="text-neutral-400 line-clamp-2">{entry.content.slice(0, 120)}</Text>
              )}
            </button>
          ))}
        </div>
      )
    }

    return null
  }

  const hasGeneratedStory = streamingText.length > 0
  const isLifeVision = selectedSource?.entityType === 'life_vision'

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="NEW STORY"
          title="Create a Story"
          subtitle="Transform your visions, journal entries, or ideas into immersive narratives."
        >
          <div className="flex flex-col items-center gap-3">
            {renderStepIndicator()}
            <Button variant="ghost" size="sm" onClick={() => {
              if (step === 'create' && !selectedSource?.skipEntity) setStep('entity')
              else if (step === 'entity') setStep('source')
              else router.push('/story')
            }}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 'source' ? 'All Stories' : 'Back'}
            </Button>
          </div>
        </PageHero>

        {/* ═══════ STEP 1: SOURCE TYPE ═══════ */}
        {step === 'source' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCE_TYPES.map(source => {
              const IconComp = source.icon
              return (
                <button
                  key={source.entityType}
                  onClick={() => handleSourceSelect(source)}
                  className="text-left"
                >
                  <Card
                    variant="elevated"
                    hover
                    className="p-6 cursor-pointer h-full transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${source.color}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <Heading level={4} className="text-white mb-1">{source.label}</Heading>
                        <Text size="sm" className="text-neutral-400">{source.description}</Text>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}

        {/* ═══════ STEP 2: ENTITY SELECTION ═══════ */}
        {step === 'entity' && (
          <Card className="p-4 md:p-6 lg:p-8">
            <Heading level={3} className="text-white mb-1">
              Choose Your {selectedSource?.label}
            </Heading>
            <Text size="sm" className="text-neutral-400 mb-6">
              Select the {selectedSource?.label.toLowerCase()} you want to turn into a story
            </Text>
            {renderEntityPicker()}
          </Card>
        )}

        {/* ═══════ STEP 3: CREATE ═══════ */}
        {step === 'create' && (
          <>
            {/* Source Preview (non-life-vision, non-custom) */}
            {selectedEntity && !isLifeVision && selectedSource?.entityType !== 'custom' && (
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">{selectedSource?.label}</Badge>
                  <Text className="text-white font-medium">
                    {selectedEntity.name || selectedEntity.title || 'Selected Item'}
                  </Text>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 max-h-[200px] overflow-y-auto">
                  <Text size="sm" className="text-neutral-300 whitespace-pre-wrap">
                    {selectedEntity.description || selectedEntity.content || ''}
                  </Text>
                </div>
              </Card>
            )}

            {/* Mode Toggle */}
            {!hasGeneratedStory && (
              <div className="flex justify-center">
                <Toggle
                  value={createMode}
                  onChange={setCreateMode}
                  options={[
                    { value: 'viva', label: 'VIVA Story' },
                    { value: 'manual', label: 'Write My Own' },
                  ]}
                />
              </div>
            )}

            {/* ── VIVA MODE ── */}
            {createMode === 'viva' && (
              <>
                {/* Life Vision: Category Selection + Focus Notes */}
                {isLifeVision && !hasGeneratedStory && (
                  <>
                    <Card className="p-4 md:p-6 lg:p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Heading level={3} className="text-white mb-1">Choose Your Focus Areas</Heading>
                          <Text size="sm" className="text-neutral-400">
                            Select the life areas you want featured in your story
                          </Text>
                        </div>
                        <Badge variant="info">{selectedCategories.length} selected</Badge>
                      </div>
                      <CategoryGrid
                        categories={LIFE_CATEGORIES}
                        selectedCategories={selectedCategories}
                        onCategoryClick={handleCategoryToggle}
                        layout="12-column"
                        mode="selection"
                        variant="outlined"
                        withCard={false}
                      />
                    </Card>

                    {selectedCategories.length > 0 && (
                      <Card className="p-4 md:p-6 lg:p-8">
                        <div className="mb-6">
                          <Heading level={3} className="text-white mb-1">Review & Add Focus Notes</Heading>
                          <Text size="sm" className="text-neutral-400">
                            Your vision text is pre-filled. Add optional notes to highlight specific details.
                          </Text>
                        </div>
                        <Stack gap="md">
                          {categoryData.map(cat => {
                            const category = LIFE_CATEGORIES.find(c => c.key === cat.key)
                            if (!category) return null
                            const CatIcon = category.icon
                            return (
                              <div key={cat.key} className="border border-neutral-700 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => toggleExpanded(cat.key)}
                                  className="w-full flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                                      <CatIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <Text className="text-white font-medium">{category.label}</Text>
                                      {cat.focusNotes && <Text size="xs" className="text-purple-400">Has focus notes</Text>}
                                    </div>
                                  </div>
                                  {cat.isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                                </button>
                                {cat.isExpanded && (
                                  <div className="p-4 space-y-4 bg-neutral-900/50">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Text size="sm" className="text-neutral-400 font-medium">Vision Text</Text>
                                        <Edit3 className="w-3 h-3 text-neutral-500" />
                                      </div>
                                      <AutoResizeTextarea
                                        value={cat.visionText}
                                        onChange={value => updateVisionText(cat.key, value)}
                                        className="w-full min-h-[100px] text-sm"
                                        placeholder={`Your ${category.label.toLowerCase()} vision...`}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Text size="sm" className="text-purple-400 font-medium">Key Details to Focus On</Text>
                                        <Text size="xs" className="text-neutral-500">(optional)</Text>
                                      </div>
                                      <AutoResizeTextarea
                                        value={cat.focusNotes}
                                        onChange={value => updateFocusNotes(cat.key, value)}
                                        className="w-full min-h-[60px] text-sm border-purple-500/30 focus:border-purple-500"
                                        placeholder="Any specific moments, feelings, or details you want highlighted..."
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </Stack>
                      </Card>
                    )}
                  </>
                )}

                {/* Non-life-vision focus notes */}
                {!isLifeVision && selectedSource?.entityType !== 'custom' && !hasGeneratedStory && (
                  <Card className="p-4 md:p-6 lg:p-8">
                    <Heading level={3} className="text-white mb-1">Focus Notes</Heading>
                    <Text size="sm" className="text-neutral-400 mb-4">
                      Optional: highlight specific moments, feelings, or details you want emphasized.
                    </Text>
                    <AutoResizeTextarea
                      value={focusNotes}
                      onChange={setFocusNotes}
                      className="w-full min-h-[80px] text-sm border-purple-500/30 focus:border-purple-500"
                      placeholder="Key details to emphasize in your story..."
                    />
                  </Card>
                )}

                {/* Custom content input */}
                {selectedSource?.entityType === 'custom' && !hasGeneratedStory && (
                  <Card className="p-4 md:p-6 lg:p-8">
                    <Heading level={3} className="text-white mb-1">Your Content</Heading>
                    <Text size="sm" className="text-neutral-400 mb-4">
                      Describe the reality you want to live. VIVA will weave it into an immersive story.
                    </Text>
                    <div className="space-y-4">
                      <Input
                        value={storyTitle}
                        onChange={e => setStoryTitle(e.target.value)}
                        placeholder="Story title (optional)"
                      />
                      <RecordingTextarea
                        value={storyContent}
                        onChange={setStoryContent}
                        placeholder="Describe your vision, experience, or idea. Be specific with names, places, and details..."
                        rows={6}
                        recordingPurpose="quick"
                        storageFolder="lifeVision"
                        category="story"
                      />
                    </div>
                  </Card>
                )}

                {/* Generate Button */}
                {!hasGeneratedStory && (
                  <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden">
                    <VIVALoadingOverlay
                      isVisible={generating}
                      messages={[
                        'VIVA is crafting your day-in-the-life story...',
                        'Weaving together your selected life areas...',
                        'Creating an immersive morning-to-evening narrative...',
                        'Adding sensory details and emotional depth...',
                        'Putting the finishing touches on your story...',
                      ]}
                      cycleDuration={8000}
                      estimatedTime="This usually takes 30-60 seconds"
                      estimatedDuration={45000}
                      progress={vivaProgress}
                    />
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <Heading level={3} className="text-white mb-2">Generate Your Story</Heading>
                      <Text className="text-neutral-400 mb-6 max-w-md mx-auto">
                        VIVA will create an immersive day-in-the-life narrative. You can edit and add audio after.
                      </Text>
                      <Button
                        onClick={handleGenerate}
                        variant="primary"
                        size="lg"
                        disabled={generating || (isLifeVision && selectedCategories.length === 0) || (selectedSource?.entityType === 'custom' && !storyContent.trim())}
                      >
                        {generating ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Writing Story...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Generate Story
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Streaming Story Display */}
                {hasGeneratedStory && (
                  <Card className="p-4 md:p-6 lg:p-8" ref={storyRef}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <Heading level={3} className="text-white">Your Story</Heading>
                          <Text size="sm" className="text-neutral-400">
                            {streamingText.split(/\s+/).length} words
                          </Text>
                        </div>
                      </div>
                      {!generating && createdStoryId && (
                        <Button asChild variant="primary" size="sm">
                          <Link href={`/story/${createdStoryId}`}>
                            Edit & Add Audio
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    {!generating && createdStoryId && (
                      <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center gap-3">
                        <Spinner size="sm" />
                        <Text size="sm" className="text-primary-400">
                          Redirecting to your story where you can edit and add audio...
                        </Text>
                      </div>
                    )}

                    <div className="p-4 md:p-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
                      <Text className="text-neutral-200 whitespace-pre-wrap leading-relaxed">
                        {streamingText}
                        {generating && <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1" />}
                      </Text>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* ── MANUAL MODE ── */}
            {createMode === 'manual' && !hasGeneratedStory && (
              <Card className="p-4 md:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <Heading level={4} className="text-white">Write or Record Your Own</Heading>
                    <Text size="sm" className="text-neutral-400">Type, dictate, or let VIVA enhance your words</Text>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    value={storyTitle}
                    onChange={e => setStoryTitle(e.target.value)}
                    placeholder="Story title"
                  />
                  <RecordingTextarea
                    value={storyContent}
                    onChange={setStoryContent}
                    placeholder="Start writing your story, or click the mic to record and transcribe..."
                    rows={6}
                    recordingPurpose="quick"
                    storageFolder="lifeVision"
                    category="story"
                  />
                  {storyContent && (
                    <Text size="xs" className="text-neutral-500">
                      {storyContent.trim().split(/\s+/).filter(Boolean).length} words
                    </Text>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {storyContent.trim().length > 20 && (
                      <Button onClick={handleEnhanceWithViva} variant="secondary" disabled={enhancing}>
                        {enhancing ? (
                          <><Spinner size="sm" className="mr-2" /> Enhancing...</>
                        ) : (
                          <><Wand2 className="w-4 h-4 mr-2" /> Enhance with VIVA</>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleCreateManual}
                      variant="primary"
                      disabled={!storyTitle.trim() || !storyContent.trim()}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create Story
                    </Button>
                  </div>
                  <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                    <Text size="xs" className="text-neutral-400">
                      <strong className="text-teal-400">Tip:</strong> Click the mic button to record your thoughts,
                      then use &quot;Enhance with VIVA&quot; to transform your raw ideas into a polished, immersive story.
                    </Text>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <Text size="sm" className="text-red-400">{error}</Text>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
