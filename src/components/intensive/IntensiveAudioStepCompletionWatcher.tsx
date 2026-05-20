'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { useIntensiveStepCompleteModal } from '@/lib/intensive/use-step-complete-modal'
import type { IntensiveStepType } from '@/lib/intensive/checklist'

type WatchKey = 'audio_generated' | 'audios_generated'

const WATCH_KEYS: WatchKey[] = ['audio_generated', 'audios_generated']

/**
 * On intensive audio queue pages, shows step-complete modal when async generation
 * marks audio_generated or audios_generated on the checklist.
 */
export function IntensiveAudioStepCompletionWatcher() {
  const pathname = usePathname()
  const onQueuePage =
    pathname.startsWith('/audio/queue') || pathname.startsWith('/intensive/audio/queue')
  const { isOpen, stepId, showModalForChecklistKey, closeModal } = useIntensiveStepCompleteModal()
  const prevRef = useRef<Record<WatchKey, boolean>>({
    audio_generated: false,
    audios_generated: false,
  })
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!onQueuePage) return

    let cancelled = false

    const poll = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('audio_generated, audios_generated')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!checklist || cancelled) return

      for (const key of WATCH_KEYS) {
        const nowComplete = !!checklist[key]
        const wasComplete = prevRef.current[key]

        if (initializedRef.current && nowComplete && !wasComplete) {
          showModalForChecklistKey(key as IntensiveStepType)
        }

        prevRef.current[key] = nowComplete
      }

      initializedRef.current = true
    }

    poll()
    const interval = setInterval(poll, 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [onQueuePage, showModalForChecklistKey])

  if (!onQueuePage || !stepId) return null

  return (
    <IntensiveStepCompleteModal
      isOpen={isOpen}
      onClose={closeModal}
      stepId={stepId}
    />
  )
}
