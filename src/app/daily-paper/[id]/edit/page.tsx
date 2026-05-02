'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { DailyPaperEditForm } from '@/components/daily-paper'
import type { DailyPaperEntry } from '@/hooks/useDailyPaper'

export default function EditDailyPaperPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [entry, setEntry] = useState<DailyPaperEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      const resolvedParams = await params
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: entryData, error } = await supabase
        .from('daily_papers')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      if (error || !entryData) {
        router.push('/daily-paper')
        return
      }

      setEntry(entryData)
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
      <div className="text-center py-16">
        <div className="text-neutral-400">Entry not found</div>
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero title="Edit Daily Paper" />
        <DailyPaperEditForm
          key={entry.id}
          entry={entry}
          onCancel={() => router.push(`/daily-paper?expand=${entry.id}`)}
          onSuccess={() => router.push(`/daily-paper?expand=${entry.id}`)}
        />
      </Stack>
    </Container>
  )
}
