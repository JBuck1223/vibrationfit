'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Sparkles,
  Image as ImageIcon,
  TrendingUp,
  Headphones,
  FolderKanban,
  BookOpen,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { Container, Stack, Card, Button, Spinner } from '@/lib/design-system/components'

interface HubMember {
  userId: string
  firstName: string | null
  displayName: string
  avatarUrl: string | null
  isSelf: boolean
  isAdmin: boolean
}

interface HubItem {
  id: string
  title: string
  sublabel: string | null
  ownerId: string
  createdAt: string
  href: string
}

interface HubFeature {
  count: number
  items: HubItem[]
}

type FeatureKey = 'life_visions' | 'vision_board' | 'abundance' | 'audio' | 'projects' | 'stories'

interface HubData {
  household: {
    householdId: string
    householdName: string
    isMultiMember: boolean
    members: HubMember[]
  } | null
  features: Record<FeatureKey, HubFeature> | null
}

const FEATURE_META: {
  key: FeatureKey
  label: string
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  href: string
}[] = [
  { key: 'life_visions', label: 'Life Visions', color: '#39FF14', icon: Sparkles, href: '/life-vision' },
  { key: 'vision_board', label: 'Vision Board', color: '#BF00FF', icon: ImageIcon, href: '/vision-board' },
  { key: 'abundance', label: 'Abundance Tracker', color: '#FFFF00', icon: TrendingUp, href: '/abundance-tracker' },
  { key: 'audio', label: 'Audios', color: '#00FFFF', icon: Headphones, href: '/audio' },
  { key: 'projects', label: 'Projects', color: '#FF6600', icon: FolderKanban, href: '/projects' },
  { key: 'stories', label: 'Stories', color: '#FF0080', icon: BookOpen, href: '/story' },
]

export default function HouseholdHubPage() {
  const router = useRouter()
  const [data, setData] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/household/hub')
        if (!res.ok) {
          if (active) router.replace('/account/household')
          return
        }
        const json: HubData = await res.json()
        if (!active) return
        // Solo users (or no household) land in household settings instead.
        if (!json.household?.isMultiMember || !json.features) {
          router.replace('/account/household')
          return
        }
        setData(json)
      } catch {
        if (active) router.replace('/account/household')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [router])

  if (loading || !data?.household || !data.features) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const { household, features } = data
  const memberName = (userId: string) => {
    const m = household.members.find(mm => mm.userId === userId)
    if (!m) return null
    if (m.isSelf) return 'You'
    return m.firstName || m.displayName
  }

  return (
    <Container size="xl" className="pt-8 pb-12">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#00FFFF]/15 flex items-center justify-center">
            <Home className="w-7 h-7 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{household.householdName}</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Everything your household is sharing, in one place.
            </p>
          </div>

          {/* Members */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {household.members.map(m => (
              <div
                key={m.userId}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] pl-1.5 pr-3 py-1.5"
              >
                {m.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-300">
                    {(m.firstName || m.displayName).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-neutral-200">
                  {m.isSelf ? 'You' : m.firstName || m.displayName}
                </span>
                {m.isAdmin && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#00FFFF]">Admin</span>
                )}
              </div>
            ))}
          </div>

          <Button asChild variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
            <Link href="/account/household">
              <Settings className="w-4 h-4 mr-1.5" />
              Sharing Settings
            </Link>
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURE_META.map(meta => {
            const feature = features[meta.key]
            const FeatureIcon = meta.icon
            return (
              <Card key={meta.key} variant="outlined" className="!p-0 overflow-hidden">
                <div className="h-0.5" style={{ backgroundColor: meta.color }} />
                <div className="p-5">
                  <Link
                    href={meta.href}
                    className="flex items-center gap-3 group mb-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${meta.color}1A` }}
                    >
                      <FeatureIcon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{meta.label}</p>
                      <p className="text-xs text-neutral-500">
                        {feature.count === 0
                          ? 'Nothing shared yet'
                          : `${feature.count} shared item${feature.count === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
                  </Link>

                  {feature.items.length > 0 && (
                    <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
                      {feature.items.map(item => {
                        const creator = memberName(item.ownerId)
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-neutral-200 truncate">{item.title}</p>
                              {item.sublabel && (
                                <p className="text-[11px] text-neutral-500 truncate">{item.sublabel}</p>
                              )}
                            </div>
                            {creator && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  creator === 'You'
                                    ? 'text-neutral-400 bg-neutral-800'
                                    : 'text-[#00FFFF] bg-[#00FFFF]/10'
                                }`}
                              >
                                {creator}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
