'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
} from '@/lib/design-system/components'
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Users,
  UserPlus,
  ArrowLeft,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

interface Segment {
  id: string
  name: string
  description: string | null
  filters: { audience?: string }
  exclude_segment_id: string | null
  recipient_count: number | null
  created_at: string
}

const btnPrimary =
  'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300'
const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

export default function SegmentsListPage() {
  const router = useRouter()
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSegments()
  }, [])

  async function fetchSegments() {
    try {
      const res = await fetch('/api/crm/segments')
      if (!res.ok) throw new Error('Failed to load segments')
      const data = await res.json()
      setSegments(data.segments || [])
    } catch {
      toast.error('Failed to load segments')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete segment "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/crm/segments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSegments(segments.filter((s) => s.id !== id))
      toast.success('Segment deleted')
    } catch {
      toast.error('Failed to delete segment')
    }
  }

  function audienceIcon(audience?: string) {
    if (audience === 'members') return <Users className="w-3.5 h-3.5" />
    if (audience === 'leads') return <UserPlus className="w-3.5 h-3.5" />
    return <Users className="w-3.5 h-3.5" />
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Audience Segments" subtitle="Build and manage reusable recipient lists">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/crm')}
              className={btnGhost}
            >
              <ArrowLeft className="w-4 h-4" />
              CRM
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/crm/segments/new')}
              className={btnPrimary}
            >
              <Plus className="w-4 h-4" />
              New Segment
            </button>
          </div>
        </PageHero>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : segments.length === 0 ? (
          <Card className="p-12 text-center">
            <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No segments yet</h3>
            <p className="text-neutral-400 mb-6">
              Create your first audience segment to start building targeted recipient lists.
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin/crm/segments/new')}
              className={btnPrimary}
            >
              <Plus className="w-4 h-4" />
              Create Segment
            </button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {segments.map((seg) => (
              <Card key={seg.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">{seg.name}</h3>
                      <Badge className="bg-[#39FF14]/20 text-[#39FF14] text-xs px-2.5 py-0.5 flex items-center gap-1">
                        {audienceIcon(seg.filters?.audience)}
                        {seg.filters?.audience || 'all'}
                      </Badge>
                      {seg.recipient_count !== null && (
                        <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] text-xs px-2.5 py-0.5">
                          {seg.recipient_count.toLocaleString()} recipients
                        </Badge>
                      )}
                    </div>
                    {seg.description && (
                      <p className="text-sm text-neutral-400 truncate">{seg.description}</p>
                    )}
                    <p className="text-xs text-neutral-600 mt-1">
                      Created {new Date(seg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/crm/blast?segmentId=${seg.id}`)}
                      className={btnGhost}
                      title="Use in Blast"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/crm/segments/${seg.id}/edit`)}
                      className={btnGhost}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(seg.id, seg.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}
