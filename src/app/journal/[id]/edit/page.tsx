'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Spinner } from '@/lib/design-system'
import { JournalEditForm, type JournalEditEntry } from '@/components/journal'

export default function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEditEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const {
        data: { session },
        error: userError,
      } = await supabase.auth.getSession()
      const user = session?.user

      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      if (entryError || !entryData) {
        router.push('/journal')
        return
      }

      setEntry(entryData as JournalEditEntry)
      setLoading(false)
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [params, router])

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!entry) {
    return (
      <Container>
        <div className="text-center py-16">
          <div className="text-neutral-400">Entry not found</div>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Edit Journal Entry" subtitle="Update your thoughts, evidence, and insights" />
        <JournalEditForm
          key={entry.id}
          entry={entry}
          onCancel={() => router.push(`/journal?expand=${entry.id}`)}
          onSuccess={() => router.push(`/journal?expand=${entry.id}`)}
        />
      </Stack>
    </Container>
  )
}
