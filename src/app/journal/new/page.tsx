'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, IntensiveStepCompleteModal } from '@/lib/design-system'
import { JournalSuccessScreen } from '@/components/JournalSuccessScreen'
import { NewJournalEntryForm } from '@/components/journal/NewJournalEntryForm'
import { createClient } from '@/lib/supabase/client'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveUrlParam = searchParams.get('intensive') === 'true'
  const supabase = createClient()

  const [showSuccess, setShowSuccess] = useState(false)
  const [savedTitle, setSavedTitle] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [isUserInIntensive, setIsUserInIntensive] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)

  useEffect(() => {
    const checkIntensiveMode = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        const { data: checklist } = await supabase
          .from('intensive_checklist')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .maybeSingle()

        setIsUserInIntensive(!!checklist || isIntensiveUrlParam)
      } catch (error) {
        console.error('Error checking intensive mode:', error)
      }
    }

    void checkIntensiveMode()
  }, [isIntensiveUrlParam, supabase])

  const handleCreateAnother = () => {
    setShowSuccess(false)
    setSavedTitle('')
    setFormKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewJournal = () => {
    router.push('/journal')
  }

  const handleSuccess = async (_entryId: string, meta?: { title: string }) => {
    if (meta?.title) setSavedTitle(meta.title)
    if (isUserInIntensive) {
      const { markIntensiveStep } = await import('@/lib/intensive/checklist')
      await markIntensiveStep('first_journal_entry')
      setShowStepCompleteModal(true)
    } else {
      setShowSuccess(true)
    }
  }

  if (showSuccess) {
    return (
      <JournalSuccessScreen
        onCreateAnother={handleCreateAnother}
        onViewJournal={handleViewJournal}
        entryTitle={savedTitle}
      />
    )
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <NewJournalEntryForm
          key={formKey}
          onCancel={() => router.back()}
          onSuccess={handleSuccess}
          showRecoverableBanner
        />
      </Stack>

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="journal"
      />
    </Container>
  )
}
