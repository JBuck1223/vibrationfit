'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function JournalStudioProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, title, date, categories, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  return (
    <JournalStudioContext.Provider
      value={{
        entries,
        loading,
        entryCount: entries.length,
        refreshEntries: loadEntries,
      }}
    >
      {children}
    </JournalStudioContext.Provider>
  )
}
