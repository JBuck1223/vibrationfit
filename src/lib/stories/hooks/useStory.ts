'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Story, UpdateStoryPayload, UseStoryReturn } from '../types'

/**
 * Hook for fetching and managing a single story
 */
export function useStory(storyId: string | null): UseStoryReturn {
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchStory = useCallback(async () => {
    if (!storyId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Story not found')
        } else {
          throw fetchError
        }
        return
      }

      setStory(data)
    } catch (err) {
      console.error('Error fetching story:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch story')
    } finally {
      setLoading(false)
    }
  }, [storyId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchStory()
  }, [fetchStory])

  const updateStory = useCallback(async (
    payload: UpdateStoryPayload
  ): Promise<boolean> => {
    if (!storyId || !story) {
      setError('No story to update')
      return false
    }

    setSaving(true)
    setError(null)

    try {
      // Calculate word count if content changed
      const updates: Record<string, unknown> = { ...payload }
      if (payload.content !== undefined) {
        updates.word_count = payload.content
          ? payload.content.trim().split(/\s+/).filter(Boolean).length
          : 0
      }

      const { data, error: updateError } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', storyId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setStory(data)
      return true
    } catch (err) {
      console.error('Error updating story:', err)
      setError(err instanceof Error ? err.message : 'Failed to update story')
      return false
    } finally {
      setSaving(false)
    }
  }, [storyId, story, supabase])

  const deleteStory = useCallback(async (): Promise<boolean> => {
    if (!storyId) {
      setError('No story to delete')
      return false
    }

    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (deleteError) {
        throw deleteError
      }

      setStory(null)
      return true
    } catch (err) {
      console.error('Error deleting story:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete story')
      return false
    }
  }, [storyId, supabase])

  return {
    story,
    loading,
    error,
    saving,
    refetch: fetchStory,
    updateStory,
    deleteStory
  }
}
