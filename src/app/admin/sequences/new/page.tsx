'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Stack,
  PageHero,
  Button,
  Input,
  Textarea,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ArrowLeft } from 'lucide-react'

const EVENT_NAMES = [
  'lead.created',
  'user.created',
  'subscription.created',
  'subscription.past_due',
  'subscription.cancelled',
  'session.created',
  'household.invited',
  'support.ticket_created',
  'support.ticket_replied',
]

function NewSequenceContent() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_event: 'lead.created',
    trigger_conditions: '{}',
    exit_events: '',
    status: 'paused',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    let triggerConditions = {}
    try {
      if (form.trigger_conditions.trim()) {
        triggerConditions = JSON.parse(form.trigger_conditions)
      }
    } catch {
      setError('trigger_conditions must be valid JSON')
      setSaving(false)
      return
    }

    const exitEvents = form.exit_events
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await fetch('/api/admin/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        trigger_event: form.trigger_event,
        trigger_conditions: triggerConditions,
        exit_events: exitEvents,
        status: form.status,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create sequence')
      setSaving(false)
      return
    }

    router.push(`/admin/sequences/${data.sequence.id}`)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/sequences')}
            className="text-neutral-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sequences
          </Button>
          <PageHero
            title="New Sequence"
            subtitle="Create a drip campaign triggered by an event"
          />
        </div>

        <Card variant="elevated" className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Name"
              required
              placeholder="e.g. Welcome Series"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <Textarea
              label="Description"
              placeholder="Optional description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
                Trigger Event
              </label>
              <select
                value={form.trigger_event}
                onChange={(e) => setForm((f) => ({ ...f, trigger_event: e.target.value }))}
                className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
              >
                {EVENT_NAMES.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label="Trigger Conditions (JSON, optional)"
              placeholder='{"plan": "premium"}'
              rows={3}
              value={form.trigger_conditions}
              onChange={(e) => setForm((f) => ({ ...f, trigger_conditions: e.target.value }))}
              helperText="Optional JSON object to filter when the trigger fires"
            />

            <Input
              label="Exit Events (comma-separated)"
              placeholder="subscription.cancelled, user.deleted"
              value={form.exit_events}
              onChange={(e) => setForm((f) => ({ ...f, exit_events: e.target.value }))}
              helperText="Events that remove users from this sequence"
            />

            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Sequence'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/sequences')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}

export default function NewSequencePage() {
  return (
    <AdminWrapper>
      <NewSequenceContent />
    </AdminWrapper>
  )
}
