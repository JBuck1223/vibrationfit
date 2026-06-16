'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Heart,
  Sparkles,
  ImageIcon,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import {
  Card,
  Badge,
  Spinner,
  Container,
  Stack,
} from '@/lib/design-system/components'
import { AccountHouseholdSettings } from '@/components/account-studio'

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
  members: { userId: string; displayName: string; avatarUrl: string | null }[]
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
}: {
  name: string
  url: string | null
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-7 h-7 rounded-full object-cover border border-primary-500 text-xs"
      />
    )
  }
  return (
    <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center font-bold text-black text-xs">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const glassCard = 'border border-white/[0.06] p-4 shadow-none sm:p-5'

export default function AccountHouseholdPage() {
  const [hubLoading, setHubLoading] = useState(true)
  const [hubData, setHubData] = useState<HubData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/household/hub')
        const json = await res.json()
        if (!active) return
        if (res.ok) setHubData(json)
      } catch {
        // Hub data is optional — settings will still render below
      } finally {
        if (active) setHubLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const isSolo = hubData ? !hubData.household.isMultiMember : true

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <h1 className="sr-only">Household</h1>
      <Stack gap="md">
        <AccountHouseholdSettings />

        {hubLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : hubData && !isSolo ? (
          <>
            {/* Shared Life Visions */}
            <Card variant="glass" className={glassCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/15">
                    <Sparkles className="h-4.5 w-4.5 text-primary-500" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-white">Shared Life Visions</h3>
                </div>
                <Link
                  href="/life-vision/household"
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-primary-500"
                >
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {hubData.visions.length === 0 ? (
                <p className="text-sm leading-relaxed text-neutral-400">
                  No shared visions yet.{' '}
                  <Link href="/life-vision/household" className="text-primary-500 hover:underline">
                    Convert or merge a vision
                  </Link>{' '}
                  to start building a future together.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hubData.visions.map((v) => (
                    <Link key={v.id} href={`/life-vision/${v.id}`}>
                      <Card variant="outlined" className="p-4 h-full hover:border-primary-500/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white truncate">{v.title || 'Untitled Vision'}</h4>
                          {v.is_active && (
                            <Badge variant="primary" className="!text-[10px] !py-0.5 shrink-0">Active</Badge>
                          )}
                          {v.is_draft && (
                            <Badge variant="secondary" className="!text-[10px] !py-0.5 shrink-0">Draft</Badge>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 mb-3">{v.completion_percent}% complete</div>
                        {v.member && (
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Avatar name={v.member.displayName} url={v.member.avatarUrl} />
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
            <Card variant="glass" className={glassCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500/15">
                    <ImageIcon className="h-4.5 w-4.5 text-accent-500" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-white">Shared Vision Board</h3>
                </div>
                <Link
                  href="/vision-board?scope=household"
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-accent-500"
                >
                  Open Board <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {hubData.boardItems.length === 0 ? (
                <p className="text-sm leading-relaxed text-neutral-400">
                  No shared creations yet. On your{' '}
                  <Link href="/vision-board" className="text-primary-500 hover:underline">
                    vision board
                  </Link>
                  , turn on &ldquo;Include in household&rdquo; on any creation to share it here.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {hubData.boardItems.slice(0, 8).map((item) => (
                    <Link key={item.id} href="/vision-board?scope=household">
                      <div className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800 border border-white/[0.06] hover:border-accent-500/40 transition-colors">
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
          </>
        ) : hubData && isSolo ? (
          <Card variant="glass" className="border border-white/[0.06] p-8 text-center shadow-none">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-secondary-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bring your partner along</h2>
            <p className="text-neutral-300 max-w-md mx-auto">
              A household lets you and a partner share visions, vision boards, and tokens —
              and build the life you choose, together.
            </p>
          </Card>
        ) : null}
      </Stack>
    </Container>
  )
}
