'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
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
import { MapDayView } from '@/components/map-studio/MapDayView'
import { useMapStudio } from '@/components/map-studio/MapStudioContext'
import { todayDateString } from '@/lib/map/map-date-utils'
import { PILLAR_META } from '@/lib/map/map-pillar-config'
import { INTENSIVE_DEFAULT_SELECTIONS } from '@/lib/map/intensive-map-config'
import { getActivityDefinition } from '@/lib/map/activities'
import { formatCadenceLabel } from '@/lib/map/map-builder-cadence'
import { Headphones, BookOpen, Heart, Video, Bell } from 'lucide-react'

function IntensiveMapExplainer() {
  const starterItems = INTENSIVE_DEFAULT_SELECTIONS.map(def => {
    const activity = getActivityDefinition(def.activityType)
    const pillar = activity?.category
    return {
      key: def.activityType,
      label: activity?.label ?? def.activityType,
      pillar: pillar ? PILLAR_META[pillar].verb : '',
      color: pillar ? PILLAR_META[pillar].color : '#39FF14',
      cadence: formatCadenceLabel(def.cadenceJson),
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
    <div className="space-y-4">
      <div className="w-full text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Your MAP</h1>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-none">
          <span className="text-white font-medium">My Alignment Plan</span> is your weekly rhythm. Review below, tune cadence and reminders, then activate.
        </p>
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800 p-4 sm:p-5">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-neutral-500">
            Pre-selected for you
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starterItems.map(({ key, label, pillar, color, cadence, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-800/40 border border-neutral-800/80"
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{label}</p>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">{pillar}</p>
                </div>
                <span className="shrink-0 rounded-md bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400 border border-primary-500/25">
                  {cadence}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2.5 pt-3 border-t border-neutral-800/80">
            <Bell className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-neutral-300">Schedule your nudges</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Under each commitment: Email or SMS, days, and time. Optional Monday weekly digest at the
                bottom. Alignment Gym follows its published session schedule.
              </p>
              <p className="text-[11px] text-neutral-600">
                SMS requires a phone number —{' '}
                <Link href="/intensive/account/settings" className="text-primary-400 hover:underline">
                  Account Settings
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function IntensiveMapGraduatePreview() {
  const { setSelectedDate } = useMapStudio()

  useEffect(() => {
    setSelectedDate(todayDateString())
  }, [setSelectedDate])

  return (
    <Stack gap="md">
      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5">
        <p className="text-sm text-neutral-300 leading-relaxed text-center">
          Your MAP begins once you graduate. Complete your intensive for access to all MAP
          features and to start doing the daily reps.
        </p>
      </Card>
      <MapDayView readOnly />
    </Stack>
  )
}

export default function IntensiveMapPage() {
  const router = useRouter()
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()
  const [loading, setLoading] = useState(true)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [hasGraduated, setHasGraduated] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)

  const loadInitialData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('intensive_id, activation_protocol_completed, activation_protocol_completed_at, unlock_completed')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklist) {
        setIntensiveId(checklist.intensive_id)
        if (checklist.unlock_completed) {
          setHasGraduated(true)
        }
        if (checklist.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
          if (checklist.activation_protocol_completed_at) {
            setStepCompleted(checklist.activation_protocol_completed_at)
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }, [setStepCompleted])

  useEffect(() => {
    loadInitialData()
    return () => setStepCompleted(null)
  }, [loadInitialData, setStepCompleted])

  useEffect(() => {
    if (!loading && hasGraduated) {
      router.replace('/map')
    }
  }, [loading, hasGraduated, router])

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
    setStepCompleted(completedTime)
    setShowStepCompleteModal(true)
  }, [intensiveId, setStepCompleted])

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
          <IntensiveMapGraduatePreview />
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
