'use client'

// Per-feature household sharing controls.
//
// Each feature can be set to "Share all" (everything the member creates is
// visible to the household, evaluated at query time) or "Select items"
// (only content they explicitly share). Backed by
// /api/household/sharing-settings and the household_sharing_settings table.

import { useEffect, useState } from 'react'
import {
  Sparkles,
  ImageIcon,
  TrendingUp,
  Headphones,
  FolderKanban,
  BookOpen,
  Users,
} from 'lucide-react'
import { Card, Spinner, Toggle } from '@/lib/design-system/components'

const glassCard = 'border border-white/[0.06] p-4 shadow-none sm:p-5'

type ShareMode = 'all' | 'select'

interface SharingSettings {
  life_visions_mode: ShareMode
  vision_board_mode: ShareMode
  abundance_mode: ShareMode
  audio_mode: ShareMode
  projects_mode: ShareMode
  stories_mode: ShareMode
  default_view: 'me' | 'both'
}

const FEATURES: {
  key: keyof SharingSettings
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    key: 'life_visions_mode',
    label: 'Life Visions',
    description: 'Your committed vision versions (drafts always stay private)',
    icon: Sparkles,
  },
  {
    key: 'vision_board_mode',
    label: 'Vision Board',
    description: 'Your vision board creations',
    icon: ImageIcon,
  },
  {
    key: 'abundance_mode',
    label: 'Abundance Tracker',
    description: 'Abundance events and goals',
    icon: TrendingUp,
  },
  {
    key: 'audio_mode',
    label: 'Audios',
    description: 'Generated audio sets (members can listen)',
    icon: Headphones,
  },
  {
    key: 'projects_mode',
    label: 'Projects',
    description: 'Projects, tasks, and comments',
    icon: FolderKanban,
  },
  {
    key: 'stories_mode',
    label: 'Stories',
    description: 'Written and recorded stories',
    icon: BookOpen,
  },
]

export function HouseholdSharingSettingsCard() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SharingSettings | null>(null)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/household/sharing-settings')
        const json = await res.json()
        if (!active) return
        if (res.ok) {
          setSettings(json.settings)
        } else {
          setError(json.error || 'Failed to load sharing settings')
        }
      } catch {
        if (active) setError('Failed to load sharing settings')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function updateSetting(key: keyof SharingSettings, value: string) {
    if (!settings) return
    const previous = settings[key]
    setSettings({ ...settings, [key]: value } as SharingSettings)
    setSavingKey(key)
    setError('')
    try {
      const res = await fetch('/api/household/sharing-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) {
        setSettings((s) => (s ? ({ ...s, [key]: previous } as SharingSettings) : s))
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Failed to save')
      }
    } catch {
      setSettings((s) => (s ? ({ ...s, [key]: previous } as SharingSettings) : s))
      setError('Failed to save')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <Card variant="glass" className={`${glassCard} flex min-h-[8rem] items-center justify-center`}>
        <Spinner size="md" />
      </Card>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <Card variant="glass" className={glassCard}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-500/15">
          <Users className="h-4.5 w-4.5 text-secondary-500" aria-hidden />
        </div>
        <h3 className="text-base font-semibold text-white">Sharing</h3>
      </div>
      <p className="mb-5 text-xs leading-relaxed text-neutral-500">
        Choose what your household can see. &ldquo;Share all&rdquo; makes everything you create in a
        feature visible to your household. &ldquo;Select items&rdquo; keeps things private until you
        share them one at a time.
      </p>

      <div className="space-y-2">
        {FEATURES.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <div
              key={feature.key}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FeatureIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{feature.label}</div>
                  <div className="text-[11px] text-neutral-500">{feature.description}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {savingKey === feature.key && <Spinner size="sm" />}
                <Toggle
                  variant="segmented"
                  size="sm"
                  options={[
                    { value: 'select', label: 'Select items' },
                    { value: 'all', label: 'Share all' },
                  ]}
                  value={settings[feature.key] as string}
                  onChange={(value) => void updateSetting(feature.key, value)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">Default view</div>
          <div className="text-[11px] text-neutral-500">
            What you see first when opening shared features
          </div>
        </div>
        <Toggle
          variant="segmented"
          size="sm"
          options={[
            { value: 'me', label: 'Just me' },
            { value: 'both', label: 'Household' },
          ]}
          value={settings.default_view}
          onChange={(value) => void updateSetting('default_view', value)}
        />
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </Card>
  )
}
