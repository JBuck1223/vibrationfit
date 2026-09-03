'use client'

import { useState, useEffect, useMemo, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Input, Button, CategoryGrid, Container, Stack, Spinner, DeleteConfirmationDialog, Textarea } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, ArrowUpRight, BookOpen, CheckCircle, ChevronDown, ChevronRight,
  Edit3, Heart, Layers, ListChecks, Plus, Save, Sparkles, Trash2, Unlink, Upload, XCircle,
} from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import Link from 'next/link'
import { colors } from '@/lib/design-system/tokens'
import { AddToKitSheet } from '@/components/manifestations-studio/AddToKitSheet'
import { AddExistingToKitModal } from '@/components/manifestations-studio/AddExistingToKitModal'
import { GatherFromLibrary } from '@/components/manifestations-studio/GatherFromLibrary'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
import { keys } from '@/lib/query/keys'
import { SLOT_LABELS, assetLink, type KitSlot, type Manifestation, type ManifestationAsset } from '@/lib/manifestations/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'actualized', label: 'Actualized' },
  { value: 'inactive', label: 'Inactive' },
]

interface TaskRow {
  id: string
  title: string
  description: string | null
  is_complete: boolean
  parent_task_id: string | null
  sort_order: number
}

interface ActionGroup {
  id: string
  title: string
  description: string | null
  status: string
  project_tasks: TaskRow[]
}

interface JournalEntryRow {
  id: string
  title: string | null
  content: string | null
  date: string
  journal_tag: string | null
}

interface AssetRowData extends ManifestationAsset {
  label?: string | null
}

interface ManifestationDetail {
  manifestation: Manifestation
  assets: AssetRowData[]
  journal_entries: JournalEntryRow[]
  activations_this_week: number
  activations_since_opened: number
  projects: ActionGroup[]
}

async function fetchDetail(id: string): Promise<ManifestationDetail> {
  const res = await fetch(`/api/manifestations/${id}`)
  if (!res.ok) throw new Error('Failed to load manifestation')
  return res.json()
}

function SectionHeader({ icon: Icon, title, subtitle, action }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#39FF14]/10 shrink-0">
          <Icon className="h-4 w-4 text-[#39FF14]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export default function ManifestationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: keys.manifestationKit(id),
    queryFn: () => fetchDetail(id),
    enabled: Boolean(id),
  })
  const item = data?.manifestation || null

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddToKit, setShowAddToKit] = useState(false)
  const [showAttachJournal, setShowAttachJournal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [actualizedFile, setActualizedFile] = useState<File | null>(null)
  const [audioRecordings, setAudioRecordings] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    why_it_matters: '',
    what_it_feels_like: '',
    actualization_story: '',
    status: 'active',
    categories: [] as string[],
  })
  const [imageSource, setImageSource] = useState<'upload' | 'ai'>('upload')
  const [actualizedImageSource, setActualizedImageSource] = useState<'upload' | 'ai'>('upload')
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const [actualizedAiGeneratedImageUrl, setActualizedAiGeneratedImageUrl] = useState<string | null>(null)
  const [showVisionFileDrop, setShowVisionFileDrop] = useState(false)
  const [showEvidenceFileDrop, setShowEvidenceFileDrop] = useState(false)
  const [pullingVision, setPullingVision] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [stepDrafts, setStepDrafts] = useState<Record<string, string>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showGather, setShowGather] = useState(false)
  const editParamAppliedRef = useRef(false)

  // Hydrate the edit form whenever fresh data lands and we're not mid-edit
  useEffect(() => {
    if (!item || isEditing) return
    setFormData({
      name: item.name,
      description: item.description || '',
      why_it_matters: item.why_it_matters || '',
      what_it_feels_like: item.what_it_feels_like || '',
      actualization_story: item.actualization_story || '',
      status: item.status,
      categories: item.categories || [],
    })
    setAudioRecordings((item as unknown as { audio_recordings?: any[] }).audio_recordings || [])
  }, [item, isEditing])

  useEffect(() => {
    if (!item || editParamAppliedRef.current) return
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('edit') !== '1') return
    editParamAppliedRef.current = true
    setIsEditing(true)
    router.replace(`/manifestations/${item.id}`, { scroll: false })
  }, [item, router])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.manifestationKit(id) })
    queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
    queryClient.invalidateQueries({ queryKey: keys.visionBoardCount })
  }

  const journalAssetByEntryId = useMemo(() => {
    const map = new Map<string, AssetRowData>()
    for (const asset of data?.assets || []) {
      if (asset.slot === 'journal' && asset.entity_id) map.set(asset.entity_id, asset)
    }
    return map
  }, [data])

  const otherAssets = useMemo(
    () => (data?.assets || []).filter(a => a.slot !== 'journal' && a.slot !== 'project'),
    [data],
  )

  const handleCategoryToggle = (categoryLabel: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryLabel)
        ? prev.categories.filter(c => c !== categoryLabel)
        : [...prev.categories, categoryLabel]
    }))
  }

  /** Copy language from the matching Life Vision categories — a copy, never a link. */
  const pullFromLifeVision = async () => {
    if (pullingVision) return
    setPullingVision(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data: vision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .is('household_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!vision) {
        alert('No active Life Vision found to pull from.')
        return
      }
      const cats = formData.categories.length > 0
        ? formData.categories
        : VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion').map(c => c.key)
      const texts = cats
        .map(key => (typeof vision[key] === 'string' ? vision[key].trim() : ''))
        .filter(Boolean)
      if (texts.length === 0) {
        alert('The matching Life Vision categories are empty.')
        return
      }
      const pulled = texts.join('\n\n')
      setFormData(prev => ({
        ...prev,
        why_it_matters: prev.why_it_matters ? `${prev.why_it_matters}\n\n${pulled}` : pulled,
      }))
    } finally {
      setPullingVision(false)
    }
  }

  const handleSave = async () => {
    if (!item) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        alert('Please log in to edit this manifestation')
        return
      }

      let imageUrl = item.image_url
      if (file || aiGeneratedImageUrl) {
        if (item.image_url) {
          try {
            const url = new URL(item.image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(oldPath)
          } catch (error) {
            console.warn('Failed to delete old image file:', error)
          }
        }
        if (file) {
          try {
            const uploadResult = await uploadUserFile('visionBoardUploaded', file, user.id)
            imageUrl = uploadResult.url
          } catch {
            alert('Upload failed. Please try again or contact support if the issue persists.')
            return
          }
        } else if (aiGeneratedImageUrl) {
          imageUrl = aiGeneratedImageUrl
        }
      }

      let actualizedImageUrl = item.actualized_image_url
      if (formData.status === 'actualized') {
        if (actualizedFile || actualizedAiGeneratedImageUrl) {
          if (item.actualized_image_url) {
            try {
              const url = new URL(item.actualized_image_url)
              const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
              await deleteUserFile(oldPath)
            } catch (error) {
              console.warn('Failed to delete old actualized image file:', error)
            }
          }
          if (actualizedFile) {
            try {
              const uploadResult = await uploadUserFile('visionBoardUploaded', actualizedFile, user.id)
              actualizedImageUrl = uploadResult.url
            } catch {
              alert('Upload failed. Please try again or contact support if the issue persists.')
              return
            }
          } else if (actualizedAiGeneratedImageUrl) {
            actualizedImageUrl = actualizedAiGeneratedImageUrl
          }
        }
      } else {
        if (item.actualized_image_url) {
          try {
            const url = new URL(item.actualized_image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(oldPath)
          } catch (error) {
            console.warn('Failed to delete actualized image file:', error)
          }
        }
        actualizedImageUrl = null
      }

      const { error } = await supabase
        .from('manifestations')
        .update({
          name: formData.name,
          description: formData.description,
          why_it_matters: formData.why_it_matters.trim() || null,
          what_it_feels_like: formData.what_it_feels_like.trim() || null,
          image_url: imageUrl,
          actualized_image_url: actualizedImageUrl,
          actualization_story: formData.status === 'actualized' ? formData.actualization_story : null,
          status: formData.status,
          categories: formData.categories,
          actualized_at: formData.status === 'actualized' && item.status !== 'actualized'
            ? new Date().toISOString()
            : item.actualized_at,
          audio_recordings: audioRecordings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      if (formData.status !== item.status) {
        await supabase.rpc('increment_vision_board_stats', {
          p_user_id: user.id,
          p_status: formData.status
        })
        const { autoVerifyClient } = await import('@/lib/map/auto-verify-client')
        autoVerifyClient({ activityType: 'vision_board_update' })
      }

      setIsEditing(false)
      setFile(null)
      setAiGeneratedImageUrl(null)
      setActualizedFile(null)
      setActualizedAiGeneratedImageUrl(null)
      refresh()
    } catch (error) {
      console.error('Error updating manifestation:', error)
      alert('Failed to update this manifestation')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        alert('Please log in to delete this manifestation')
        return
      }

      for (const url of [item.image_url, item.actualized_image_url]) {
        if (!url) continue
        try {
          const parsed = new URL(url)
          const imagePath = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname
          await deleteUserFile(imagePath)
        } catch (error) {
          console.warn('Failed to delete image file:', error)
        }
      }

      const { error } = await supabase
        .from('manifestations')
        .delete()
        .eq('id', id)

      if (error) throw error

      try {
        await supabase.rpc('decrement_vision_board_stats', {
          p_user_id: user.id,
          p_status: item.status
        })
      } catch (rpcError) {
        console.warn('RPC function decrement_vision_board_stats not found:', rpcError)
      }

      router.push('/manifestations')
    } catch (error) {
      console.error('Error deleting manifestation:', error)
      alert('Failed to delete this manifestation')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ----- Inspired Action Steps (nested action groups + steps) -----

  const addActionGroup = async () => {
    const title = newGroupTitle.trim()
    if (!title || addingGroup) return
    setAddingGroup(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, manifestation_id: id, life_categories: item?.categories || [] }),
    })
    setAddingGroup(false)
    if (res.ok) {
      setNewGroupTitle('')
      setShowAddGroup(false)
      refresh()
    }
  }

  const addStep = async (projectId: string, parentTaskId?: string) => {
    const key = parentTaskId ? `${projectId}:${parentTaskId}` : projectId
    const title = (stepDrafts[key] || '').trim()
    if (!title) return
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parent_task_id: parentTaskId || undefined }),
    })
    if (res.ok) {
      setStepDrafts(prev => ({ ...prev, [key]: '' }))
      refresh()
    }
  }

  const toggleStep = async (projectId: string, task: TaskRow) => {
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, is_complete: !task.is_complete }),
    })
    refresh()
  }

  const deleteStep = async (projectId: string, taskId: string) => {
    await fetch(`/api/projects/${projectId}/tasks?task_id=${taskId}`, { method: 'DELETE' })
    refresh()
  }

  const deleteGroup = async (projectId: string) => {
    if (!confirm('Remove this action group and its steps?')) return
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    refresh()
  }

  const unlinkAsset = async (assetId: string) => {
    await fetch(`/api/manifestations/${id}/assets/${assetId}`, { method: 'DELETE' })
    refresh()
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <div className="bg-green-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold">Active</span>
        </div>
      )
    }
    if (status === 'actualized') {
      return (
        <div className="bg-purple-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Actualized</span>
        </div>
      )
    }
    if (status === 'inactive') {
      return (
        <div className="bg-gray-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <XCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Inactive</span>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!item) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Manifestation not found</h2>
          <p className="text-neutral-400 mb-6">This manifestation doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Button asChild>
            <Link href="/manifestations">Back to Manifestations</Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const taskTree = (tasks: TaskRow[]) => {
    const top = tasks.filter(t => !t.parent_task_id).sort((a, b) => a.sort_order - b.sort_order)
    const children = (parentId: string) =>
      tasks.filter(t => t.parent_task_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
    return { top, children }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/manifestations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Manifestations
          </Button>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddToKit(true)}>
                <Layers className="w-4 h-4 mr-2" />
                Link
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </div>

        <Card className="p-4 md:p-6 lg:p-8">
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
              <div>
                <Input
                  label="Manifestation"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="What are you manifesting?"
                  required
                />
              </div>

              <RecordingTextarea
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe this manifestation. Click the microphone icon to record audio."
                rows={4}
                storageFolder="visionBoard"
                recordingPurpose="quick"
                category="vision-board"
                onAudioSaved={(audioUrl, transcript) => {
                  setAudioRecordings(prev => [...prev, {
                    url: audioUrl,
                    transcript,
                    type: 'audio' as const,
                    category: 'vision-board',
                    created_at: new Date().toISOString(),
                  }])
                }}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-white">Why you want it</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={pullFromLifeVision}
                    disabled={pullingVision}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {pullingVision ? 'Pulling…' : 'Pull from my Life Vision'}
                  </Button>
                </div>
                <Textarea
                  value={formData.why_it_matters}
                  onChange={(e) => setFormData({ ...formData, why_it_matters: e.target.value })}
                  placeholder="Why this matters to you — in your words. Your Life Vision can seed the language; this text belongs to the manifestation."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">What it feels like</label>
                <Textarea
                  value={formData.what_it_feels_like}
                  onChange={(e) => setFormData({ ...formData, what_it_feels_like: e.target.value })}
                  placeholder="First person, present tense — what living this feels like."
                  rows={4}
                />
              </div>

              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Update your vision image
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageSource('upload')
                      setAiGeneratedImageUrl(null)
                      setShowVisionFileDrop(true)
                    }}
                    className="w-full sm:flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSource('ai')
                      setFile(null)
                      setShowVisionFileDrop(false)
                    }}
                    style={
                      imageSource === 'ai'
                        ? { backgroundColor: colors.semantic.premium, borderColor: colors.semantic.premium }
                        : { borderColor: colors.semantic.premium, color: colors.semantic.premium }
                    }
                    className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                      imageSource === 'ai'
                        ? 'text-white hover:opacity-90'
                        : 'bg-transparent hover:bg-[#BF00FF]/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </button>
                </div>

                {item.image_url && (
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <img
                        src={item.image_url}
                        alt="Current Image"
                        className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-white">Current Image</p>
                        <p className="text-xs text-neutral-400">Will be replaced when you upload/generate new image</p>
                      </div>
                    </div>
                  </div>
                )}

                {imageSource === 'upload' && (showVisionFileDrop || file) && (
                  <FileUpload
                    dragDrop
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple={false}
                    maxFiles={1}
                    maxSize={10}
                    value={file ? [file] : []}
                    onChange={(files) => setFile(files[0] || null)}
                    onUpload={(files) => setFile(files[0] || null)}
                    dragDropText="Click to upload or drag and drop"
                    dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                    previewSize="lg"
                  />
                )}

                {imageSource === 'ai' && (
                  <>
                    <AIImageGenerator
                      type="vision_board"
                      onImageGenerated={(url) => setAiGeneratedImageUrl(url)}
                      title={formData.name}
                      description={formData.description}
                      visionText={
                        formData.name && formData.description
                          ? `${formData.name}. ${formData.description}`
                          : formData.description || formData.name || ''
                      }
                    />
                    {aiGeneratedImageUrl && (
                      <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <img
                            src={aiGeneratedImageUrl}
                            alt="VIVA Generated Preview"
                            className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                          />
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-white">VIVA Generated Image</p>
                            <p className="text-xs text-neutral-400">
                              Generated with VIVA
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiGeneratedImageUrl(null)}
                            className="w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {formData.status === 'actualized' && (
                <div>
                  <p className="text-sm text-neutral-400 mb-3 text-center">
                    Evidence of Actualization (Optional)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button
                      type="button"
                      variant={actualizedImageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActualizedImageSource('upload')
                        setActualizedAiGeneratedImageUrl(null)
                        setShowEvidenceFileDrop(true)
                      }}
                      className="w-full sm:flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Evidence
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setActualizedImageSource('ai')
                        setActualizedFile(null)
                        setShowEvidenceFileDrop(false)
                      }}
                      style={
                        actualizedImageSource === 'ai'
                          ? { backgroundColor: colors.semantic.premium, borderColor: colors.semantic.premium }
                          : { borderColor: colors.semantic.premium, color: colors.semantic.premium }
                      }
                      className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                        actualizedImageSource === 'ai'
                          ? 'text-white hover:opacity-90'
                          : 'bg-transparent hover:bg-[#BF00FF]/10'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with VIVA
                    </button>
                  </div>

                  {item.actualized_image_url && !actualizedFile && !actualizedAiGeneratedImageUrl && (
                    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mb-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <img
                          src={item.actualized_image_url}
                          alt="Current Actualized Image"
                          className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-sm font-medium text-white">Current Evidence Image</p>
                          <p className="text-xs text-neutral-400">Will be replaced when you upload/generate new image</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {actualizedImageSource === 'upload' && (showEvidenceFileDrop || actualizedFile) && (
                    <FileUpload
                      dragDrop
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={actualizedFile ? [actualizedFile] : []}
                      onChange={(files) => setActualizedFile(files[0] || null)}
                      onUpload={(files) => setActualizedFile(files[0] || null)}
                      dragDropText="Click to upload or drag and drop"
                      dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                      previewSize="lg"
                    />
                  )}

                  {actualizedImageSource === 'ai' && (
                    <>
                      <AIImageGenerator
                        type="vision_board"
                        onImageGenerated={(url) => setActualizedAiGeneratedImageUrl(url)}
                        title={`Actualized: ${formData.name}`}
                        description={`Evidence of actualization: ${formData.description}`}
                        visionText={
                          formData.name && formData.description
                            ? `Actualized: ${formData.name}. Evidence: ${formData.description}`
                            : `Actualized: ${formData.description || formData.name || ''}`
                        }
                      />
                      {actualizedAiGeneratedImageUrl && (
                        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <img
                              src={actualizedAiGeneratedImageUrl}
                              alt="VIVA Generated Evidence Preview"
                              className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                            />
                            <div className="flex-1 text-center sm:text-left">
                              <p className="text-sm font-medium text-white">VIVA Generated Evidence</p>
                              <p className="text-xs text-neutral-400">
                                Generated with VIVA
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActualizedAiGeneratedImageUrl(null)}
                              className="w-full sm:w-auto"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {formData.status === 'actualized' && (
                <RecordingTextarea
                  label="Actualization Story"
                  value={formData.actualization_story}
                  onChange={(value) => setFormData({ ...formData, actualization_story: value })}
                  placeholder="Tell the story of how this manifested. Click the microphone icon to record audio."
                  rows={6}
                  storageFolder="visionBoard"
                  recordingPurpose="quick"
                  category="vision-board-actualization"
                  onAudioSaved={(audioUrl, transcript) => {
                    setAudioRecordings(prev => [...prev, {
                      url: audioUrl,
                      transcript,
                      type: 'audio' as const,
                      category: 'vision-board-actualization',
                      created_at: new Date().toISOString(),
                    }])
                  }}
                />
              )}

              {audioRecordings.length > 0 && (
                <SavedRecordings
                  recordings={audioRecordings}
                  onDelete={(index) => setAudioRecordings(prev => prev.filter((_, i) => i !== index))}
                />
              )}

              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Select the status for this manifestation
                </p>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        status: status.value,
                        actualization_story: status.value === 'actualized' ? formData.actualization_story : ''
                      })}
                      className={`px-2 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 flex-1 ${
                        formData.status === status.value
                          ? status.value === 'active'
                            ? 'bg-green-600 text-white shadow-lg'
                            : status.value === 'actualized'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {status.value === 'active' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                      {status.value === 'actualized' && <CheckCircle className="w-3 h-3 text-white" />}
                      {status.value === 'inactive' && <XCircle className="w-3 h-3 text-white" />}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Select categories for this manifestation
                </p>
                <CategoryGrid
                  categories={VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion')}
                  selectedCategories={formData.categories}
                  onCategoryClick={handleCategoryToggle}
                  lifeVisionCategoryStrip
                  desktopColumnCount={6}
                  bleedClassName="-mx-4 md:-mx-6 lg:-mx-8"
                />
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowVisionFileDrop(false)
                    setShowEvidenceFileDrop(false)
                    setIsEditing(false)
                  }}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={saving}
                  disabled={saving}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Hero — before/after slider when both photos exist */}
              {(() => {
                const hasBoth = Boolean(item.image_url && item.actualized_image_url)
                const displayImageUrl = (item.status === 'actualized' && item.actualized_image_url)
                  ? item.actualized_image_url
                  : item.image_url
                if (hasBoth) {
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-[#282828] bg-black h-[45vh] md:h-[56vh]">
                      <BeforeAfterSlider
                        beforeSrc={item.image_url!}
                        afterSrc={item.actualized_image_url!}
                        fill
                        className="w-full h-full"
                      />
                      <div className="absolute top-3 right-3 pointer-events-none">
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.2em] text-white/70 bg-black/40 rounded-full px-2.5 py-1 pointer-events-none">
                        Vision ↔ Actualized — drag to compare
                      </p>
                    </div>
                  )
                }
                return displayImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#282828]">
                    <img
                      src={displayImageUrl}
                      alt={item.name}
                      className="w-full h-auto max-h-[45vh] md:max-h-[56vh] object-cover block"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">{getStatusBadge(item.status)}</div>
                )
              })()}

              {/* Title + meta */}
              <div className="space-y-3 -mt-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{item.name}</h1>
                {item.description && (
                  <p className="text-neutral-300 text-base md:text-lg">{item.description}</p>
                )}
                {item.categories && item.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.categories.map((categoryKey: string) => {
                      const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                      const CategoryIcon = categoryInfo?.icon
                      return (
                        <span
                          key={categoryKey}
                          className="inline-flex items-center gap-1.5 text-xs bg-primary-500/15 text-primary-500 border border-primary-500/25 px-2.5 py-1 rounded-full"
                        >
                          {CategoryIcon && (
                            <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          )}
                          {categoryInfo ? categoryInfo.label : categoryKey}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stats strip */}
              {(() => {
                const groups = data?.projects || []
                const totalSteps = groups.reduce((n, g) => n + (g.project_tasks?.length || 0), 0)
                const doneSteps = groups.reduce((n, g) => n + (g.project_tasks || []).filter(t => t.is_complete).length, 0)
                const journeyCount = data?.journal_entries?.length || 0
                const days = Math.max(1, Math.round((Date.now() - new Date(item.created_at).getTime()) / 86400000))
                const stats: Array<{ label: string; value: string; accent?: string }> = [
                  item.status === 'actualized' && item.actualized_at
                    ? { label: 'Actualized', value: new Date(item.actualized_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), accent: 'text-purple-400' }
                    : { label: 'Days manifesting', value: String(days) },
                  { label: 'Inspired actions', value: totalSteps > 0 ? `${doneSteps}/${totalSteps}` : '—', accent: doneSteps > 0 ? 'text-[#39FF14]' : undefined },
                  { label: 'Journey entries', value: journeyCount > 0 ? String(journeyCount) : '—' },
                  { label: 'Showed up this week', value: String(data?.activations_this_week ?? 0), accent: (data?.activations_this_week ?? 0) > 0 ? 'text-[#39FF14]' : undefined },
                ]
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {stats.map(stat => (
                      <div key={stat.label} className="rounded-xl border border-[#282828] bg-[#161616] px-4 py-3 text-center">
                        <p className={`text-lg font-bold ${stat.accent || 'text-white'}`}>{stat.value}</p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Work it with VIVA */}
              <section className="rounded-2xl border border-[#BF00FF]/25 bg-[#BF00FF]/[0.06] p-4 md:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BF00FF]/15 shrink-0">
                      <Sparkles className="h-4 w-4 text-[#D46BFF]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Work this with VIVA</h3>
                      <p className="text-xs text-neutral-400">Seed it from what you already have, or keep building it in conversation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowGather(v => !v)}>
                      <Layers className="w-4 h-4 mr-1.5" />
                      Gather from what I have
                    </Button>
                    <Button variant="accent" size="sm" asChild>
                      <Link href="/viva">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Continue in VIVA
                      </Link>
                    </Button>
                  </div>
                </div>
                {showGather && (
                  <GatherFromLibrary
                    kitId={item.id}
                    categories={item.categories || []}
                    query={item.name}
                    onPinned={() => { setShowGather(false); refresh() }}
                  />
                )}
              </section>

              {/* Why you want it / What it feels like */}
              <section className="space-y-4">
                <SectionHeader
                  icon={Heart}
                  title="Why you want it"
                  subtitle="Owned by this manifestation — your Life Vision seeds the language, then this text is yours"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  }
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#282828] bg-[#161616] px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1.5">Why you want it</p>
                    {item.why_it_matters ? (
                      <p className="text-neutral-200 whitespace-pre-wrap">{item.why_it_matters}</p>
                    ) : (
                      <p className="text-sm text-neutral-500">Not captured yet — add why this matters to you.</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#282828] bg-[#161616] px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1.5">What it feels like</p>
                    {item.what_it_feels_like ? (
                      <p className="text-neutral-200 whitespace-pre-wrap">{item.what_it_feels_like}</p>
                    ) : (
                      <p className="text-sm text-neutral-500">Not captured yet — first person, present tense.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Inspired Action Steps */}
              <section className="space-y-4">
                <SectionHeader
                  icon={ListChecks}
                  title="Inspired Action Steps"
                  subtitle="Action groups with steps — simple lists or nested plans"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setShowAddGroup(v => !v)}>
                      <Plus className="w-4 h-4 mr-1" /> Group
                    </Button>
                  }
                />
                {showAddGroup && (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={newGroupTitle}
                      onChange={e => setNewGroupTitle(e.target.value)}
                      placeholder="Action group title (e.g. Closet, Bedroom, Garage)"
                    />
                    <Button variant="primary" size="sm" onClick={addActionGroup} disabled={addingGroup || !newGroupTitle.trim()}>
                      {addingGroup ? 'Adding…' : 'Add'}
                    </Button>
                  </div>
                )}
                {(data?.projects || []).length === 0 && !showAddGroup ? (
                  <p className="text-sm text-neutral-500">No inspired actions yet. Add a group, or ask VIVA to capture next steps from a conversation.</p>
                ) : (
                  <div className="space-y-3">
                    {(data?.projects || []).map(group => {
                      const { top, children } = taskTree(group.project_tasks || [])
                      const done = (group.project_tasks || []).filter(t => t.is_complete).length
                      const total = (group.project_tasks || []).length
                      const collapsed = collapsedGroups.has(group.id)
                      return (
                        <div key={group.id} className="rounded-xl border border-[#282828] bg-[#161616]">
                          <div className="flex items-center gap-2 px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setCollapsedGroups(prev => {
                                const next = new Set(prev)
                                if (next.has(group.id)) next.delete(group.id)
                                else next.add(group.id)
                                return next
                              })}
                              className="text-neutral-400 hover:text-white"
                            >
                              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{group.title}</p>
                              {group.description && <p className="text-xs text-neutral-500 line-clamp-1">{group.description}</p>}
                            </div>
                            {total > 0 && (
                              <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 shrink-0">{done}/{total}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteGroup(group.id)}
                              className="text-neutral-500 hover:text-red-400 shrink-0"
                              title="Remove action group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {!collapsed && (
                            <div className="px-4 pb-4 space-y-1.5">
                              {top.map(task => (
                                <div key={task.id}>
                                  <div className="flex items-center gap-2.5 py-1">
                                    <button type="button" onClick={() => toggleStep(group.id, task)} className="shrink-0">
                                      {task.is_complete
                                        ? <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                                        : <div className="w-4 h-4 rounded-full border-2 border-neutral-600 hover:border-neutral-400" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${task.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                                      {task.title}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => deleteStep(group.id, task.id)}
                                      className="text-neutral-600 hover:text-red-400 shrink-0"
                                      title="Delete step"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {children(task.id).map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2.5 py-1 pl-7">
                                      <button type="button" onClick={() => toggleStep(group.id, sub)} className="shrink-0">
                                        {sub.is_complete
                                          ? <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                                          : <div className="w-4 h-4 rounded-full border-2 border-neutral-600 hover:border-neutral-400" />}
                                      </button>
                                      <span className={`flex-1 text-sm ${sub.is_complete ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                                        {sub.title}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => deleteStep(group.id, sub.id)}
                                        className="text-neutral-600 hover:text-red-400 shrink-0"
                                        title="Delete step"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ))}
                              <div className="flex gap-2 items-center pt-1.5">
                                <input
                                  value={stepDrafts[group.id] || ''}
                                  onChange={e => setStepDrafts(prev => ({ ...prev, [group.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(group.id) } }}
                                  placeholder="Add a step…"
                                  className="flex-1 bg-transparent border-b border-[#2A2A2A] focus:border-neutral-500 outline-none text-sm text-white py-1.5 placeholder:text-neutral-600"
                                />
                                <Button variant="ghost" size="sm" onClick={() => addStep(group.id)} disabled={!(stepDrafts[group.id] || '').trim()}>
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* The Journey */}
              <section className="space-y-4">
                <SectionHeader
                  icon={BookOpen}
                  title="The Journey"
                  subtitle="Journal entries documenting clarity and steps toward this manifestation"
                  action={
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowAttachJournal(true)}>
                        <Layers className="w-4 h-4 mr-1" /> Attach
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/journal/new?manifestation=${item.id}`}>
                          <Plus className="w-4 h-4 mr-1" /> Entry
                        </Link>
                      </Button>
                    </div>
                  }
                />
                {(data?.journal_entries || []).length === 0 ? (
                  <p className="text-sm text-neutral-500">No entries yet. Document the journey — VIVA can capture clarity from your conversations here too.</p>
                ) : (
                  <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-[#2A2A2A]">
                    {(data?.journal_entries || []).map(entry => {
                      const asset = journalAssetByEntryId.get(entry.id)
                      return (
                        <div key={entry.id} className="relative">
                          <span className="absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-[#39FF14] bg-[#101010]" />
                          <div className="rounded-xl border border-[#282828] bg-[#161616] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Link href={`/journal/${entry.id}`} className="flex-1 min-w-0 group">
                                <p className="text-sm font-medium text-white truncate group-hover:text-[#39FF14]">{entry.title || 'Untitled entry'}</p>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                                  {new Date(entry.date).toLocaleDateString()}
                                  {entry.journal_tag ? ` · ${entry.journal_tag}` : ''}
                                </p>
                              </Link>
                              <Link href={`/journal/${entry.id}`} className="text-neutral-500 hover:text-white shrink-0">
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                              {asset && (
                                <button
                                  type="button"
                                  onClick={() => unlinkAsset(asset.id)}
                                  className="text-neutral-500 hover:text-white shrink-0"
                                  title="Detach from this manifestation"
                                >
                                  <Unlink className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {entry.content && (
                              <p className="mt-1.5 text-sm text-neutral-400 line-clamp-2">{entry.content}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* How It Manifested */}
              {item.status === 'actualized' && (
                <section className="space-y-4">
                  <SectionHeader icon={CheckCircle} title="How It Manifested" subtitle="The actualization story" />
                  {item.actualization_story ? (
                    <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-neutral-200 whitespace-pre-wrap">{item.actualization_story}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Add the story of how this became real — edit this manifestation to capture it.</p>
                  )}
                </section>
              )}

              {/* Other pinned assets */}
              {otherAssets.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader icon={Layers} title="Pinned" subtitle="Stories, songs, and other pieces of this reality" />
                  <div className="space-y-2">
                    {otherAssets.map(asset => {
                      const href = assetLink(asset.slot as KitSlot, asset.entity_id, asset.handoff_path)
                      return (
                        <div key={asset.id} className="flex items-center gap-3 rounded-xl border border-[#282828] bg-[#161616] px-4 py-3">
                          <Link href={href} className="flex-1 min-w-0 hover:text-white">
                            <p className="text-sm text-white truncate">{asset.label || SLOT_LABELS[asset.slot as KitSlot] || asset.slot}</p>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{SLOT_LABELS[asset.slot as KitSlot]}</p>
                          </Link>
                          <Link href={href} className="text-neutral-500 hover:text-white">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => unlinkAsset(asset.id)}
                            className="text-neutral-500 hover:text-white"
                            title="Remove from this manifestation"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {item.status !== 'actualized' && (
                <section className="pt-2 text-center space-y-3">
                  <p className="text-sm text-neutral-500">Only you mark this. When this reality is real, Actualize it.</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, status: 'actualized' }))
                      setIsEditing(true)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Actualize
                  </Button>
                </section>
              )}

              {audioRecordings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.2em]">Recordings</h3>
                  <SavedRecordings
                    recordings={audioRecordings}
                    onDelete={() => {}}
                  />
                </div>
              )}

              <div className="flex flex-row items-center gap-2 sm:gap-3 sm:justify-end border-t border-[#222] pt-5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none sm:w-32"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 sm:flex-none sm:w-32"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>

        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Manifestation"
          itemName={item?.name || ''}
          itemType="Manifestation"
          isLoading={deleting}
          loadingText="Deleting..."
        />

        {item && (
          <AddToKitSheet
            isOpen={showAddToKit}
            onClose={() => setShowAddToKit(false)}
            slot="vision_board"
            entityType="manifestations"
            entityId={item.id}
            label={item.name}
            excludeId={item.id}
          />
        )}

        <AddExistingToKitModal
          isOpen={showAttachJournal}
          onClose={() => setShowAttachJournal(false)}
          kitId={id}
          defaultSlot="journal"
          onPinned={refresh}
        />
      </Stack>
    </Container>
  )
}
