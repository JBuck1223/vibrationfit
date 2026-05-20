'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  IntensiveStepCompleteModal,
} from '@/lib/design-system/components'
import { MapSystemBuilder } from '@/components/map-studio/MapSystemBuilder'
import { PILLAR_META } from '@/lib/map/map-pillar-config'
import { INTENSIVE_DEFAULT_SELECTIONS } from '@/lib/map/intensive-map-config'
import { getActivityDefinition } from '@/lib/map/activities'
import {
  Headphones,
  BookOpen,
  Heart,
  Video,
  Bell,
  Sparkles,
  Unlock,
  BookMarked,
  Music2,
  Eye,
  Image,
  FileText,
  DollarSign,
  Sun,
} from 'lucide-react'

function IntensiveMapExplainer() {
  const starterItems = INTENSIVE_DEFAULT_SELECTIONS.map(def => {
    const activity = getActivityDefinition(def.activityType)
    const pillar = activity?.category
    return {
      label: activity?.label ?? def.activityType,
      pillar: pillar ? PILLAR_META[pillar].verb : '',
      color: pillar ? PILLAR_META[pillar].color : '#39FF14',
      icon:
        def.activityType === 'vision_audio'
          ? Headphones
          : def.activityType === 'journal_entry'
            ? BookOpen
            : def.activityType === 'vibe_tribe_engage'
              ? Heart
              : Video,
    }
  })

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <h1 className="text-2xl font-bold text-white">Your Starter MAP</h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          MAP stands for <span className="text-white font-medium">My Alignment Plan</span> — your weekly
          rhythm of practices that keep you aligned. We pre-built this from what you already did in the
          Intensive: vision audio, journal, Vibe Tribe, and Alignment Gym.
        </p>
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800 p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-neutral-500 mb-3">
          Pre-selected for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {starterItems.map(({ label, pillar, color, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80"
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{label}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color }}>
                  {pillar}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-[#101010] border-[#1F1F1F] p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-[#00FFFF]" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Schedule your nudges</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Under each commitment you can turn on Email or SMS reminders, pick days and times, and set
              an optional Monday weekly digest. Alignment Gym uses its published session schedule instead
              of custom reminders.
            </p>
            <p className="text-xs text-neutral-500">
              SMS needs a phone number —{' '}
              <Link href="/intensive/account/settings" className="text-primary-400 hover:underline">
                update Account Settings
              </Link>{' '}
              if you have not already.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-neutral-900/50 border-neutral-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#39FF14]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">More rituals after graduation</p>
            <p className="text-xs text-neutral-400">
              Your MAP can grow with additional activations and creations — not fewer reminders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: BookMarked, label: 'Story Audio Listens', color: '#39FF14' },
            { icon: Music2, label: 'VibrationFit Music', color: '#39FF14' },
            { icon: Eye, label: 'Life Vision Reads', color: '#39FF14' },
            { icon: Image, label: 'Vision Board Reviews', color: '#39FF14' },
            { icon: Sun, label: 'Journal Reviews', color: '#39FF14' },
            { icon: FileText, label: 'Daily Paper', color: '#FFFF00' },
            { icon: Image, label: 'Vision Board Updates', color: '#FFFF00' },
            { icon: DollarSign, label: 'Abundance Tracker', color: '#FFFF00' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-800/40">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <span className="text-xs text-neutral-400">{label}</span>
              <Unlock className="w-3 h-3 text-neutral-600 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function IntensiveMapPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)

  const loadInitialData = useCallback(async () => {
    try {
      const intensiveData = await getActiveIntensiveClient()
      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        if (intensiveData.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleIntensiveActivateComplete = useCallback(async () => {
    if (!intensiveId) return
    const supabase = createClient()
    const completedTime = new Date().toISOString()
    await supabase
      .from('intensive_checklist')
      .update({
        activation_protocol_completed: true,
        activation_protocol_completed_at: completedTime,
      })
      .eq('intensive_id', intensiveId)

    invalidateIntensiveSnapshot()
    setIsAlreadyCompleted(true)
    setShowStepCompleteModal(true)
  }, [intensiveId])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {isAlreadyCompleted ? (
          <>
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Your MAP</h1>
              <p className="text-sm text-neutral-500">
                Reminders and weekly digest are in Account Settings or on each commitment in MAP.
              </p>
            </div>
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
              <div className="py-6 px-4">
                <p className="text-neutral-300 mb-4 text-sm">
                  You already activated your starter MAP. Open it anytime to see today&apos;s actions.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="primary" asChild>
                    <Link href="/map">Open MAP</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/intensive/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <IntensiveMapExplainer />
            <MapSystemBuilder
              variant="intensive-first-cycle"
              onActivateComplete={handleIntensiveActivateComplete}
            />
          </>
        )}
      </Stack>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => {
          setShowStepCompleteModal(false)
          router.push('/intensive/unlock')
        }}
        stepId="activation_protocol"
      />
    </Container>
  )
}
