'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Badge, Stack, PageHero, Button, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft, Plus, Zap, Users, CheckCircle, List } from 'lucide-react'

interface Sequence {
  id: string
  name: string
  description: string | null
  trigger_event: string
  status: string
  total_enrolled: number
  total_completed: number
  sequence_steps?: { count: number }[]
}

function SequencesListContent() {
  const router = useRouter()
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter === 'active') params.set('status', 'active')
    if (filter === 'paused') params.set('status', 'paused')

    fetch(`/api/admin/sequences?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSequences(data.sequences || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const getStepCount = (seq: Sequence) => {
    const steps = seq.sequence_steps
    if (Array.isArray(steps) && steps[0] && typeof steps[0] === 'object' && 'count' in steps[0]) {
      return (steps[0] as { count: number }).count
    }
    return 0
  }

  const filteredSequences =
    filter === 'all'
      ? sequences
      : sequences.filter((s) => s.status === filter)

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/emails')}
            className="text-neutral-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Messaging Hub
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <PageHero
              title="Sequences"
              subtitle="Drip campaigns triggered by events"
            />
            <Button
              variant="primary"
              onClick={() => router.push('/admin/sequences/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Sequence
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'paused'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-primary-500 text-black'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {filteredSequences.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <Zap className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No sequences yet</h3>
            <p className="text-neutral-400 mb-6">
              Create your first drip campaign to automate messaging based on events.
            </p>
            <Button variant="primary" onClick={() => router.push('/admin/sequences/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Sequence
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSequences.map((seq) => (
              <Card
                key={seq.id}
                variant="elevated"
                className="p-6 cursor-pointer hover:border-primary-500 transition-all"
                onClick={() => router.push(`/admin/sequences/${seq.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{seq.name}</h3>
                  <Badge
                    className={
                      seq.status === 'active'
                        ? 'bg-primary-500/20 text-primary-500'
                        : seq.status === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-neutral-600 text-neutral-400'
                    }
                  >
                    {seq.status}
                  </Badge>
                </div>
                {seq.description && (
                  <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{seq.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                  <span className="font-medium text-neutral-400">{seq.trigger_event}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5">
                    <List className="w-3 h-3 mr-1 inline" />
                    {getStepCount(seq)} steps
                  </Badge>
                  <Badge className="bg-secondary-500/20 text-secondary-500 text-[10px] px-2 py-0.5">
                    <Users className="w-3 h-3 mr-1 inline" />
                    {seq.total_enrolled} enrolled
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5">
                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                    {seq.total_completed} completed
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}

export default function SequencesPage() {
  return (
    <AdminWrapper>
      <SequencesListContent />
    </AdminWrapper>
  )
}
