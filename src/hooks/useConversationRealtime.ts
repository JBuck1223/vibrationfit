'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseConversationRealtimeParams {
  /** Called when a new or updated email/SMS arrives */
  onUpdate: () => void
  /** Filter by user_id (for members) */
  userId?: string | null
  /** Filter by email address (for leads/guests) */
  email?: string | null
  /** Disable the subscription (e.g. while data is still loading) */
  enabled?: boolean
}

/**
 * Subscribes to Supabase Realtime on email_messages and sms_messages.
 * Calls `onUpdate` whenever a relevant row is inserted or updated,
 * giving CRM views instant reply and status-change notifications.
 */
export function useConversationRealtime({
  onUpdate,
  userId,
  email,
  enabled = true,
}: UseConversationRealtimeParams) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!enabled || (!userId && !email)) return

    const supabase = createClient()
    const channelName = `crm-conv-${userId || email}`

    const channel = supabase.channel(channelName)

    if (userId) {
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'email_messages',
          filter: `user_id=eq.${userId}`,
        }, () => onUpdateRef.current())
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'sms_messages',
          filter: `user_id=eq.${userId}`,
        }, () => onUpdateRef.current())
    }

    if (email) {
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'email_messages',
          filter: `to_email=eq.${email}`,
        }, () => onUpdateRef.current())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'email_messages',
          filter: `from_email=eq.${email}`,
        }, () => onUpdateRef.current())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'email_messages',
          filter: `guest_email=eq.${email}`,
        }, () => onUpdateRef.current())
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId, email, enabled])
}
