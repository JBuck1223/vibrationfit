'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

interface JournalEntry {
  id: string
  title: string
  date: string
  categories: string[]
  created_at: string
}

interface JournalStudioContextValue {
  entries: JournalEntry[]
  loading: boolean
  entryCount: number
  refreshEntries: () => Promise<void>
}

const JournalStudioContext = createContext<JournalStudioContextValue | null>(null)

export function useJournalStudio() {
  const ctx = useContext(JournalStudioContext)
  if (!ctx) throw new Error('useJournalStudio must be used within JournalStudioProvider')
  return ctx
}

async function fetchEntries(): Promise<JournalEntry[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, title, date, categories, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export function JournalStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: keys.journalEntries,
    queryFn: fetchEntries,
  })

  const refreshEntries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.journalEntries })
  }, [queryClient])

  return (
    <JournalStudioContext.Provider
      value={{
        entries,
        loading,
        entryCount: entries.length,
        refreshEntries,
      }}
    >
      {children}
    </JournalStudioContext.Provider>
  )
}
