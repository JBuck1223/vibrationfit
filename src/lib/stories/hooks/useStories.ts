'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  Story, 
  StoryEntityType, 
  CreateStoryPayload, 
  UseStoriesReturn 
} from '../types'

/**
 * Hook for fetching and managing stories for a specific entity
 */
export function useStories(
  entityType: StoryEntityType,
  entityId: string
): UseStoriesReturn {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchStories = useCallback(async () => {
    if (!entityId) {
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
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setStories(data || [])
    } catch (err) {
      console.error('Error fetching stories:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stories')
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  const createStory = useCallback(async (
    payload: CreateStoryPayload
  ): Promise<Story | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return null
      }

      // Get the next display_order
      const maxOrder = stories.reduce((max, s) => 
        Math.max(max, s.display_order || 0), 0
      )

      const { data, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: payload.entity_type,
          entity_id: payload.entity_id,
          title: payload.title || null,
          content: payload.content || null,
          source: payload.source || 'user_written',
          metadata: payload.metadata || {},
          display_order: payload.display_order ?? maxOrder + 1,
          status: 'draft'
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update local state
      setStories(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating story:', err)
      setError(err instanceof Error ? err.message : 'Failed to create story')
      return null
    }
  }, [supabase, stories])

  const deleteStory = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      setStories(prev => prev.filter(s => s.id !== storyId))
      return true
    } catch (err) {
      console.error('Error deleting story:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete story')
      return false
    }
  }, [supabase])

  return {
    stories,
    loading,
    error,
    refetch: fetchStories,
    createStory,
    deleteStory
  }
}
