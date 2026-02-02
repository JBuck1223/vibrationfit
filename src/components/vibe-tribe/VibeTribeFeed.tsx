'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Spinner } from '@/lib/design-system'
import { RefreshCw, Sparkles } from 'lucide-react'
import { VibeTag, VibePost, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'
import { PostCard } from './PostCard'

interface VibeTribeFeedProps {
  tag?: VibeTag
  currentUserId?: string
  isAdmin?: boolean
}

export function VibeTribeFeed({ 
  tag,
  currentUserId,
  isAdmin = false,
}: VibeTribeFeedProps) {
  const [posts, setPosts] = useState<VibePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const fetchPosts = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    
    if (reset) {
      setRefreshing(true)
    } else if (currentOffset > 0) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: currentOffset.toString(),
      })
      
      if (tag) {
        params.set('tag', tag)
      }

      const response = await fetch(`/api/vibe-tribe/posts?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (reset || currentOffset === 0) {
          setPosts(data.posts || [])
        } else {
          setPosts(prev => [...prev, ...(data.posts || [])])
        }
        
        setHasMore(data.hasMore)
        setOffset(reset ? LIMIT : currentOffset + LIMIT)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [tag, offset])

  useEffect(() => {
    setPosts([])
    setOffset(0)
    setHasMore(true)
    fetchPosts(true)
  }, [tag])

  const handleRefresh = () => {
    fetchPosts(true)
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(false)
    }
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const addNewPost = (post: VibePost) => {
    setPosts(prev => [post, ...prev])
  }

  const tagConfig = tag ? VIBE_TAG_CONFIG[tag] : null

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {tag ? `No ${tagConfig?.label.toLowerCase()} posts yet` : 'No posts yet'}
          </h3>
          <p className="text-neutral-400 max-w-md mx-auto">
            {tag 
              ? `Be the first to share ${tagConfig?.label === 'Win' ? 'a win or synchronicity' : tagConfig?.label === 'Wobble' ? 'a wobble and get support' : tagConfig?.label === 'Vision' ? 'your vision or intention' : 'a practice or hack'}!`
              : 'Be the first to post something to the Vibe Tribe!'
            }
          </p>
        </Card>
      )}
    </div>
  )
}

// Export the addNewPost method for external use
export type VibeTribeFeedRef = {
  addNewPost: (post: VibePost) => void
}
