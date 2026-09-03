'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, IntensiveStepCompleteModal } from '@/lib/design-system'
import { JournalSuccessScreen } from '@/components/JournalSuccessScreen'
import { NewJournalEntryForm } from '@/components/journal/NewJournalEntryForm'
import { useJournalStudio } from '@/components/journal-studio'
import { createClient } from '@/lib/supabase/client'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveUrlParam = searchParams.get('intensive') === 'true'
  const manifestationParam = searchParams.get('manifestation')
  const supabase = createClient()
  const { refreshEntries } = useJournalStudio()

  const [showSuccess, setShowSuccess] = useState(false)
  const [savedTitle, setSavedTitle] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [isUserInIntensive, setIsUserInIntensive] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [manifestationName, setManifestationName] = useState<string | null>(null)

  // ?manifestation= pre-attaches the new entry to that manifestation's Journey
  useEffect(() => {
    if (!manifestationParam) return
    const loadName = async () => {
      const { data } = await supabase
        .from('manifestations')
        .select('name')
        .eq('id', manifestationParam)
        .maybeSingle()
      if (data?.name) setManifestationName(data.name)
    }
    void loadName()
  }, [manifestationParam, supabase])

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

  const handleSuccess = async (entryId: string, meta?: { title: string }) => {
    if (meta?.title) setSavedTitle(meta.title)
    if (manifestationParam) {
      try {
        await fetch(`/api/manifestations/${manifestationParam}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: 'journal', entity_type: 'journal_entries', entity_id: entryId }),
        })
      } catch (error) {
        console.error('Could not attach entry to manifestation:', error)
      }
    }
    // Update the studio context so the area bar entry list includes the new entry
    void refreshEntries()
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
        {manifestationName && (
          <p className="text-xs text-neutral-400 rounded-xl border border-[#BF00FF]/30 bg-[#BF00FF]/10 px-4 py-2.5">
            This entry will be added to the journey of <span className="text-[#D46BFF] font-medium">{manifestationName}</span>.
          </p>
        )}
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
