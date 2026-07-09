'use client'

// One-time household sharing setup, styled after the MAP system builder:
// selectable feature rows, then one activate action that saves every mode
// and stamps setup_completed_at. Also reusable from account settings.
//
// Selecting a feature = "Share all" (everything you create is visible to the
// household). Leaving it unselected = "Select items" (you share one item at
// a time from inside the feature).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  Sparkles,
  ImageIcon,
  TrendingUp,
  Headphones,
  FolderKanban,
  BookOpen,
  Eye,
} from 'lucide-react'
import { Button, Spinner, Stack, Toggle } from '@/lib/design-system/components'

type ShareMode = 'all' | 'select'

type FeatureKey =
  | 'life_visions_mode'
  | 'vision_board_mode'
  | 'abundance_mode'
  | 'audio_mode'
  | 'projects_mode'
  | 'stories_mode'

const FEATURES: {
  key: FeatureKey
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}[] = [
  {
    key: 'life_visions_mode',
    label: 'Life Visions',
    description: 'Your committed vision versions. Drafts always stay private.',
    color: '#39FF14',
    icon: Sparkles,
  },
  {
    key: 'vision_board_mode',
    label: 'Vision Board',
    description: 'Your vision board creations and actualizations.',
    color: '#BF00FF',
    icon: ImageIcon,
  },
  {
    key: 'abundance_mode',
    label: 'Abundance Tracker',
    description: 'Abundance events and goals, combined in household reports.',
    color: '#FFFF00',
    icon: TrendingUp,
  },
  {
    key: 'audio_mode',
    label: 'Audios',
    description: 'Generated audio sets your household can listen to.',
    color: '#00FFFF',
    icon: Headphones,
  },
  {
    key: 'projects_mode',
    label: 'Projects',
    description: 'Projects, tasks, and comments you work on together.',
    color: '#FF6600',
    icon: FolderKanban,
  },
  {
    key: 'stories_mode',
    label: 'Stories',
    description: 'Written and recorded stories, with their audio.',
    color: '#FF0080',
    icon: BookOpen,
  },
]

const DEFAULT_MODES: Record<FeatureKey, ShareMode> = {
  life_visions_mode: 'select',
  vision_board_mode: 'select',
  abundance_mode: 'select',
  audio_mode: 'select',
  projects_mode: 'select',
  stories_mode: 'select',
}

export function HouseholdSharingBuilder({
  redirectTo = '/account/household',
  onComplete,
  showHeader = true,
  householdName,
}: {
  redirectTo?: string
  onComplete?: () => void | Promise<void>
  showHeader?: boolean
  householdName?: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [modes, setModes] = useState<Record<FeatureKey, ShareMode>>(DEFAULT_MODES)
  const [defaultView, setDefaultView] = useState<'me' | 'both'>('me')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/household/sharing-settings')
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.settings) {
          const next = { ...DEFAULT_MODES }
          for (const feature of FEATURES) {
            if (json.settings[feature.key] === 'all') next[feature.key] = 'all'
          }
          setModes(next)
          if (json.settings.default_view === 'both') setDefaultView('both')
        }
      } catch {
        // Fall back to defaults; save still works.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggleFeature = (key: FeatureKey) => {
    setModes((prev) => ({
      ...prev,
      [key]: prev[key] === 'all' ? 'select' : 'all',
    }))
  }

  const sharedCount = FEATURES.filter((f) => modes[f.key] === 'all').length

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/household/sharing-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modes,
          default_view: defaultView,
          setup_completed: true,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to save sharing settings')
      }
      if (onComplete) {
        await onComplete()
      } else if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack gap="lg">
      {showHeader && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            {householdName ? `Sharing in ${householdName}` : 'Set Up Household Sharing'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-lg mx-auto">
            Choose what your household sees automatically. Select a feature to share everything you
            create in it — or leave it off and share individual items whenever you choose. You can
            change any of this later in account settings.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[24vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature) => {
              const isShared = modes[feature.key] === 'all'
              const FeatureIcon = feature.icon
              return (
                <div
                  key={feature.key}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: isShared ? `${feature.color}30` : '#1A1A1A',
                    backgroundColor: '#0A0A0A',
                  }}
                >
                  <div
                    className="h-0.5"
                    style={{ backgroundColor: isShared ? feature.color : `${feature.color}30` }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                      isShared ? 'bg-neutral-800/40' : 'hover:bg-neutral-900'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${
                        isShared ? 'border-transparent' : 'border-neutral-600'
                      }`}
                      style={isShared ? { backgroundColor: feature.color } : undefined}
                    >
                      {isShared && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <FeatureIcon className="w-4 h-4 shrink-0" style={{ color: feature.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{feature.label}</p>
                      <p className="text-xs text-neutral-600 leading-relaxed">{feature.description}</p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: isShared ? feature.color : '#525252' }}
                    >
                      {isShared ? 'Share all' : 'Select items'}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          <div className="border-t border-neutral-800 pt-6">
            <div className="rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-semibold text-white">Default view</span>
              </div>
              <p className="text-xs text-neutral-600 mb-3 leading-relaxed max-w-md mx-auto">
                What you see first when opening shared features. You can switch anytime with the
                Me / Both toggle.
              </p>
              <div className="flex justify-center">
                <Toggle
                  variant="segmented"
                  size="sm"
                  options={[
                    { value: 'me', label: 'Just me' },
                    { value: 'both', label: 'Household' },
                  ]}
                  value={defaultView}
                  onChange={(value) => setDefaultView(value as 'me' | 'both')}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="text-center pb-4">
            <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : sharedCount > 0 ? (
                <>Activate Sharing ({sharedCount})</>
              ) : (
                <>Continue with Select Items Only</>
              )}
            </Button>
            <p className="text-xs text-neutral-600 mt-2">
              Nothing you have marked private is ever shared without you.
            </p>
          </div>
        </>
      )}
    </Stack>
  )
}
