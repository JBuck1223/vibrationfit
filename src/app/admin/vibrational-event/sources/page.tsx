'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Container,
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  Spinner,
  Inline,
  Stack,
  PageHero
} from '@/lib/design-system/components'
import { RefreshCcw, Plus, Trash2, Save, ToggleLeft, ToggleRight } from 'lucide-react'

interface AdminSource {
  id: string
  source_key: string
  label: string
  description: string | null
  enabled: boolean
  default_category: string | null
  field_map: Record<string, any>
  analyzer_config: Record<string, any>
  origin: 'default' | 'database'
  created_at: string
  updated_at: string
}

interface EditableSource {
  id?: string
  origin: 'default' | 'database' | 'new'
  source_key: string
  label: string
  description: string
  enabled: boolean
  default_category: string
  field_map: string
  analyzer_config: string
}

const EMPTY_FORM: EditableSource = {
  id: undefined,
  origin: 'new',
  source_key: '',
  label: '',
  description: '',
  enabled: true,
  default_category: '',
  field_map: '{}',
  analyzer_config: '{}',
}

function formatJson(value: Record<string, any> | undefined): string {
  try {
    if (!value || Object.keys(value).length === 0) {
      return '{}'
    }
    return JSON.stringify(value, null, 2)
  } catch {
    return '{}'
  }
}

export default function VibrationalEventSourcesAdminPage() {
  const [sources, setSources] = useState<AdminSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [form, setForm] = useState<EditableSource>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSources = async (): Promise<AdminSource[]> => {
    setLoading(true)
    setError(null)
    let list: AdminSource[] = []
    try {
      const res = await fetch('/api/admin/vibrational-event-sources', { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to load sources')
      }
      const data = await res.json()
      list = data.sources || []
      setSources(list)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load sources')
    } finally {
      setLoading(false)
    }
    return list
  }

  useEffect(() => {
    loadSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hydrateForm = (source: AdminSource) => {
    setSelectedKey(source.source_key)
    setForm({
      id: source.origin === 'database' ? source.id : undefined,
      origin: source.origin,
      source_key: source.source_key,
      label: source.label,
      description: source.description ?? '',
      enabled: source.enabled,
      default_category: source.default_category ?? '',
      field_map: formatJson(source.field_map),
      analyzer_config: formatJson(source.analyzer_config),
    })
  }

  const handleSelectSource = (source: AdminSource) => {
    setSuccess(null)
    setError(null)
    hydrateForm(source)
  }

  const handleCreateNew = () => {
    setSelectedKey(null)
    setForm(EMPTY_FORM)
    setSuccess(null)
    setError(null)
  }

  const parsedFieldMap = useMemo(() => {
    try {
      return JSON.parse(form.field_map || '{}')
    } catch {
      return null
    }
  }, [form.field_map])

  const parsedAnalyzerConfig = useMemo(() => {
    try {
      return JSON.parse(form.analyzer_config || '{}')
    } catch {
      return null
    }
  }, [form.analyzer_config])

  const handleToggleEnabled = () => {
    setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    let fieldMapObject: Record<string, any> = {}
    let analyzerConfigObject: Record<string, any> = {}

    try {
      fieldMapObject = JSON.parse(form.field_map || '{}')
    } catch {
      setError('field_map must be valid JSON')
      setSaving(false)
      return
    }

    try {
      analyzerConfigObject = JSON.parse(form.analyzer_config || '{}')
    } catch {
      setError('analyzer_config must be valid JSON')
      setSaving(false)
      return
    }

    const payload = {
      source_key: form.source_key.trim(),
      label: form.label.trim(),
      description: form.description.trim() || null,
      enabled: form.enabled,
      default_category: form.default_category.trim() || null,
      field_map: fieldMapObject,
      analyzer_config: analyzerConfigObject,
    }

    if (!payload.source_key) {
      setError('Source key is required')
      setSaving(false)
      return
    }

    if (!payload.label) {
      setError('Label is required')
      setSaving(false)
      return
    }

    try {
      let response: Response

      if (form.origin === 'database' && form.id && !form.id.startsWith('default-')) {
        response = await fetch(`/api/admin/vibrational-event-sources/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/admin/vibrational-event-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save source')
      }

      setSuccess('Source saved successfully')
      const updated = await loadSources()
      setSelectedKey(payload.source_key)
      const refreshed = updated.find((item) => item.source_key === payload.source_key)
      if (refreshed) {
        hydrateForm(refreshed)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save source')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form.id || form.origin !== 'database' || form.id.startsWith('default-')) {
      return
    }

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/vibrational-event-sources/${form.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete source')
      }

      setSuccess('Source deleted successfully')
      setForm(EMPTY_FORM)
      setSelectedKey(null)
      const updated = await loadSources()
      if (selectedKey) {
        const refreshed = updated.find((item) => item.source_key === selectedKey)
        if (refreshed) {
          hydrateForm(refreshed)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to delete source')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero 
            eyebrow="ADMIN" 
            title="Vibrational Event Sources" 
            subtitle="Control which systems feed the vibrational events log. Toggle sources, manage default categories, and map raw payload fields."
          >
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
              <Button variant="ghost" size="sm" onClick={loadSources}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </PageHero>

          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-500">
              {sources.length} total sources ({sources.filter((s) => s.origin === 'database').length} customized)
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold text-white">Sources</h2>
                {loading && <Spinner size="sm" />}
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {sources.length === 0 && !loading ? (
                  <div className="p-6 text-sm text-neutral-400">
                    No vibrational sources configured yet.
                  </div>
                ) : (
                  <Stack gap="xs" className="p-4">
                    {sources.map((source) => {
                      const isSelected = selectedKey === source.source_key
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => handleSelectSource(source)}
                          className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-transparent bg-neutral-900 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white flex items-center gap-2">
                                {source.label}
                                <Badge
                                  variant={source.origin === 'database' ? 'accent' : 'neutral'}
                                  className="uppercase text-[10px]"
                                >
                                  {source.origin === 'database' ? 'Custom' : 'Default'}
                                </Badge>
                              </div>
                              <div className="text-xs text-neutral-400 mt-1">
                                {source.source_key}
                              </div>
                            </div>
                            <Badge variant={source.enabled ? 'success' : 'danger'}>
                              {source.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          {source.description && (
                            <p className="mt-3 text-xs text-neutral-400 line-clamp-2">
                              {source.description}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </Stack>
                )}
              </div>
            </Card>

            <Card className="p-0 lg:col-span-2">
              <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {form.origin === 'new'
                      ? 'Create New Source'
                      : form.origin === 'default'
                      ? 'Customize Default Source'
                      : 'Edit Source'}
                  </h2>
                  {form.origin !== 'new' && form.source_key && (
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
                      {form.source_key}
                    </p>
                  )}
                </div>
                {(saving || deleting) && <Spinner size="sm" />}
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Source Key"
                    placeholder="scene"
                    value={form.source_key}
                    onChange={(event) => setForm((prev) => ({ ...prev, source_key: event.target.value }))}
                  />
                  <Input
                    label="Label"
                    placeholder="Scene Builder"
                    value={form.label}
                    onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  />
                </div>

                <Textarea
                  label="Description"
                  placeholder="Short description for admins"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Default Category (optional)"
                    placeholder="money, love, health..."
                    value={form.default_category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, default_category: event.target.value }))
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      Status
                    </label>
                    <Button
                      type="button"
                      variant={form.enabled ? 'primary' : 'outline'}
                      onClick={handleToggleEnabled}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {form.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {form.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#E5E7EB]">Field Map (JSON)</label>
                    <span className={`text-xs ${parsedFieldMap ? 'text-neutral-500' : 'text-red-400'}`}>
                      {parsedFieldMap ? 'Valid JSON' : 'Invalid JSON'}
                    </span>
                  </div>
                  <Textarea
                    rows={8}
                    value={form.field_map}
                    onChange={(event) => setForm((prev) => ({ ...prev, field_map: event.target.value }))}
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    Map payload fields to event columns. Example: <code>{`{"raw_text":"payload.text","emotional_valence":"analysis.valence"}`}</code>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#E5E7EB]">Analyzer Config (JSON)</label>
                    <span className={`text-xs ${parsedAnalyzerConfig ? 'text-neutral-500' : 'text-red-400'}`}>
                      {parsedAnalyzerConfig ? 'Valid JSON' : 'Invalid JSON'}
                    </span>
                  </div>
                  <Textarea
                    rows={6}
                    value={form.analyzer_config}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, analyzer_config: event.target.value }))
                    }
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    Optional overrides to control analyzer prompt, temperature, or post-processing for this source.
                  </p>
                </div>

                <Inline gap="sm" justify="between" className="flex-col md:flex-row md:items-center">
                  <Inline gap="sm">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      loading={saving}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Source
                    </Button>
                  </Inline>

                  <Inline gap="sm">
                    {form.origin === 'database' && form.id && !form.id.startsWith('default-') && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        loading={deleting}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Source
                      </Button>
                    )}
                  </Inline>
                </Inline>
              </div>
            </Card>
          </div>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
