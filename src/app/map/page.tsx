'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import Link from 'next/link'
import {
  Container,
  Stack,
  PageHero,
  Card,
  Button,
  Spinner,
  Inline,
  Text,
  Badge,
  IntensiveCompletionBanner,
  IntensiveStepCompleteModal
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import {
  Sun,
  Moon,
  Zap,
  ArrowRight,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  FileText,
  Target,
  Headphones,
  CheckCircle,
  Circle,
  User,
  ClipboardCheck,
  Mic,
  Layers,
  Unlock,
  Video,
  UsersRound,
  Award,
  Info,
  Plus,
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff,
  ExternalLink,
  Map as MapIcon,
} from 'lucide-react'
import { BadgeDetailModal } from '@/components/badges'
import {
  BADGE_DEFINITIONS,
  type BadgeType,
  type BadgeWithProgress as BadgeWithProgressType,
} from '@/lib/badges/types'
import type { UserMap, UserMapItem, MapCategory } from '@/lib/map/types'
import { DAY_LABELS, CATEGORY_LABELS, CATEGORY_ORDER, getMapDisplayStatus } from '@/lib/map/types'
import { getActivityDefinition } from '@/lib/map/activities'

const MAP_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/13-map-1080p.mp4'
const MAP_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/13-map-thumb.0000000.jpg'

const CATEGORY_COLORS: Record<MapCategory, string> = {
  activations: '#39FF14',
  connections: '#BF00FF',
  sessions: '#00FFFF',
  creations: '#FFFF00',
}

const MILESTONES: Array<{
  day: number
  label: string
  message: string
  badgeType: BadgeType
}> = [
  {
    day: 3,
    label: '3-Day Activated',
    message: "You've shown up 3 days. You're officially someone who shows up for The Life I Choose.",
    badgeType: 'activated_3d',
  },
  {
    day: 7,
    label: '7-Day Activated',
    message: "7 days of practice. Consistency is now part of your story.",
    badgeType: 'activated_7d',
  },
  {
    day: 14,
    label: '14-Day Activated',
    message: "14 days of showing up. Returning to alignment is what you do.",
    badgeType: 'activated_14d',
  },
  {
    day: 21,
    label: '21-Day Activated',
    message: "21 days of activation. Old patterns are losing their grip.",
    badgeType: 'activated_21d',
  },
  {
    day: 28,
    label: '28-Day Activated',
    message: "28 days activated. You have proof: you are a conscious creator in action.",
    badgeType: 'activated_28d',
  },
]

function makeBadgeStub(badgeType: BadgeType): BadgeWithProgressType {
  const definition = BADGE_DEFINITIONS[badgeType]
  return {
    definition,
    earned: false,
    progress: {
      current: 0,
      target: definition.activationDays || definition.threshold || 1,
      percentage: 0,
    },
  }
}

function formatTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}

export default function MAPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [selectedMilestoneBadge, setSelectedMilestoneBadge] = useState<BadgeWithProgressType | null>(null)
  const [completing, setCompleting] = useState(false)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Intensive flow states
  const [isIntensiveFlow, setIsIntensiveFlow] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  // MAP data
  const [maps, setMaps] = useState<UserMap[]>([])
  const [activeMap, setActiveMap] = useState<UserMap | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const fromIntensive = searchParams.get('intensive') === 'true'
      const intensiveData = await getActiveIntensiveClient()

      let isInIntensive = false
      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        if (!intensiveData.unlock_completed || fromIntensive) {
          setIsIntensiveFlow(true)
          setShowGuide(true)
          isInIntensive = true
        }
        if (intensiveData.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(intensiveData.activation_protocol_completed_at || intensiveData.created_at)
        }
      }

      const { data: visionData } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (visionData) {
        setActiveVisionId(visionData.id)
      }

      // Only fetch MAPs after intensive graduation
      if (!isInIntensive) {
        try {
          const mapsRes = await fetch('/api/map')
          if (mapsRes.ok) {
            const mapsData = await mapsRes.json()
            setMaps(mapsData.maps || [])
            const active = (mapsData.maps || []).find((m: UserMap) => m.is_active && !m.is_draft)
            if (active) setActiveMap(active)
          }
        } catch {
          // Maps table may not exist yet
        }
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToUnlock = async () => {
    if (!intensiveId) return

    setCompleting(true)
    try {
      const supabase = createClient()
      const completedTime = new Date().toISOString()

      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: completedTime
        })
        .eq('intensive_id', intensiveId)

      setShowStepCompleteModal(true)
    } catch (error) {
      console.error('Error completing:', error)
      alert('Failed to continue. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const getVisionLink = (path: string) => {
    if (activeVisionId) {
      return `/life-vision/${activeVisionId}${path}`
    }
    return '/life-vision/active'
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const pastMaps = maps.filter(m => !(m.is_active && !m.is_draft))

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner if revisiting during intensive */}
        {isIntensiveFlow && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner
            stepTitle="My Activation Plan"
            completedAt={completedAt}
          />
        )}

        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <PageHero
          eyebrow={isIntensiveFlow ? "ACTIVATION INTENSIVE \u2022 STEP 13 OF 14" : "MAP"}
          title="My Activation Plan"
          subtitle={activeMap
            ? `Your active MAP: ${activeMap.title}`
            : "Build your personal weekly roadmap to make The Life I Choose your new normal."
          }
        >
          <div className="flex flex-row flex-wrap justify-center lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
            {isIntensiveFlow ? (
              isAlreadyCompleted ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  <span>Go to Dashboard</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleContinueToUnlock}
                  disabled={completing}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  {completing ? (
                    <>
                      <Spinner size="sm" />
                      <span>Continuing...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 shrink-0" />
                      <span>Continue to Unlock Platform</span>
                    </>
                  )}
                </Button>
              )
            ) : (
              <>
                {activeMap ? (
                  <Button
                    variant="primary"
                    size="sm"
                    asChild
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                  >
                    <Link href={`/map/${activeMap.id}`}>
                      <MapIcon className="w-4 h-4 shrink-0" />
                      <span>View Active MAP</span>
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant={activeMap ? 'outline' : 'primary'}
                  size="sm"
                  asChild
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Link href="/map/new">
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Build New MAP</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </PageHero>

        {/* ============================================ */}
        {/* ACTIVE MAP PREVIEW */}
        {/* ============================================ */}
        {!isIntensiveFlow && activeMap && activeMap.items && (activeMap.items as UserMapItem[]).length > 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <div className="flex items-center justify-between">
                <Inline gap="sm" className="items-center">
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                    Active MAP
                  </Text>
                  <Badge variant="neutral" className="text-[#39FF14] border-[#39FF14]/30 text-xs">
                    V{activeMap.version_number}
                  </Badge>
                </Inline>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/map/${activeMap.id}`}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Details
                  </Link>
                </Button>
              </div>

              {/* Compact summary of the active MAP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORY_ORDER.map(category => {
                  const items = ((activeMap.items || []) as UserMapItem[]).filter(
                    i => i.category === category
                  )
                  const color = CATEGORY_COLORS[category]
                  return (
                    <div
                      key={category}
                      className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <Text size="xs" className="text-neutral-500 uppercase tracking-wider">
                          {CATEGORY_LABELS[category]}
                        </Text>
                      </div>
                      {items.length === 0 ? (
                        <Text size="xs" className="text-neutral-600">None</Text>
                      ) : (
                        <div className="space-y-1">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-1.5">
                              {item.notify_sms ? (
                                <Bell className="w-3 h-3 text-[#39FF14] flex-shrink-0" />
                              ) : (
                                <BellOff className="w-3 h-3 text-neutral-700 flex-shrink-0" />
                              )}
                              <Text size="xs" className="text-neutral-300 truncate">
                                {item.label}
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Stack>
          </Card>
        )}

        {/* ============================================ */}
        {/* PAST MAPS */}
        {/* ============================================ */}
        {!isIntensiveFlow && pastMaps.length > 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Past MAPs
              </Text>
              <div className="space-y-2">
                {pastMaps.map(m => (
                  <Link
                    key={m.id}
                    href={`/map/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/50 hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <Text size="sm" className="text-white font-medium">
                        {m.title}
                      </Text>
                      <Text size="xs" className="text-neutral-500">
                        V{m.version_number} &middot; {(m.items as UserMapItem[] | undefined)?.length ?? 0} activities &middot;{' '}
                        {getMapDisplayStatus(m) === 'draft' ? 'Draft' : 'Archived'}
                      </Text>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-600" />
                  </Link>
                ))}
              </div>
            </Stack>
          </Card>
        )}

        {/* ============================================ */}
        {/* MAP GUIDE (Collapsible) */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between"
          >
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
              MAP Guide
            </Text>
            {showGuide ? (
              <ChevronUp className="w-5 h-5 text-neutral-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-500" />
            )}
          </button>

          {showGuide && (
            <Stack gap="lg" className="mt-6">
              {/* Video */}
              <div className="mx-auto w-full max-w-3xl">
                <OptimizedVideo
                  url={MAP_VIDEO}
                  thumbnailUrl={MAP_POSTER}
                  context="single"
                  className="w-full"
                />
              </div>

              {/* Intro */}
              <div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                  You&apos;ve completed your first Creations. Your profile, assessment, Life Vision, audios, Vision Board, and journal entry are complete.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Now your MAP shows you exactly how to keep creating, activate what you&apos;ve built, connect with your community, and attend your sessions so The Life I Choose becomes your new normal.
                </p>
              </div>

              {/* Creations */}
              <div>
                <Text size="sm" className="text-[#FFFF00] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#FFFF00]/30 mb-4">
                  Creations
                </Text>
                <p className="text-sm text-neutral-500 mt-2 mb-4">Make and add to the tools that power your practice</p>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Sun className="h-5 w-5 text-amber-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Daily Paper</Text>
                      <Text size="xs" className="text-neutral-500">Each morning</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Complete your <strong>Daily Paper</strong> to set your intention for the day.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/daily-paper">
                        <FileText className="w-4 h-4 mr-2" />
                        Daily Paper
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Moon className="h-5 w-5 text-purple-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Evidence Journal</Text>
                      <Text size="xs" className="text-neutral-500">Each evening</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Journal</strong> and record evidence of alignment from the day.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/journal">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Journal
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-3">
                    <ImageIcon className="h-5 w-5 text-[#FFFF00]" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Vision Board + Audios</Text>
                      <Text size="xs" className="text-neutral-500">As your vision evolves</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Refresh your <strong>Vision Board</strong> tiles as new images resonate.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                      <span>Record fresh <strong>Vision Audios</strong> when you refine your Life Vision.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/vision-board">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Vision Board
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}>
                        <Headphones className="w-4 h-4 mr-2" />
                        Vision Audios
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activations */}
              <div>
                <Text size="sm" className="text-[#39FF14] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#39FF14]/30 mb-4">
                  Activations
                </Text>
                <p className="text-sm text-neutral-500 mt-2 mb-4">Engage the tools you&apos;ve created to stay in alignment</p>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Sun className="h-5 w-5 text-amber-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Morning Vision Activation</Text>
                      <Text size="xs" className="text-neutral-500">Approximately 10-15 minutes</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Read your <strong>Life Vision</strong> out loud or listen to the audio.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Vision Board</strong> and quickly scan your tiles.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('')}>
                        <Target className="w-4 h-4 mr-2" />
                        Life Vision
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/vision-board">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Vision Board
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 mb-3">
                  <Inline gap="sm" className="items-start mb-3">
                    <Zap className="h-5 w-5 text-primary-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Real-Time Category Activation</Text>
                      <Text size="xs" className="text-neutral-500">1+ time per day</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Open your <strong>Vision Audios</strong> and listen 1-3 minutes to the category you&apos;re about to step into.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Make one micro decision from that place.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}>
                        <Headphones className="w-4 h-4 mr-2" />
                        Vision Audios
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-3">
                    <Moon className="h-5 w-5 text-purple-400" />
                    <div>
                      <Text size="sm" className="text-white font-semibold">Night Sleep Immersion</Text>
                      <Text size="xs" className="text-neutral-500">Approximately 5-10 minutes</Text>
                    </div>
                  </Inline>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Read your <strong>Life Vision</strong> out loud or listen to the audio.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Press play on your <strong>Sleep Immersion</strong> track and let it loop.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={getVisionLink('/audio')}>
                        <Headphones className="w-4 h-4 mr-2" />
                        Vision Audios
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connections */}
              <div>
                <Text size="sm" className="text-[#BF00FF] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#BF00FF]/30 mb-4">
                  Connections
                </Text>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-2">
                    <UsersRound className="h-5 w-5 text-purple-400" />
                    <Text size="sm" className="text-white font-semibold">Vibe Tribe</Text>
                  </Inline>
                  <p className="text-sm text-neutral-300">Share a short post or clip with your key takeaway from Alignment Gym.</p>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/vibe-tribe">
                        <UsersRound className="w-4 h-4 mr-2" />
                        Vibe Tribe
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div>
                <Text size="sm" className="text-[#00FFFF] uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#00FFFF]/30 mb-4">
                  Sessions
                </Text>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Inline gap="sm" className="items-start mb-2">
                    <Video className="h-5 w-5 text-teal-400" />
                    <Text size="sm" className="text-white font-semibold">Alignment Gym</Text>
                  </Inline>
                  <p className="text-sm text-neutral-300">Attend live or watch the replay. Take session notes.</p>
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/alignment-gym">
                        <Video className="w-4 h-4 mr-2" />
                        Alignment Gym
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333] mb-2">
                  Activation Milestones
                </Text>
                <p className="text-sm text-neutral-500 mb-4">Earn badges by logging activations on different days:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MILESTONES.map((milestone) => (
                    <div
                      key={milestone.day}
                      className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-primary-400 font-bold">{milestone.day}</span>
                        </div>
                        <Badge variant="neutral" className="text-primary-400 border-primary-500/30 flex-1">
                          {milestone.label}
                        </Badge>
                        <button
                          onClick={() => setSelectedMilestoneBadge(makeBadgeStub(milestone.badgeType))}
                          className="p-1 rounded-md hover:bg-white/10 transition-colors text-neutral-400 hover:text-primary-400"
                          aria-label={`Learn more about ${milestone.label}`}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        &quot;{milestone.message}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Creations Cycle */}
              <div>
                <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333] mb-4">
                  When Everything Upgrades, Start a New Creations Cycle
                </Text>
                <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                  When your current Life Vision mostly manifests or life takes a sharp turn, don&apos;t force an old vision. Start a new version.
                </p>
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <Text size="sm" className="text-white font-semibold mb-3">Checklist for a new version:</Text>
                  <div className="space-y-2">
                    {[
                      { icon: User, label: 'Update Profile' },
                      { icon: ClipboardCheck, label: 'New Assessment' },
                      { icon: FileText, label: 'Write your new Life Vision' },
                      { icon: Mic, label: 'Record fresh audios' },
                      { icon: Layers, label: 'Refresh your Vision Board' },
                    ].map(({ icon: StepIcon, label }) => (
                      <div key={label} className="flex items-center gap-3 text-sm text-neutral-300">
                        <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                          <StepIcon className="w-3 h-3 text-neutral-500" />
                        </div>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Stack>
          )}
        </Card>

        {/* ============================================ */}
        {/* BOTTOM CTA */}
        {/* ============================================ */}
        {!isIntensiveFlow && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
            <div className="py-6">
              <p className="text-neutral-300 mb-4">
                {activeMap
                  ? 'Build a new MAP to update your weekly practice.'
                  : 'Ready to plan your week? Build your first MAP.'
                }
              </p>
              <div className="flex flex-row flex-wrap justify-center gap-2 md:gap-4">
                {activeMap && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                  >
                    <Link href={`/map/${activeMap.id}`}>
                      <MapIcon className="w-4 h-4 shrink-0" />
                      <span>View Active MAP</span>
                    </Link>
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  asChild
                  className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Link href="/map/new">
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Build New MAP</span>
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isIntensiveFlow && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
            <div className="py-6">
              {!isAlreadyCompleted ? (
                <>
                  <h2 className="text-xl md:text-2xl font-bold mb-3 text-white">Ready to Unlock?</h2>
                  <p className="text-sm text-neutral-300 mb-6">
                    You&apos;ve reviewed your MAP. Continue to unlock your full platform access.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContinueToUnlock}
                    disabled={completing}
                    className="w-full sm:w-auto"
                  >
                    {completing ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Continuing...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 mr-2" />
                        Continue to Unlock Platform
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-neutral-300 mb-4">
                    This is your MAP. Come back anytime during your journey.
                  </p>
                  <Button variant="primary" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}
      </Stack>

      <BadgeDetailModal
        badge={selectedMilestoneBadge}
        isOpen={!!selectedMilestoneBadge}
        onClose={() => setSelectedMilestoneBadge(null)}
      />

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="activation_protocol"
      />
    </Container>
  )
}
