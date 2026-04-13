'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Plus, User, Upload, Trash2, Image as ImageIcon, Camera } from 'lucide-react'
import { toast } from 'sonner'
import type { CuCharacter, CharacterType } from '@/lib/cinematic/types'

function CharactersContent() {
  const searchParams = useSearchParams()
  const seriesId = searchParams.get('series_id')

  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<CuCharacter[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStyleNotes, setFormStyleNotes] = useState('')
  const [formType, setFormType] = useState<CharacterType>('real_person')
  const [formRefImages, setFormRefImages] = useState<string[]>([])
  const [newRefUrl, setNewRefUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCharacters = useCallback(async () => {
    try {
      const params = seriesId ? `?series_id=${seriesId}` : ''
      const res = await fetch(`/api/cinematic/characters${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCharacters(data.characters)
    } catch {
      toast.error('Failed to load characters')
    } finally {
      setLoading(false)
    }
  }, [seriesId])

  useEffect(() => { fetchCharacters() }, [fetchCharacters])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormStyleNotes('')
    setFormType('real_person')
    setFormRefImages([])
    setNewRefUrl('')
    setEditingId(null)
  }

  const openEdit = (c: CuCharacter) => {
    setFormName(c.name)
    setFormDescription(c.description || '')
    setFormStyleNotes(c.style_notes || '')
    setFormType(c.character_type)
    setFormRefImages(c.reference_images || [])
    setEditingId(c.id)
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: formName,
        description: formDescription,
        style_notes: formStyleNotes,
        character_type: formType,
        reference_images: formRefImages,
        series_id: seriesId,
      }

      if (editingId) {
        const res = await fetch(`/api/cinematic/characters/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Character updated')
      } else {
        const res = await fetch('/api/cinematic/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
        toast.success('Character created')
      }

      setShowCreateModal(false)
      resetForm()
      fetchCharacters()
    } catch {
      toast.error('Failed to save character')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character?')) return
    try {
      await fetch(`/api/cinematic/characters/${id}`, { method: 'DELETE' })
      toast.success('Character deleted')
      fetchCharacters()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const addRefImage = () => {
    if (!newRefUrl.trim()) return
    setFormRefImages([...formRefImages, newRefUrl.trim()])
    setNewRefUrl('')
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
      <PageHero title="Characters" subtitle="Manage characters for cinematic video production" />

      <div className="flex items-center justify-between">
        <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true) }}>
          <Plus className="w-4 h-4 mr-2" /> New Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
          <p className="text-zinc-400 mb-4">No characters yet. Add yourself and Vanessa to get started.</p>
          <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Add Character
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {c.character_type === 'real_person' ? (
                    <Camera className="w-5 h-5 text-[#39FF14]" />
                  ) : (
                    <User className="w-5 h-5 text-[#BF00FF]" />
                  )}
                  <h3 className="font-semibold text-white">{c.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {c.description && <p className="text-sm text-zinc-400 mb-2">{c.description}</p>}
              {c.style_notes && (
                <p className="text-xs text-zinc-500 italic mb-2">Style: {c.style_notes}</p>
              )}
              {c.reference_images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {c.reference_images.slice(0, 4).map((url, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {c.reference_images.length > 4 && (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                      +{c.reference_images.length - 4}
                    </div>
                  )}
                </div>
              )}
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                c.character_type === 'real_person'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {c.character_type === 'real_person' ? 'Real Person' : 'Generated'}
              </span>
            </Card>
          ))}
        </div>
      )}

      </Stack>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm() }}
        title={editingId ? 'Edit Character' : 'New Character'}
      >
        <Stack gap="md">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Jordan" />
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Description</label>
            <RecordingTextarea
              value={formDescription}
              onChange={setFormDescription}
              placeholder="Brief description of the character"
              rows={2}
              recordingPurpose="quick"
              instanceId="cinematic-char-description"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Style Notes (prompt fragments for consistency)</label>
            <RecordingTextarea
              value={formStyleNotes}
              onChange={setFormStyleNotes}
              placeholder="30-year-old man, athletic build, short dark hair, warm skin tone"
              rows={3}
              recordingPurpose="quick"
              instanceId="cinematic-char-style-notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Character Type</label>
            <div className="flex gap-3">
              <Button variant={formType === 'real_person' ? 'primary' : 'ghost'} size="sm"
                onClick={() => setFormType('real_person')}>
                <Camera className="w-4 h-4 mr-1" /> Real Person
              </Button>
              <Button variant={formType === 'generated' ? 'primary' : 'ghost'} size="sm"
                onClick={() => setFormType('generated')}>
                <User className="w-4 h-4 mr-1" /> Generated
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Reference Images ({formRefImages.length})
            </label>
            {formRefImages.map((url, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-zinc-400 truncate flex-1">{url}</span>
                <Button variant="ghost" size="sm"
                  onClick={() => setFormRefImages(formRefImages.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newRefUrl} onChange={(e) => setNewRefUrl(e.target.value)}
                placeholder="Paste image URL (S3/CDN)" className="flex-1" />
              <Button variant="ghost" size="sm" onClick={addRefImage} disabled={!newRefUrl.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button variant="primary" onClick={handleSave} disabled={saving || !formName.trim()}>
            {saving ? <Spinner size="sm" /> : editingId ? 'Update Character' : 'Create Character'}
          </Button>
        </Stack>
      </Modal>
    </Container>
  )
}

export default function CharactersPage() {
  return (
    <AdminWrapper>
      <CharactersContent />
    </AdminWrapper>
  )
}
