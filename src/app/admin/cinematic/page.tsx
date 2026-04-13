'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal, Badge } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Plus, Film, Users, ChevronRight, Trash2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import type { CuSeries, CuCharacter, SeriesStatus } from '@/lib/cinematic/types'

const STATUS_COLORS: Record<SeriesStatus, string> = {
  planning: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  complete: 'bg-blue-500/20 text-blue-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
}

function CinematicContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<(CuSeries & { cu_characters: CuCharacter[] })[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newConcept, setNewConcept] = useState('')
  const [newTone, setNewTone] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchSeries = useCallback(async () => {
    try {
      const res = await fetch('/api/cinematic/series')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSeries(data.series)
    } catch {
      toast.error('Failed to load series')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSeries() }, [fetchSeries])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/cinematic/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, concept: newConcept, tone: newTone }),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('Series created')
      setShowCreateModal(false)
      setNewTitle('')
      setNewConcept('')
      setNewTone('')
      fetchSeries()
    } catch {
      toast.error('Failed to create series')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this series and all its episodes?')) return
    try {
      await fetch(`/api/cinematic/series/${id}`, { method: 'DELETE' })
      toast.success('Series deleted')
      fetchSeries()
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
      <PageHero
        title="Cinematic Universe"
        subtitle="Keyframe execution engine for video production"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Series
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/cinematic/characters')}>
            <Users className="w-4 h-4 mr-2" /> Characters
          </Button>
        </div>
      </div>

      {series.length === 0 ? (
        <Card className="p-12 text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
          <p className="text-zinc-400 mb-4">No series yet. Create one to get started.</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create First Series
          </Button>
        </Card>
      ) : (
        <Stack gap="md">
          {series.map((s) => (
            <Card key={s.id} className="p-6 hover:border-[#39FF14]/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/cinematic/studio?series_id=${s.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                  </div>
                  {s.concept && <p className="text-zinc-400 text-sm mb-2">{s.concept}</p>}
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {s.cu_characters?.length > 0 && (
                      <span><Users className="w-3 h-3 inline mr-1" />{s.cu_characters.length} characters</span>
                    )}
                    {s.platform_targets?.length > 0 && (
                      <span>{s.platform_targets.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
              </div>
            </Card>
          ))}
        </Stack>
      )}

      </Stack>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Series">
        <Stack gap="md">
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. What If?" />
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Concept</label>
            <RecordingTextarea
              value={newConcept}
              onChange={setNewConcept}
              placeholder="Comedy sketches about instant manifestation"
              rows={2}
              recordingPurpose="quick"
              instanceId="cinematic-series-concept"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Tone</label>
            <RecordingTextarea
              value={newTone}
              onChange={setNewTone}
              placeholder="Funny, surprising, cinematic"
              rows={2}
              recordingPurpose="quick"
              instanceId="cinematic-series-tone"
            />
          </div>
          <Button variant="primary" onClick={handleCreate} disabled={creating || !newTitle.trim()}>
            {creating ? <Spinner size="sm" /> : 'Create Series'}
          </Button>
        </Stack>
      </Modal>
    </Container>
  )
}

export default function CinematicPage() {
  return (
    <AdminWrapper>
      <CinematicContent />
    </AdminWrapper>
  )
}
