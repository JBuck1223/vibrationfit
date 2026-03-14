'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Stack,
  PageHero,
  Card,
  Button,
  Text,
  Inline,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { TimePicker } from '@/lib/design-system/components/forms/TimePicker'
import {
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff,
  Save,
  Zap,
  Check,
  ArrowLeft,
} from 'lucide-react'
import {
  ACTIVITY_DEFINITIONS,
  getActivitiesByCategory,
  type ActivityDefinition,
} from '@/lib/map/activities'
import {
  type MapCategory,
  type CreateMapItemPayload,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  DAY_LABELS,
} from '@/lib/map/types'

const CATEGORY_COLORS: Record<MapCategory, string> = {
  activations: '#39FF14',
  connections: '#BF00FF',
  sessions: '#00FFFF',
  creations: '#FFFF00',
}

interface ActivityState {
  enabled: boolean
  days_of_week: number[]
  time_of_day: string | null
  notify_sms: boolean
}

type BuilderState = Record<string, ActivityState>

function getDefaultBuilderState(): BuilderState {
  const state: BuilderState = {}
  for (const activity of ACTIVITY_DEFINITIONS) {
    state[activity.type] = {
      enabled: false,
      days_of_week: [...activity.defaultDaysOfWeek],
      time_of_day: activity.defaultTimeOfDay,
      notify_sms: false,
    }
  }
  return state
}

export default function MapBuilderPage() {
  const router = useRouter()
  const [title, setTitle] = useState(() => {
    const now = new Date()
    const monday = new Date(now)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)
    return `Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
  })
  const [activities, setActivities] = useState<BuilderState>(getDefaultBuilderState)
  const [expandedCategories, setExpandedCategories] = useState<Set<MapCategory>>(
    new Set(['activations'])
  )
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  const enabledCount = useMemo(
    () => Object.values(activities).filter(a => a.enabled).length,
    [activities]
  )

  const toggleCategory = (cat: MapCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const updateActivity = (type: string, updates: Partial<ActivityState>) => {
    setActivities(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }))
  }

  const toggleDay = (type: string, day: number) => {
    setActivities(prev => {
      const current = prev[type].days_of_week
      const next = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort((a, b) => a - b)
      return { ...prev, [type]: { ...prev[type], days_of_week: next } }
    })
  }

  const buildPayloadItems = (): CreateMapItemPayload[] => {
    const items: CreateMapItemPayload[] = []
    let sortOrder = 0

    for (const category of CATEGORY_ORDER) {
      const categoryActivities = getActivitiesByCategory(category)
      for (const def of categoryActivities) {
        const state = activities[def.type]
        if (!state.enabled) continue
        items.push({
          category,
          activity_type: def.type,
          label: def.label,
          days_of_week: state.days_of_week,
          time_of_day: state.time_of_day,
          notify_sms: state.notify_sms,
          deep_link: def.defaultDeepLink,
          sort_order: sortOrder++,
        })
      }
    }

    return items
  }

  const handleSave = async (andActivate: boolean) => {
    const items = buildPayloadItems()
    if (items.length === 0) return

    andActivate ? setActivating(true) : setSaving(true)

    try {
      const res = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          items,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      if (andActivate) {
        const activateRes = await fetch(`/api/map/${data.map.id}/activate`, {
          method: 'POST',
        })
        if (!activateRes.ok) {
          const errData = await activateRes.json()
          throw new Error(errData.error || 'Failed to activate')
        }
      }

      router.push(`/map/${data.map.id}`)
    } catch (err) {
      console.error('Error saving map:', err)
      alert(err instanceof Error ? err.message : 'Failed to save map')
    } finally {
      setSaving(false)
      setActivating(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="MAP BUILDER"
          title="Build Your Weekly MAP"
          subtitle="Select the activations, connections, sessions, and creations you intend to practice this week. Set your schedule and turn on SMS reminders."
        />

        {/* Title input */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            MAP Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#1A1A1A] border-2 border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#39FF14] focus:outline-none transition-colors"
            placeholder="e.g. Week of March 16"
          />
        </Card>

        {/* Activity Categories */}
        {CATEGORY_ORDER.map(category => {
          const categoryActivities = getActivitiesByCategory(category)
          const expanded = expandedCategories.has(category)
          const enabledInCategory = categoryActivities.filter(
            a => activities[a.type].enabled
          ).length
          const color = CATEGORY_COLORS[category]

          return (
            <Card key={category} variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between"
              >
                <Inline gap="sm" className="items-center">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
                    {CATEGORY_LABELS[category]}
                  </Text>
                  {enabledInCategory > 0 && (
                    <Badge variant="neutral" className="text-xs" style={{ color, borderColor: color + '40' }}>
                      {enabledInCategory} selected
                    </Badge>
                  )}
                </Inline>
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                )}
              </button>

              {expanded && (
                <Stack gap="md" className="mt-6">
                  {categoryActivities.map(def => (
                    <ActivityCard
                      key={def.type}
                      definition={def}
                      state={activities[def.type]}
                      color={color}
                      onToggle={() =>
                        updateActivity(def.type, { enabled: !activities[def.type].enabled })
                      }
                      onToggleDay={day => toggleDay(def.type, day)}
                      onTimeChange={time =>
                        updateActivity(def.type, { time_of_day: time })
                      }
                      onToggleSms={() =>
                        updateActivity(def.type, {
                          notify_sms: !activities[def.type].notify_sms,
                        })
                      }
                    />
                  ))}
                </Stack>
              )}
            </Card>
          )
        })}

        {/* Preview Summary */}
        {enabledCount > 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Weekly Preview
              </Text>
              <WeekPreview activities={activities} />
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="sm:mr-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={enabledCount === 0 || saving || activating}
          >
            {saving ? <Spinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save as Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            disabled={enabledCount === 0 || saving || activating}
          >
            {activating ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Activate MAP
          </Button>
        </div>
      </Stack>
    </Container>
  )
}

// ─── Activity Card ───

interface ActivityCardProps {
  definition: ActivityDefinition
  state: ActivityState
  color: string
  onToggle: () => void
  onToggleDay: (day: number) => void
  onTimeChange: (time: string) => void
  onToggleSms: () => void
}

function ActivityCard({
  definition,
  state,
  color,
  onToggle,
  onToggleDay,
  onTimeChange,
  onToggleSms,
}: ActivityCardProps) {
  const Icon = definition.icon

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        state.enabled
          ? 'bg-neutral-900/80 border-neutral-700'
          : 'bg-neutral-900/30 border-neutral-800/50'
      }`}
    >
      <Stack gap="md">
        {/* Header with toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-start gap-3 text-left"
        >
          <div
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              state.enabled ? 'border-transparent' : 'border-neutral-600'
            }`}
            style={state.enabled ? { backgroundColor: color } : {}}
          >
            {state.enabled && <Check className="w-3 h-3 text-black" />}
          </div>
          <div className="flex-1">
            <Inline gap="sm" className="items-center">
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: state.enabled ? color : '#666' }}
              />
              <Text
                size="sm"
                className={`font-semibold ${
                  state.enabled ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {definition.label}
              </Text>
            </Inline>
            <Text size="xs" className="text-neutral-500 mt-1">
              {definition.description}
            </Text>
          </div>
        </button>

        {/* Expanded options when enabled */}
        {state.enabled && (
          <div className="pl-8 space-y-4">
            {/* Day pills */}
            <div>
              <Text size="xs" className="text-neutral-500 mb-2">
                Days
              </Text>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => onToggleDay(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      state.days_of_week.includes(idx)
                        ? 'text-black'
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                    }`}
                    style={
                      state.days_of_week.includes(idx)
                        ? { backgroundColor: color }
                        : {}
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time picker + SMS toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 min-w-[140px]">
                <TimePicker
                  label="Time"
                  value={state.time_of_day || undefined}
                  onChange={onTimeChange}
                  step={15}
                  size="sm"
                />
              </div>
              <button
                onClick={onToggleSms}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  state.notify_sms
                    ? 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                }`}
              >
                {state.notify_sms ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : (
                  <BellOff className="w-3.5 h-3.5" />
                )}
                {state.notify_sms ? 'SMS On' : 'SMS Off'}
              </button>
            </div>
          </div>
        )}
      </Stack>
    </div>
  )
}

// ─── Week Preview Grid ───

function WeekPreview({ activities }: { activities: BuilderState }) {
  const dayActivities = useMemo(() => {
    const result: Record<number, Array<{ label: string; time: string | null; color: string }>> = {}
    for (let d = 0; d < 7; d++) result[d] = []

    for (const def of ACTIVITY_DEFINITIONS) {
      const state = activities[def.type]
      if (!state.enabled) continue

      const color = CATEGORY_COLORS[def.category]
      for (const day of state.days_of_week) {
        result[day].push({
          label: def.label,
          time: state.time_of_day,
          color,
        })
      }
    }

    // Sort each day by time
    for (const d of Object.keys(result)) {
      result[Number(d)].sort((a, b) => {
        if (!a.time) return 1
        if (!b.time) return -1
        return a.time.localeCompare(b.time)
      })
    }

    return result
  }, [activities])

  const formatTime = (t: string | null) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'p' : 'a'
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${dh}:${String(m).padStart(2, '0')}${period}`
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {DAY_LABELS.map((label, idx) => (
        <div key={idx} className="min-w-0">
          <Text
            size="xs"
            className="text-neutral-500 text-center font-semibold mb-2"
          >
            {label}
          </Text>
          <div className="space-y-1">
            {dayActivities[idx].length === 0 ? (
              <div className="h-6 rounded bg-neutral-900/30" />
            ) : (
              dayActivities[idx].map((item, i) => (
                <div
                  key={i}
                  className="rounded px-1 py-0.5 text-center truncate"
                  style={{
                    backgroundColor: item.color + '15',
                    borderLeft: `2px solid ${item.color}`,
                  }}
                  title={`${item.label}${item.time ? ` at ${formatTime(item.time)}` : ''}`}
                >
                  <span
                    className="text-[9px] leading-tight block truncate"
                    style={{ color: item.color }}
                  >
                    {formatTime(item.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
