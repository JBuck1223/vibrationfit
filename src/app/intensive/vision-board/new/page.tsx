'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import VisionBoardNewPage from '@/app/vision-board/new/page'

export default function IntensiveVisionBoardNewPage() {
  const { setCompletedAt } = useIntensiveStep()

  useEffect(() => {
    let cancelled = false

    const checkCompletion = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('vision_board_completed, vision_board_completed_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (cancelled) return

      if (checklist?.vision_board_completed && checklist.vision_board_completed_at) {
        setCompletedAt(checklist.vision_board_completed_at)
      }
    }

    checkCompletion()

    return () => {
      cancelled = true
      setCompletedAt(null)
    }
  }, [setCompletedAt])

  return <VisionBoardNewPage />
}
