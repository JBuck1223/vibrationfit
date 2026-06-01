'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import JournalNewPage from '@/app/journal/new/page'

export default function IntensiveJournalNewPage() {
  const { setCompletedAt } = useIntensiveStep()

  useEffect(() => {
    let cancelled = false

    const checkCompletion = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('first_journal_entry, first_journal_entry_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (cancelled) return

      if (checklist?.first_journal_entry && checklist.first_journal_entry_at) {
        setCompletedAt(checklist.first_journal_entry_at)
      }
    }

    checkCompletion()

    return () => {
      cancelled = true
      setCompletedAt(null)
    }
  }, [setCompletedAt])

  return <JournalNewPage />
}
