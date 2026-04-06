'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import {
  Filter,
  Plus,
  Trash2,
  Users,
  UserPlus,
  Save,
  Eye,
  ShieldOff,
  Layers,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Audience, BlastFilters } from '@/lib/crm/blast-filters'
import {
  getFilterOptions,
  getValueOptions,
  isDateField,
  isNumberField,
  isBooleanField,
  isDynamicSelectField,
  formatFilterValue,
  type FilterField,
} from '@/lib/crm/blast-constants'

interface Segment {
  id: string
  name: string
  description: string | null
  filters: BlastFilters
  exclude_segment_id: string | null
  recipient_count: number | null
}

interface FilterRow {
  id: string
  field: FilterField
  value: string
}

interface Props {
  segment?: Segment
  mode: 'create' | 'edit'
}

const selectClass =
  'w-full px-4 py-3 text-sm bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14] transition-all duration-200'
const inputClass =
  'w-full px-4 py-3 text-sm bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200'
const btnPrimary =
  'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none'
const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

const FILTER_TO_KEY: Record<FilterField, keyof BlastFilters> = {
  engagement_status: 'engagement_status',
  health_status: 'health_status',
  subscription_tier: 'subscription_tier',
  subscription_status: 'subscription_status',
  intensive_status: 'intensive_status',
  days_since_last_login_gt: 'days_since_last_login_gt',
  days_since_last_login_lt: 'days_since_last_login_lt',
  has_phone: 'has_phone',
  sms_opt_in: 'sms_opt_in',
  email_opt_in: 'email_opt_in',
  has_vision: 'has_vision',
  has_journal_entry: 'has_journal_entry',
  profile_completion_gte: 'profile_completion_gte',
  lead_status: 'lead_status',
  lead_type: 'lead_type',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  created_after: 'created_after',
  created_before: 'created_before',
}

interface SmartPreset {
  label: string
  filters: Partial<BlastFilters>
  audience: Audience
}

const SMART_PRESETS: SmartPreset[] = [
  {
    label: 'Intensive Graduates',
    audience: 'members',
    filters: { intensive_status: 'unlocked' },
  },
  {
    label: 'Active Subscribers',
    audience: 'members',
    filters: { subscription_status: 'active' },
  },
  {
    label: 'SMS Reachable',
    audience: 'members',
    filters: { has_phone: 'yes', sms_opt_in: 'yes' },
  },
  {
    label: 'Needs Re-engagement',
    audience: 'members',
    filters: { engagement_status: 'at_risk', days_since_last_login_gt: 30 },
  },
]

function filtersToRows(filters: BlastFilters): FilterRow[] {
  const rows: FilterRow[] = []
  for (const [field, key] of Object.entries(FILTER_TO_KEY)) {
    const val = filters[key as keyof BlastFilters]
    if (val !== undefined && val !== null && val !== '') {
      rows.push({ id: crypto.randomUUID(), field: field as FilterField, value: String(val) })
    }
  }
  return rows
}

export default function SegmentBuilderForm({ segment, mode }: Props) {
  const router = useRouter()
  const [name, setName] = useState(segment?.name || '')
  const [description, setDescription] = useState(segment?.description || '')
  const [audience, setAudience] = useState<Audience>(segment?.filters?.audience || 'members')
  const [filterRows, setFilterRows] = useState<FilterRow[]>(
    segment?.filters ? filtersToRows(segment.filters) : []
  )
  const [excludeLeads, setExcludeLeads] = useState(segment?.filters?.exclude_leads ?? false)
  const [excludeSegmentId, setExcludeSegmentId] = useState(segment?.exclude_segment_id || '')
  const [allSegments, setAllSegments] = useState<{ id: string; name: string }[]>([])
  const [tierNames, setTierNames] = useState<string[]>([])
  const [previewCount, setPreviewCount] = useState<number | null>(segment?.recipient_count ?? null)
  const [suppressedCount, setSuppressedCount] = useState(0)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewRecipients, setPreviewRecipients] = useState<{ email: string; name: string; type: string }[]>([])
  const [showRecipients, setShowRecipients] = useState(false)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchSegments()
    fetchTierNames()
  }, [])

  useEffect(() => {
    setPreviewCount(null)
    setSuppressedCount(0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runPreview(), 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, filterRows, excludeLeads, excludeSegmentId])

  async function fetchSegments() {
    try {
      const res = await fetch('/api/crm/segments')
      if (!res.ok) return
      const data = await res.json()
      setAllSegments(
        (data.segments || [])
          .filter((s: { id: string }) => s.id !== segment?.id)
          .map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
      )
    } catch { /* ignore */ }
  }

  async function fetchTierNames() {
    try {
      const res = await fetch('/api/crm/tier-names')
      if (!res.ok) return
      const data = await res.json()
      setTierNames(data.tiers || [])
    } catch { /* ignore */ }
  }

  function buildFilters(): BlastFilters {
    const f: BlastFilters = { audience, exclude_leads: excludeLeads || undefined }
    for (const row of filterRows) {
      if (!row.value) continue
      const key = FILTER_TO_KEY[row.field]
      if (isNumberField(row.field)) {
        ;(f as unknown as Record<string, unknown>)[key] = parseInt(row.value)
      } else {
        ;(f as unknown as Record<string, unknown>)[key] = row.value
      }
    }
    return f
  }

  async function runPreview() {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/crm/blast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: buildFilters(),
          excludeSegmentId: excludeSegmentId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Preview failed')
      const data = await res.json()
      setPreviewCount(data.count)
      setSuppressedCount(data.suppressedCount || 0)
      setPreviewRecipients(data.recipients || [])
    } catch {
      setPreviewCount(null)
      setSuppressedCount(0)
      setPreviewRecipients([])
    } finally {
      setLoadingPreview(false)
    }
  }

  function addFilter() {
    const opts = getFilterOptions(audience)
    const usedFields = new Set(filterRows.map((r) => r.field))
    const next = opts.find((o) => !usedFields.has(o.value))
    if (!next) {
      toast.error('All available filters are already added')
      return
    }
    setFilterRows([...filterRows, { id: crypto.randomUUID(), field: next.value, value: '' }])
  }

  function removeFilter(id: string) {
    setFilterRows(filterRows.filter((r) => r.id !== id))
  }

  function updateFilter(id: string, key: 'field' | 'value', val: string) {
    setFilterRows(
      filterRows.map((r) =>
        r.id === id
          ? { ...r, [key]: val, ...(key === 'field' ? { value: '' } : {}) }
          : r
      )
    )
  }

  function applyPreset(preset: SmartPreset) {
    setAudience(preset.audience)
    const rows: FilterRow[] = []
    for (const [field, key] of Object.entries(FILTER_TO_KEY)) {
      const val = preset.filters[key as keyof BlastFilters]
      if (val !== undefined && val !== null && val !== '') {
        rows.push({ id: crypto.randomUUID(), field: field as FilterField, value: String(val) })
      }
    }
    setFilterRows(rows)
    toast.success(`Applied "${preset.label}" preset`)
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Segment name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        filters: buildFilters(),
        excludeSegmentId: excludeSegmentId || null,
      }

      const url = mode === 'edit' ? `/api/crm/segments/${segment!.id}` : '/api/crm/segments'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      toast.success(mode === 'edit' ? 'Segment updated' : 'Segment created')
      router.push('/admin/crm/segments')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save segment'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function renderValueInput(row: FilterRow) {
    const valueOptions = getValueOptions(row.field)

    if (isBooleanField(row.field)) {
      return (
        <div className="flex gap-2 flex-1">
          {['yes', 'no'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => updateFilter(row.id, 'value', v)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-full border-2 transition-all duration-200 ${
                row.value === v
                  ? v === 'yes'
                    ? 'bg-[#39FF14] text-black border-transparent'
                    : 'bg-[#FF0040] text-white border-transparent'
                  : 'bg-transparent border-[#555] text-neutral-400 hover:border-[#39FF14] hover:text-white'
              }`}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )
    }

    if (isDynamicSelectField(row.field)) {
      return (
        <select
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={selectClass + ' flex-1'}
        >
          <option value="">Select...</option>
          {tierNames.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )
    }

    if (valueOptions) {
      return (
        <select
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={selectClass + ' flex-1'}
        >
          <option value="">Select...</option>
          {valueOptions.map((v) => (
            <option key={v} value={v}>{formatFilterValue(v)}</option>
          ))}
        </select>
      )
    }

    if (isDateField(row.field)) {
      return (
        <input
          type="date"
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          className={inputClass + ' flex-1'}
        />
      )
    }

    if (isNumberField(row.field)) {
      return (
        <input
          type="number"
          value={row.value}
          onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
          placeholder={row.field === 'profile_completion_gte' ? 'e.g. 50' : 'e.g. 30'}
          min={0}
          max={row.field === 'profile_completion_gte' ? 100 : undefined}
          className={inputClass + ' flex-1'}
        />
      )
    }

    return (
      <input
        type="text"
        value={row.value}
        onChange={(e) => updateFilter(row.id, 'value', e.target.value)}
        placeholder="Enter value..."
        className={inputClass + ' flex-1'}
      />
    )
  }

  return (
    <Stack gap="lg">
      {/* Name & Description */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-[#39FF14]" />
          <h2 className="text-lg font-semibold text-white">Segment Details</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Active members, Intensive graduates..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this segment"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {/* Smart Presets */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#FFFF00]" />
          <h2 className="text-lg font-semibold text-white">Quick Presets</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          One-click presets for common segments. Applying a preset replaces current filters.
        </p>
        <div className="flex flex-wrap gap-2">
          {SMART_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-4 py-2 text-sm font-medium rounded-full border-2 border-[#333] text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-all duration-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Audience */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-[#39FF14]" />
          <h2 className="text-lg font-semibold text-white">Audience & Filters</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-neutral-400 mb-2">Base Audience</label>
          <div className="flex gap-2">
            {([
              { value: 'members' as Audience, label: 'Members', icon: Users },
              { value: 'leads' as Audience, label: 'Leads', icon: UserPlus },
              { value: 'both' as Audience, label: 'Both', icon: Users },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAudience(value)
                  setFilterRows([])
                }}
                className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full border-2 transition-all duration-300 ${
                  audience === value
                    ? 'bg-[#39FF14] text-black border-transparent'
                    : 'bg-transparent border-[#333] text-neutral-400 hover:border-[#39FF14] hover:text-[#39FF14]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter rows */}
        <div className="space-y-3">
          {filterRows.map((row) => {
            const options = getFilterOptions(audience)

            return (
              <div key={row.id} className="flex items-center gap-3">
                <select
                  value={row.field}
                  onChange={(e) => updateFilter(row.id, 'field', e.target.value)}
                  className={selectClass + ' max-w-[240px]'}
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {renderValueInput(row)}

                <button
                  type="button"
                  onClick={() => removeFilter(row.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        <button type="button" onClick={addFilter} className={`${btnGhost} mt-4`}>
          <Plus className="w-4 h-4" />
          Add Filter
        </button>
      </Card>

      {/* Exclusions */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldOff className="w-5 h-5 text-[#FF0040]" />
          <h2 className="text-lg font-semibold text-white">Exclusions</h2>
        </div>

        <div className="space-y-4">
          {(audience === 'members' || audience === 'both') && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeLeads}
                onChange={(e) => setExcludeLeads(e.target.checked)}
                className="w-4 h-4 rounded border-[#666] bg-[#404040] text-[#39FF14] focus:ring-[#39FF14]"
              />
              <span className="text-sm text-neutral-300">
                Exclude emails also found in leads
              </span>
            </label>
          )}

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Exclude another segment</label>
            <select
              value={excludeSegmentId}
              onChange={(e) => setExcludeSegmentId(e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {allSegments.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#00FFFF]" />
            <h2 className="text-lg font-semibold text-white">Preview</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => runPreview()}
              disabled={loadingPreview}
              className={btnGhost}
            >
              {loadingPreview ? <Spinner size="sm" /> : <Eye className="w-4 h-4" />}
              Refresh
            </button>
            {previewCount !== null && (
              <>
                <Badge variant="primary">
                  {previewCount.toLocaleString()} recipient{previewCount !== 1 ? 's' : ''}
                </Badge>
                {suppressedCount > 0 && (
                  <Badge variant="danger">
                    {suppressedCount} suppressed
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {previewCount !== null && previewCount > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowRecipients(!showRecipients)}
              className="text-sm text-[#00FFFF] hover:text-white transition-colors"
            >
              {showRecipients ? 'Hide' : 'Show'} recipient list
            </button>

            {showRecipients && previewRecipients.length > 0 && (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333] sticky top-0 bg-[#1a1a1a]">
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRecipients.map((r) => (
                      <tr key={r.email} className="border-b border-[#222]">
                        <td className="py-2 px-3 text-neutral-300">{r.name}</td>
                        <td className="py-2 px-3 text-neutral-500 font-mono text-xs">{r.email}</td>
                      </tr>
                    ))}
                    {previewCount > previewRecipients.length && (
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-neutral-600 text-xs text-center">
                          + {previewCount - previewRecipients.length} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className={btnPrimary}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : mode === 'edit' ? 'Update Segment' : 'Save Segment'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/crm/segments')}
          className={btnGhost}
        >
          Cancel
        </button>
      </div>
    </Stack>
  )
}
