'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Heart,
  Sparkles,
  Eye,
  ImageIcon,
  Settings,
  UserPlus,
  ArrowRight,
  Coins,
  CheckCircle2,
} from 'lucide-react'
import {
  Card,
  Button,
  Badge,
  Spinner,
  Container,
  Stack,
  PageHero,
} from '@/lib/design-system/components'

interface MemberSummary {
  userId: string
  role: 'admin' | 'member'
  displayName: string
  avatarUrl: string | null
  isAdmin: boolean
  isSelf: boolean
}

interface HubVision {
  id: string
  title: string | null
  perspective: 'singular' | 'plural'
  is_active: boolean
  is_draft: boolean
  completion_percent: number
  member: { displayName: string; avatarUrl: string | null } | null
}

interface HubBoardItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  status: string
  member: { displayName: string; avatarUrl: string | null } | null
}

interface HubData {
  household: {
    id: string
    name: string
    planType: 'solo' | 'household'
    isMultiMember: boolean
    isAdmin: boolean
    sharedTokensEnabled: boolean
  }
  members: MemberSummary[]
  visions: HubVision[]
  boardItems: HubBoardItem[]
  stats: {
    memberCount: number
    visionCount: number
    boardItemCount: number
    actualizedCount: number
  }
}

function Avatar({
  name,
  url,
  size = 'md',
}: {
  name: string
  url: string | null
  size?: 'sm' | 'md'
}) {
  const dims = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dims} rounded-full object-cover border border-primary-500`}
      />
    )
  }
  return (
    <div
      className={`${dims} bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center font-bold text-black`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function HouseholdHubPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<HubData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/household/hub')
        const json = await res.json()
        if (!active) return
        if (!res.ok) {
          setError(json.error || 'Failed to load your household')
          return
        }
        setData(json)
      } catch (err) {
        if (active) setError('Failed to load your household')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !data) {
    return (
      <Container size="md">
        <Card className="text-center p-8">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-neutral-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">No Household Yet</h1>
          <p className="text-neutral-300 mb-6">
            {error || "You're not currently part of a household."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="primary" onClick={() => router.push('/account/household')}>
              Household Settings
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  const { household, members, visions, boardItems, stats } = data
  const isSolo = !household.isMultiMember

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title={household.name} subtitle="The life you're choosing, together">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/account/household')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings & Billing
            </Button>
            {household.isAdmin && (
              <Button variant="primary" size="sm" onClick={() => router.push('/account/household')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite a Member
              </Button>
            )}
          </div>
        </PageHero>

        {/* Members */}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-secondary-500" />
            <h3 className="text-lg font-semibold">Members</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-full"
              >
                <Avatar name={m.displayName} url={m.avatarUrl} size="sm" />
                <span className="text-sm">{m.displayName}</span>
                {m.isAdmin && (
                  <Badge variant="primary" className="!text-xs !py-0.5">
                    Admin
                  </Badge>
                )}
                {m.isSelf && (
                  <Badge variant="secondary" className="!text-xs !py-0.5">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {isSolo && (
          <Card className="p-8 text-center border-secondary-500/40">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-secondary-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bring your partner along</h2>
            <p className="text-neutral-300 max-w-md mx-auto mb-6">
              A household lets you and a partner share visions, vision boards, and tokens —
              and build the life you choose, together.
            </p>
            <Button variant="primary" onClick={() => router.push('/account/household')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add a Household Member
            </Button>
          </Card>
        )}

        {/* Stats strip */}
        {!isSolo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={<Users className="w-5 h-5" />} label="Members" value={stats.memberCount} />
            <StatTile icon={<Sparkles className="w-5 h-5" />} label="Shared Visions" value={stats.visionCount} />
            <StatTile icon={<ImageIcon className="w-5 h-5" />} label="Shared Creations" value={stats.boardItemCount} />
            <StatTile icon={<CheckCircle2 className="w-5 h-5" />} label="Actualized" value={stats.actualizedCount} />
          </div>
        )}

        {/* Shared Life Visions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold">Shared Life Visions</h3>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/life-vision/household">
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          {visions.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No shared visions yet.{' '}
              <Link href="/life-vision/household" className="text-primary-500 hover:underline">
                Convert or merge a vision
              </Link>{' '}
              to start building a future together.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visions.map((v) => (
                <Link key={v.id} href={`/life-vision/${v.id}`}>
                  <Card variant="outlined" className="p-4 h-full hover:border-primary-500 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold truncate">{v.title || 'Untitled Vision'}</h4>
                      {v.is_active && (
                        <Badge variant="primary" className="!text-xs shrink-0">
                          Active
                        </Badge>
                      )}
                      {v.is_draft && (
                        <Badge variant="secondary" className="!text-xs shrink-0">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mb-3">{v.completion_percent}% complete</div>
                    {v.member && (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Avatar name={v.member.displayName} url={v.member.avatarUrl} size="sm" />
                        Started by {v.member.displayName}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Shared Vision Board */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-accent-500" />
              <h3 className="text-lg font-semibold">Shared Vision Board</h3>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vision-board?scope=household">
                Open Board <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          {boardItems.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No shared creations yet. On your{' '}
              <Link href="/vision-board" className="text-primary-500 hover:underline">
                vision board
              </Link>
              , turn on &ldquo;Include in household&rdquo; on any creation to share it here.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {boardItems.slice(0, 8).map((item) => (
                <Link key={item.id} href="/vision-board?scope=household">
                  <div className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 hover:border-accent-500 transition-colors">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-xs font-medium text-white truncate">{item.name}</div>
                      {item.member && (
                        <div className="text-[10px] text-neutral-300 truncate">{item.member.displayName}</div>
                      )}
                    </div>
                    {item.status === 'actualized' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-primary-500 drop-shadow" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Shared tokens note */}
        {!isSolo && household.sharedTokensEnabled && (
          <Card variant="outlined" className="p-4 flex items-center gap-3">
            <Coins className="w-5 h-5 text-energy-500 shrink-0" />
            <p className="text-sm text-neutral-300">
              Shared tokens are enabled for this household. Manage sharing in{' '}
              <Link href="/account/household" className="text-primary-500 hover:underline">
                household settings
              </Link>
              .
            </p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card variant="outlined" className="p-4">
      <div className="flex items-center gap-2 text-neutral-400 mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </Card>
  )
}
