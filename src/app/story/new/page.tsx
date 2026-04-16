'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Image,
  PenLine,
  FileText,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowRight,
  Edit3,
  Mic,
  Wand2,
  CheckCircle,
  Search,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Button,
  Card,
  Spinner,
  Container,
  Stack,
  Badge,
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
    icon: Target,
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
    icon: BookOpen,
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

  // Source dropdown state
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false)

  // Entity selection state
  const [entityLoading, setEntityLoading] = useState(false)
  const [entities, setEntities] = useState<any[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false)
  const [entitySearchQuery, setEntitySearchQuery] = useState('')

  // Life Vision specific state
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [categoryData, setCategoryData] = useState<CategoryFocusData[]>([])
  const [vision, setVision] = useState<any>(null)

  // Custom sub-mode state
  type CustomMode = 'tell' | 'flip'
  const [customMode, setCustomMode] = useState<CustomMode>('tell')

  // Custom vision tagging state (shared across tell & flip)
  const [showVisionTagging, setShowVisionTagging] = useState(false)
  const [customVisionEntities, setCustomVisionEntities] = useState<any[]>([])
  const [customVisionLoading, setCustomVisionLoading] = useState(false)
  const [customVisionId, setCustomVisionId] = useState<string | null>(null)
  const [customVision, setCustomVision] = useState<any>(null)
  const [customSelectedCategories, setCustomSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [customCategoryData, setCustomCategoryData] = useState<CategoryFocusData[]>([])
  const [isCustomVisionDropdownOpen, setIsCustomVisionDropdownOpen] = useState(false)

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

  // Custom vision category data syncing
  useEffect(() => {
    if (!customVision) return
    setCustomCategoryData(customSelectedCategories.map(key => {
      const existing = customCategoryData.find(c => c.key === key)
      return {
        key,
        visionText: existing?.visionText ?? (customVision[key] || ''),
        focusNotes: existing?.focusNotes ?? '',
        isExpanded: existing?.isExpanded ?? true,
      }
    }))
  }, [customSelectedCategories, customVision])

  // ── Step handlers ──

  function handleSourceSelect(source: SourceType) {
    setSelectedSource(source)
    setIsSourceDropdownOpen(false)
    setError(null)

    setSelectedEntityId(null)
    setSelectedEntity(null)
    setEntities([])
    setEntitySearchQuery('')

    // Reset custom-specific state
    setCustomMode('tell')
    setShowVisionTagging(false)
    setCustomVisionId(null)
    setCustomVision(null)
    setCustomSelectedCategories([])
    setCustomCategoryData([])

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
    setIsEntityDropdownOpen(false)

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

  // ── Custom vision tagging handlers ──

  async function loadCustomVisionEntities() {
    if (customVisionEntities.length > 0) return
    setCustomVisionLoading(true)
    try {
      const response = await fetch('/api/vision?includeVersions=true')
      if (!response.ok) {
        if (response.status === 401) { router.push('/auth/login'); return }
        throw new Error('Failed to fetch visions')
      }
      const data = await response.json()
      const versions = (data.versions || []).filter((v: any) => !v.is_draft)
      if (data.vision?.id) {
        const alreadyIncluded = versions.some((v: any) => v.id === data.vision.id)
        if (!alreadyIncluded) versions.unshift(data.vision)
      }
      setCustomVisionEntities(versions)
    } catch (err) {
      console.error('Error loading visions for tagging:', err)
    }
    setCustomVisionLoading(false)
  }

  async function handleCustomVisionSelect(entity: any) {
    setCustomVisionId(entity.id)
    setIsCustomVisionDropdownOpen(false)
    const { data } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', entity.id)
      .single()
    if (data) setCustomVision(data)
  }

  function handleCustomCategoryToggle(key: string) {
    setCustomSelectedCategories(prev =>
      prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]
    )
  }

  function updateCustomVisionText(key: LifeCategoryKey, text: string) {
    setCustomCategoryData(prev => prev.map(c => c.key === key ? { ...c, visionText: text } : c))
  }

  function updateCustomFocusNotes(key: LifeCategoryKey, notes: string) {
    setCustomCategoryData(prev => prev.map(c => c.key === key ? { ...c, focusNotes: notes } : c))
  }

  function toggleCustomExpanded(key: LifeCategoryKey) {
    setCustomCategoryData(prev => prev.map(c => c.key === key ? { ...c, isExpanded: !c.isExpanded } : c))
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
        body.customMode = customMode

        if (customSelectedCategories.length > 0 && customCategoryData.length > 0) {
          body.selectedCategories = customSelectedCategories
          body.categoryData = customCategoryData.reduce((acc, cat) => {
            acc[cat.key] = { visionText: cat.visionText, focusNotes: cat.focusNotes }
            return acc
          }, {} as Record<string, { visionText: string; focusNotes: string }>)
        }
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

  function getEntityDisplayName(entity: any): string {
    if (!entity) return ''
    if (selectedSource?.entityType === 'life_vision') return `Version ${entity.version_number}`
    if (selectedSource?.entityType === 'vision_board_item') return entity.name || 'Vision Board Item'
    if (selectedSource?.entityType === 'journal_entry') return entity.title || 'Untitled Entry'
    return entity.name || entity.title || 'Selected Item'
  }

  const isSearchableEntity = selectedSource?.entityType === 'vision_board_item' || selectedSource?.entityType === 'journal_entry'

  const filteredEntities = isSearchableEntity && entitySearchQuery.trim()
    ? entities.filter(entity => {
        const q = entitySearchQuery.toLowerCase()
        const name = (entity.name || entity.title || '').toLowerCase()
        const desc = (entity.description || entity.content || '').toLowerCase()
        const cats = Array.isArray(entity.categories) ? entity.categories.join(' ').toLowerCase() : ''
        return name.includes(q) || desc.includes(q) || cats.includes(q)
      })
    : entities

  function renderEntityDropdownItems() {
    if (entityLoading) {
      return (
        <div className="flex items-center justify-center py-6">
          <Spinner size="sm" />
          <span className="text-sm text-neutral-400 ml-2">Loading...</span>
        </div>
      )
    }

    if (entities.length === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-neutral-400">No {selectedSource?.label.toLowerCase()}s found.</p>
        </div>
      )
    }

    if (filteredEntities.length === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-neutral-400">No results for &ldquo;{entitySearchQuery}&rdquo;</p>
        </div>
      )
    }

    return filteredEntities.map(entity => {
      const entityId = entity.id
      const isSelected = selectedEntityId === entityId

      if (selectedSource?.entityType === 'life_vision') {
        return (
          <button
            key={entityId}
            onClick={() => handleEntitySelect(entity)}
            className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${isSelected ? 'bg-primary-500/10' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Version {entity.version_number}</span>
                {entity.title && <span className="text-xs text-neutral-400">{entity.title}</span>}
                {entity.is_active && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30">Active</span>
                )}
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-primary-500" />}
            </div>
          </button>
        )
      }

      if (selectedSource?.entityType === 'vision_board_item') {
        return (
          <button
            key={entityId}
            onClick={() => handleEntitySelect(entity)}
            className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${isSelected ? 'bg-primary-500/10' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">{entity.name}</span>
                {entity.description && (
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{entity.description}</p>
                )}
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 ml-2" />}
            </div>
          </button>
        )
      }

      if (selectedSource?.entityType === 'journal_entry') {
        return (
          <button
            key={entityId}
            onClick={() => handleEntitySelect(entity)}
            className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${isSelected ? 'bg-primary-500/10' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">{entity.title || 'Untitled Entry'}</span>
                <span className="text-xs text-neutral-500 ml-2">
                  {new Date(entity.created_at).toLocaleDateString()}
                </span>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 ml-2" />}
            </div>
          </button>
        )
      }

      return null
    })
  }

  const hasGeneratedStory = streamingText.length > 0
  const isLifeVision = selectedSource?.entityType === 'life_vision'
  const isCustom = selectedSource?.entityType === 'custom'
  const needsEntity = selectedSource && !selectedSource.skipEntity

  const stepNumber = (n: number) => (
    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
      <span className="text-primary-500 font-bold text-2xl">{n}</span>
    </div>
  )

  return (
    <Container size="xl" className="pt-6">
      <Stack gap="lg">
        {/* Streaming Story Display (replaces entire form when generated) */}
        {hasGeneratedStory ? (
          <Card variant="glass" className="p-4 md:p-6 lg:p-8" ref={storyRef}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Your Story</h3>
                  <p className="text-sm text-neutral-400">
                    {streamingText.split(/\s+/).length} words
                  </p>
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
                <p className="text-sm text-primary-400">
                  Redirecting to your story where you can edit and add audio...
                </p>
              </div>
            )}

            <div className="p-4 md:p-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {streamingText}
                {generating && <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1" />}
              </p>
            </div>
          </Card>
        ) : (
          /* Main Creation Card */
          <Card variant="glass" className="p-4 md:p-6 relative">
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
            <div className="space-y-6">

              {/* Step 1: Select Source */}
              <div className="py-4">
                <div className="flex flex-col items-center mb-4">
                  {stepNumber(1)}
                  <h3 className="text-lg md:text-xl font-semibold text-white">Select Source</h3>
                </div>
                <div className="relative max-w-2xl mx-auto">
                  <button
                    type="button"
                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                    className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                  >
                    {selectedSource ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedSource.color}`}>
                          <selectedSource.icon className="w-4 h-4" />
                        </div>
                        <span>{selectedSource.label}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">Choose a story source...</span>
                    )}
                  </button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isSourceDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSourceDropdownOpen(false)} />
                      <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                        {SOURCE_TYPES.map(source => {
                          const IconComp = source.icon
                          return (
                            <button
                              key={source.entityType}
                              onClick={() => handleSourceSelect(source)}
                              className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${selectedSource?.entityType === source.entityType ? 'bg-primary-500/10' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${source.color}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-white font-medium">{source.label}</span>
                                    <p className="text-xs text-neutral-400 mt-0.5">{source.description}</p>
                                  </div>
                                </div>
                                {selectedSource?.entityType === source.entityType && <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 ml-2" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Select Entity (only for non-custom sources) */}
              {needsEntity && (
                <>
                  <div className="border-t border-[#333]" />
                  <div className="py-4">
                    <div className="flex flex-col items-center mb-4">
                      {stepNumber(2)}
                      <h3 className="text-lg md:text-xl font-semibold text-white">Select {selectedSource?.label}</h3>
                    </div>
                    <div className="relative max-w-2xl mx-auto">
                      <button
                        type="button"
                        onClick={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                        className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                      >
                        {selectedEntity ? (
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedSource?.color || 'bg-primary-500/20 text-primary-500'}`}>
                              {selectedSource?.icon && <selectedSource.icon className="w-4 h-4" />}
                            </div>
                            <span>{getEntityDisplayName(selectedEntity)}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">
                            {entityLoading ? 'Loading...' : `Choose a ${selectedSource?.label.toLowerCase()}...`}
                          </span>
                        )}
                      </button>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isEntityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {isEntityDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => { setIsEntityDropdownOpen(false); setEntitySearchQuery('') }} />
                          <div className="absolute z-20 w-full mt-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl overflow-hidden">
                            {isSearchableEntity && !entityLoading && entities.length > 0 && (
                              <div className="p-2 border-b border-[#333]">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                                  <input
                                    type="text"
                                    value={entitySearchQuery}
                                    onChange={(e) => setEntitySearchQuery(e.target.value)}
                                    placeholder={`Search ${selectedSource?.label.toLowerCase()}s...`}
                                    className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary-500/50"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="py-2 max-h-60 overflow-y-auto">
                              {renderEntityDropdownItems()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 (or 2 for Custom): Configure & Generate */}
              {step === 'create' && (
                <>
                  <div className="border-t border-[#333]" />
                  <div className="pt-6">
                    <div className="flex flex-col items-center mb-4">
                      {stepNumber(isCustom ? 2 : 3)}
                      <h3 className="text-lg md:text-xl font-semibold text-white">Create Story</h3>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-6">
                      <Toggle
                        value={createMode}
                        onChange={setCreateMode}
                        options={[
                          { value: 'viva', label: 'VIVA Story' },
                          { value: 'manual', label: 'Write My Own' },
                        ]}
                      />
                    </div>

                    {/* VIVA MODE */}
                    {createMode === 'viva' && (
                      <div className="space-y-6">
                        {/* Life Vision: Category Selection */}
                        {isLifeVision && (
                          <>
                            <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-4 md:p-6">
                              <div className="flex flex-col items-center gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-center sm:text-left">
                                  <h4 className="text-white font-semibold">Choose Focus Areas</h4>
                                  <p className="text-sm text-neutral-400">
                                    Select the life areas for your story
                                  </p>
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
                            </div>

                            {selectedCategories.length > 0 && (
                              <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-4 md:p-6 space-y-3">
                                <div>
                                  <h4 className="text-white font-semibold">Review & Add Focus Notes</h4>
                                  <p className="text-sm text-neutral-400">
                                    Your vision text is pre-filled. Add optional notes to highlight specific details.
                                  </p>
                                </div>
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
                                          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                            <CatIcon className="w-5 h-5 text-primary-500" />
                                          </div>
                                          <div className="text-left">
                                            <span className="text-primary-500 font-medium">{category.label}</span>
                                            {cat.focusNotes && <p className="text-xs text-purple-400">Has focus notes</p>}
                                          </div>
                                        </div>
                                        {cat.isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                                      </button>
                                      {cat.isExpanded && (
                                        <div className="p-4 space-y-4 bg-neutral-900/50">
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-sm text-neutral-400 font-medium">Vision Text</span>
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
                                              <span className="text-sm text-purple-400 font-medium">Key Details to Focus On</span>
                                              <span className="text-xs text-neutral-500">(optional)</span>
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
                              </div>
                            )}
                          </>
                        )}

                        {/* Non-life-vision focus notes */}
                        {!isLifeVision && !isCustom && (
                          <div className="max-w-2xl mx-auto">
                            <h4 className="text-white font-semibold mb-1">Focus Notes</h4>
                            <p className="text-sm text-neutral-400 mb-4">
                              Optional: highlight specific moments, feelings, or details you want emphasized.
                            </p>
                            <AutoResizeTextarea
                              value={focusNotes}
                              onChange={setFocusNotes}
                              className="w-full min-h-[80px] text-sm border-purple-500/30 focus:border-purple-500"
                              placeholder="Key details to emphasize in your story..."
                            />
                          </div>
                        )}

                        {/* Custom content input with sub-mode toggle */}
                        {isCustom && (
                          <div className="space-y-6">
                            {/* Sub-mode toggle: Tell vs Flip */}
                            <div className="flex justify-center">
                              <Toggle
                                value={customMode}
                                onChange={setCustomMode}
                                options={[
                                  { value: 'tell' as CustomMode, label: 'Tell a Story' },
                                  { value: 'flip' as CustomMode, label: 'Flip a Story' },
                                ]}
                                size="sm"
                                activeColor={customMode === 'flip' ? '#BF00FF' : '#39FF14'}
                              />
                            </div>

                            {/* Mode description */}
                            <div className="text-center">
                              {customMode === 'tell' ? (
                                <p className="text-sm text-neutral-400">
                                  Describe the reality you want to live. VIVA will weave it into an immersive story.
                                </p>
                              ) : (
                                <p className="text-sm text-purple-400">
                                  Paste a limiting story you want to transform. VIVA will flip it into an empowering narrative.
                                </p>
                              )}
                            </div>

                            {/* Title + Content */}
                            <div className="space-y-4">
                              <Input
                                value={storyTitle}
                                onChange={e => setStoryTitle(e.target.value)}
                                placeholder="Story title (optional)"
                              />
                              <RecordingTextarea
                                value={storyContent}
                                onChange={setStoryContent}
                                placeholder={
                                  customMode === 'tell'
                                    ? 'Describe your vision, experience, or idea. Be specific with names, places, and details...'
                                    : 'Paste or describe the limiting story you want to transform. What narrative do you want to replace?'
                                }
                                rows={6}
                                recordingPurpose="quick"
                                storageFolder="lifeVision"
                                category="story"
                              />
                            </div>

                            {/* Life Vision Category Tagging (shared by both modes) */}
                            <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50">
                              <button
                                type="button"
                                onClick={() => {
                                  const opening = !showVisionTagging
                                  setShowVisionTagging(opening)
                                  if (opening) loadCustomVisionEntities()
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-neutral-800 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <Target className="w-5 h-5 text-purple-400" />
                                  </div>
                                  <div className="text-left">
                                    <span className="text-white font-semibold">Connect to your Life Vision</span>
                                    <p className="text-xs text-neutral-400">
                                      {customSelectedCategories.length > 0
                                        ? `${customSelectedCategories.length} ${customSelectedCategories.length === 1 ? 'category' : 'categories'} tagged`
                                        : 'Optional: tag life areas for richer context'}
                                    </p>
                                  </div>
                                </div>
                                {showVisionTagging ? (
                                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                                )}
                              </button>

                              {showVisionTagging && (
                                <div className="p-4 md:p-6 border-t border-neutral-700/50 space-y-6">
                                  {/* Vision version dropdown selector */}
                                  {customVisionLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Spinner size="sm" />
                                      <span className="text-sm text-neutral-400 ml-2">Loading visions...</span>
                                    </div>
                                  ) : customVisionEntities.length === 0 ? (
                                    <p className="text-sm text-neutral-400 text-center py-4">
                                      No life visions found. Create a Life Vision first to use this feature.
                                    </p>
                                  ) : (
                                    <>
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setIsCustomVisionDropdownOpen(!isCustomVisionDropdownOpen)}
                                          className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-purple-500 focus:border-purple-500 focus:outline-none transition-colors cursor-pointer text-left"
                                        >
                                          {customVision ? (
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-500/20 text-purple-400">
                                                <Target className="w-4 h-4" />
                                              </div>
                                              <span>
                                                Version {customVision.version_number}
                                                {customVision.title && <span className="text-xs text-neutral-400 ml-2">{customVision.title}</span>}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-neutral-400">Choose a life vision version...</span>
                                          )}
                                        </button>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                          <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isCustomVisionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                        {isCustomVisionDropdownOpen && (
                                          <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsCustomVisionDropdownOpen(false)} />
                                            <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                              {customVisionEntities.map((entity: any) => {
                                                const isSelected = customVisionId === entity.id
                                                return (
                                                  <button
                                                    key={entity.id}
                                                    onClick={() => handleCustomVisionSelect(entity)}
                                                    className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${isSelected ? 'bg-purple-500/10' : ''}`}
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">Version {entity.version_number}</span>
                                                        {entity.title && <span className="text-xs text-neutral-400">{entity.title}</span>}
                                                        {entity.is_active && (
                                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30">Active</span>
                                                        )}
                                                      </div>
                                                      {isSelected && <CheckCircle className="w-5 h-5 text-purple-400" />}
                                                    </div>
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Category selection grid (shown once a vision is selected) */}
                                      {customVision && (
                                        <>
                                          <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-4 md:p-6">
                                            <div className="flex flex-col items-center gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                              <div className="text-center sm:text-left">
                                                <h4 className="text-white font-semibold">Tag Life Areas</h4>
                                                <p className="text-sm text-neutral-400">
                                                  Select the life areas this story pertains to
                                                </p>
                                              </div>
                                              <Badge variant="info">{customSelectedCategories.length} selected</Badge>
                                            </div>
                                            <CategoryGrid
                                              categories={LIFE_CATEGORIES}
                                              selectedCategories={customSelectedCategories}
                                              onCategoryClick={handleCustomCategoryToggle}
                                              layout="12-column"
                                              mode="selection"
                                              variant="outlined"
                                              withCard={false}
                                            />
                                          </div>

                                          {/* Expandable category cards with vision text + focus notes */}
                                          {customSelectedCategories.length > 0 && (
                                            <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-4 md:p-6 space-y-3">
                                              <div>
                                                <h4 className="text-white font-semibold">Review & Add Focus Notes</h4>
                                                <p className="text-sm text-neutral-400">
                                                  Your vision text is pre-filled. Add optional notes to highlight specific details.
                                                </p>
                                              </div>
                                              {customCategoryData.map(cat => {
                                                const category = LIFE_CATEGORIES.find(c => c.key === cat.key)
                                                if (!category) return null
                                                const CatIcon = category.icon
                                                return (
                                                  <div key={cat.key} className="border border-neutral-700 rounded-xl overflow-hidden">
                                                    <button
                                                      onClick={() => toggleCustomExpanded(cat.key)}
                                                      className="w-full flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                          <CatIcon className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div className="text-left">
                                                          <span className="text-purple-400 font-medium">{category.label}</span>
                                                          {cat.focusNotes && <p className="text-xs text-purple-400/60">Has focus notes</p>}
                                                        </div>
                                                      </div>
                                                      {cat.isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                                                    </button>
                                                    {cat.isExpanded && (
                                                      <div className="p-4 space-y-4 bg-neutral-900/50">
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm text-neutral-400 font-medium">Vision Text</span>
                                                            <Edit3 className="w-3 h-3 text-neutral-500" />
                                                          </div>
                                                          <AutoResizeTextarea
                                                            value={cat.visionText}
                                                            onChange={value => updateCustomVisionText(cat.key, value)}
                                                            className="w-full min-h-[100px] text-sm"
                                                            placeholder={`Your ${category.label.toLowerCase()} vision...`}
                                                          />
                                                        </div>
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm text-purple-400 font-medium">Key Details to Focus On</span>
                                                            <span className="text-xs text-neutral-500">(optional)</span>
                                                          </div>
                                                          <AutoResizeTextarea
                                                            value={cat.focusNotes}
                                                            onChange={value => updateCustomFocusNotes(cat.key, value)}
                                                            className="w-full min-h-[60px] text-sm border-purple-500/30 focus:border-purple-500"
                                                            placeholder="Any specific moments, feelings, or details you want highlighted..."
                                                          />
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Generate Button */}
                        <div className="flex justify-center">
                          <Button
                            onClick={handleGenerate}
                            variant="primary"
                            disabled={generating || (isLifeVision && selectedCategories.length === 0) || (isCustom && !storyContent.trim())}
                          >
                            {generating ? (
                              <>
                                <Spinner size="sm" className="mr-2" />
                                {isCustom && customMode === 'flip' ? 'Flipping Story...' : 'Writing Story...'}
                              </>
                            ) : (
                              <>
                                {isCustom && customMode === 'flip' ? (
                                  <RefreshCw className="w-5 h-5 mr-2" />
                                ) : (
                                  <Sparkles className="w-5 h-5 mr-2" />
                                )}
                                {isCustom && customMode === 'flip' ? 'Flip Story' : 'Generate Story'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* MANUAL MODE */}
                    {createMode === 'manual' && (
                      <div className="max-w-2xl mx-auto space-y-4">
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
                          <p className="text-xs text-neutral-500">
                            {storyContent.trim().split(/\s+/).filter(Boolean).length} words
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                          <p className="text-xs text-neutral-400">
                            <strong className="text-teal-400">Tip: </strong>Click the mic button to record your thoughts,
                            then use &quot;Enhance with VIVA&quot; to transform your raw ideas into a polished, immersive story.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
