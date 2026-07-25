'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { TABLE_TO_KEYS } from '@/lib/query/keys'

/**
 * Subscribes to postgres_changes on all core tables and invalidates the
 * mapped query keys whenever a row changes. Because the database is the
 * emitter, this catches writes from client components, API routes, cron
 * jobs, and other devices/tabs -- no mutation call site needs manual
 * refresh wiring.
 *
 * Events are RLS-filtered by Supabase Realtime, so users only receive
 * changes for rows they can see. Bursts (e.g. batch inserts) are
 * debounced per table.
 */
export function RealtimeInvalidationBridge() {
  const queryClient = useQueryClient()
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null
    let cancelled = false

    const invalidateForTable = (table: string) => {
      const timers = timersRef.current
      const existing = timers.get(table)
      if (existing) clearTimeout(existing)
      timers.set(
        table,
        setTimeout(() => {
          timers.delete(table)
          for (const key of TABLE_TO_KEYS[table] ?? []) {
            queryClient.invalidateQueries({ queryKey: [...key] })
          }
        }, 250)
      )
    }

    const subscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || cancelled || channel) return

      const ch = supabase.channel(`cache-invalidation-${session.user.id}`)
      for (const table of Object.keys(TABLE_TO_KEYS)) {
        ch.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => invalidateForTable(table)
        )
      }
      ch.subscribe()
      channel = ch
    }

    void subscribe()

    const { data: authListener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN') {
        void subscribe()
      } else if (event === 'SIGNED_OUT') {
        if (channel) {
          supabase.removeChannel(channel)
          channel = null
        }
        queryClient.clear()
      }
    })

    return () => {
      cancelled = true
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current.clear()
      if (channel) supabase.removeChannel(channel)
      authListener.subscription.unsubscribe()
    }
  }, [queryClient])

  return null
}
