'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Card,
  Badge,
  Stack,
  PageHero,
  Button,
  Spinner,
  Input,
  Textarea,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ArrowLeft,
  Trash2,
  Plus,
  Mail,
  MessageSquare,
  Pause,
  Play,
  XCircle,
} from 'lucide-react'

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

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr`
  return `${Math.round(minutes / 1440)} day${Math.round(minutes / 1440) !== 1 ? 's' : ''}`
}

function StepEditForm({
  step,
  emailTemplates,
  smsTemplates,
  onSave,
  onCancel,
}: {
  step: Step
  emailTemplates: Template[]
  smsTemplates: Template[]
  onSave: (updates: Partial<Step>) => void
  onCancel: () => void
}) {
  const [channel, setChannel] = useState(step.channel)
  const [templateId, setTemplateId] = useState(step.template_id)
  const [delayMinutes, setDelayMinutes] = useState(step.delay_minutes)
  const [delayFrom, setDelayFrom] = useState(step.delay_from)

  const templates = channel === 'email' ? emailTemplates : smsTemplates

  return (
    <div className="p-4 bg-neutral-900 rounded-xl border-2 border-primary-500/50 space-y-4">
      <h3 className="text-sm font-semibold text-white">Edit Step {step.step_order}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Channel</label>
          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value)
              setTemplateId('')
            }}
            className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
          >
            <option value="">Select template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Delay (minutes)</label>
          <Input
            type="number"
            min={0}
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Delay From</label>
          <select
            value={delayFrom}
            onChange={(e) => setDelayFrom(e.target.value)}
            className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
          >
            <option value="enrollment">Enrollment</option>
            <option value="previous_step">Previous Step</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => onSave({ channel, template_id: templateId, delay_minutes: delayMinutes, delay_from: delayFrom })}
          disabled={!templateId}
        >
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

interface Sequence {
  id: string
  name: string
  description: string | null
  trigger_event: string
  trigger_conditions: Record<string, unknown>
  exit_events: string[]
  status: string
}

interface Step {
  id: string
  step_order: number
  channel: string
  template_id: string
  delay_minutes: number
  delay_from: string
}

interface Enrollment {
  id: string
  email: string | null
  phone: string | null
  status: string
  current_step_order: number
  enrolled_at: string
  next_step_at: string | null
}

interface Template {
  id: string
  name: string
}

function SequenceDetailContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([])
  const [smsTemplates, setSmsTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>('')
  const [showAddStep, setShowAddStep] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_event: 'lead.created',
    trigger_conditions: '{}',
    exit_events: '',
    status: 'paused',
  })

  const [newStep, setNewStep] = useState({
    channel: 'email',
    template_id: '',
    delay_minutes: 0,
    delay_from: 'previous_step',
  })

  const fetchData = useCallback(async () => {
    const [seqRes, emailRes, smsRes] = await Promise.all([
      fetch(`/api/admin/sequences/${id}`),
      fetch('/api/admin/templates/email'),
      fetch('/api/admin/templates/sms'),
    ])

    const seqData = await seqRes.json()
    const emailData = await emailRes.json()
    const smsData = await smsRes.json()

    if (!seqRes.ok) {
      router.push('/admin/sequences')
      return
    }

    setSequence(seqData.sequence)
    setSteps(seqData.steps || [])
    setEnrollments(seqData.enrollments || [])
    setEmailTemplates(emailData.templates || [])
    setSmsTemplates(smsData.templates || [])

    const s = seqData.sequence
    setForm({
      name: s.name || '',
      description: s.description || '',
      trigger_event: s.trigger_event || 'lead.created',
      trigger_conditions: JSON.stringify(s.trigger_conditions || {}, null, 2),
      exit_events: Array.isArray(s.exit_events) ? s.exit_events.join(', ') : '',
      status: s.status || 'paused',
    })
  }, [id, router])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const handleSaveSequence = async () => {
    setSaving(true)
    let triggerConditions = {}
    try {
      triggerConditions = JSON.parse(form.trigger_conditions || '{}')
    } catch {
      setSaving(false)
      return
    }

    const exitEvents = form.exit_events
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await fetch(`/api/admin/sequences/${id}`, {
      method: 'PUT',
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

    if (res.ok) {
      const data = await res.json()
      setSequence(data.sequence)
    }
    setSaving(false)
  }

  const handleDeleteSequence = async () => {
    if (!confirm('Delete this sequence? This cannot be undone.')) return
    const res = await fetch(`/api/admin/sequences/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin/sequences')
  }

  const handleAddStep = async () => {
    if (!newStep.template_id) return
    const res = await fetch(`/api/admin/sequences/${id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: newStep.channel,
        template_id: newStep.template_id,
        delay_minutes: newStep.delay_minutes,
        delay_from: newStep.delay_from,
      }),
    })
    if (res.ok) {
      await fetchData()
      setShowAddStep(false)
      setNewStep({ channel: 'email', template_id: '', delay_minutes: 0, delay_from: 'previous_step' })
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return
    const res = await fetch(`/api/admin/sequences/${id}/steps?stepId=${stepId}`, {
      method: 'DELETE',
    })
    if (res.ok) await fetchData()
  }

  const handleUpdateStep = async (step: Step, updates: Partial<Step>) => {
    const res = await fetch(`/api/admin/sequences/${id}/steps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: step.id,
        step_order: updates.step_order ?? step.step_order,
        channel: updates.channel ?? step.channel,
        template_id: updates.template_id ?? step.template_id,
        delay_minutes: updates.delay_minutes ?? step.delay_minutes,
        delay_from: updates.delay_from ?? step.delay_from,
      }),
    })
    if (res.ok) {
      await fetchData()
      setEditingStepId(null)
    }
  }

  const handleEnrollmentAction = async (enrollmentId: string, action: 'cancel' | 'pause' | 'resume') => {
    const res = await fetch(`/api/admin/sequences/${id}/enrollments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId, action }),
    })
    if (res.ok) await fetchData()
  }

  const getTemplateName = (templateId: string, channel: string) => {
    const list = channel === 'email' ? emailTemplates : smsTemplates
    const t = list.find((x: Template) => x.id === templateId)
    return t?.name || templateId.slice(0, 8)
  }

  const filteredEnrollments = enrollmentFilter
    ? enrollments.filter((e) => e.status === enrollmentFilter)
    : enrollments

  if (loading || !sequence) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const templatesForChannel = newStep.channel === 'email' ? emailTemplates : smsTemplates

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
            title={sequence.name}
            subtitle={`${steps.length} steps, ${enrollments.length} enrollments`}
          />
        </div>

        {/* Section A: Sequence Info */}
        <Card variant="elevated" className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sequence Info</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Textarea
              label="Description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Trigger Event</label>
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
              label="Trigger Conditions (JSON)"
              rows={3}
              value={form.trigger_conditions}
              onChange={(e) => setForm((f) => ({ ...f, trigger_conditions: e.target.value }))}
            />
            <Input
              label="Exit Events (comma-separated)"
              value={form.exit_events}
              onChange={(e) => setForm((f) => ({ ...f, exit_events: e.target.value }))}
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
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={handleSaveSequence} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="danger" onClick={handleDeleteSequence}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Section B: Steps Builder */}
        <Card variant="elevated" className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Steps</h2>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="space-y-2">
                {editingStepId === step.id ? (
                  <StepEditForm
                    step={step}
                    emailTemplates={emailTemplates}
                    smsTemplates={smsTemplates}
                    onSave={(updates) => handleUpdateStep(step, updates)}
                    onCancel={() => setEditingStepId(null)}
                  />
                ) : (
                  <div
                    className="flex items-center gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary-500">
                      {step.step_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={
                            step.channel === 'email'
                              ? 'bg-primary-500/20 text-primary-500'
                              : 'bg-secondary-500/20 text-secondary-500'
                          }
                        >
                          {step.channel === 'email' ? (
                            <Mail className="w-3 h-3 mr-1" />
                          ) : (
                            <MessageSquare className="w-3 h-3 mr-1" />
                          )}
                          {step.channel}
                        </Badge>
                        <span className="text-sm text-white truncate">
                          {getTemplateName(step.template_id, step.channel)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDelay(step.delay_minutes)} from {step.delay_from.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStepId(step.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddStep && (
              <div className="p-4 bg-neutral-900 rounded-xl border-2 border-primary-500/50 space-y-4">
                <h3 className="text-sm font-semibold text-white">Add Step</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Channel</label>
                    <select
                      value={newStep.channel}
                      onChange={(e) => {
                        setNewStep((s) => ({
                          ...s,
                          channel: e.target.value,
                          template_id: '',
                        }))
                      }}
                      className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Template</label>
                    <select
                      value={newStep.template_id}
                      onChange={(e) => setNewStep((s) => ({ ...s, template_id: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
                    >
                      <option value="">Select template</option>
                      {templatesForChannel.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      Delay (minutes)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={newStep.delay_minutes}
                      onChange={(e) =>
                        setNewStep((s) => ({
                          ...s,
                          delay_minutes: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      Delay From
                    </label>
                    <select
                      value={newStep.delay_from}
                      onChange={(e) =>
                        setNewStep((s) => ({ ...s, delay_from: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14]"
                    >
                      <option value="enrollment">Enrollment</option>
                      <option value="previous_step">Previous Step</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleAddStep} disabled={!newStep.template_id}>
                    Add Step
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddStep(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showAddStep && (
              <Button
                variant="outline"
                onClick={() => setShowAddStep(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            )}
          </div>
        </Card>

        {/* Section C: Enrollments */}
        <Card variant="elevated" className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Enrollments</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setEnrollmentFilter('')}
              className={`px-3 py-1.5 rounded-full text-sm ${
                !enrollmentFilter ? 'bg-primary-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              All
            </button>
            {['active', 'completed', 'paused', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setEnrollmentFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize ${
                  enrollmentFilter === s ? 'bg-primary-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No enrollments{enrollmentFilter ? ` with status "${enrollmentFilter}"` : ''}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-800">
                    <th className="pb-3 pr-4">Contact</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Step</th>
                    <th className="pb-3 pr-4">Enrolled</th>
                    <th className="pb-3 pr-4">Next Step</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enr) => (
                    <tr key={enr.id} className="border-b border-neutral-800/50">
                      <td className="py-3 pr-4 text-white">
                        {enr.email || enr.phone || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            enr.status === 'active'
                              ? 'bg-primary-500/20 text-primary-500'
                              : enr.status === 'completed'
                              ? 'bg-green-500/20 text-green-500'
                              : enr.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-neutral-600 text-neutral-400'
                          }
                        >
                          {enr.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-neutral-400">{enr.current_step_order}</td>
                      <td className="py-3 pr-4 text-neutral-400">
                        {new Date(enr.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-neutral-400">
                        {enr.next_step_at
                          ? new Date(enr.next_step_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3">
                        {enr.status === 'active' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnrollmentAction(enr.id, 'pause')}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnrollmentAction(enr.id, 'cancel')}
                            >
                              <XCircle className="w-3 h-3 text-red-400" />
                            </Button>
                          </div>
                        )}
                        {enr.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnrollmentAction(enr.id, 'resume')}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Stack>
    </Container>
  )
}

export default function SequenceDetailPage() {
  return (
    <AdminWrapper>
      <SequenceDetailContent />
    </AdminWrapper>
  )
}
