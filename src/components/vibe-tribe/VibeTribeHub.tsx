'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, Button, Spinner, Input } from '@/lib/design-system'
import { Trophy, Heart, Sparkles, Lightbulb, RefreshCw, Search, X } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

interface VibeTribeHubProps {
  userId: string
  isAdmin?: boolean
  initialFilter?: VibeTag | 'all'
}

export function VibeTribeHub({ userId, isAdmin = false, initialFilter = 'all' }: VibeTribeHubProps) {
  const [posts, setPosts] = useState<VibePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState<VibeTag | 'all'>(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const LIMIT = 20

  const fetchPosts = useCallback(async (reset = false, search?: string) => {
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
      
      if (activeFilter !== 'all') {
        params.set('tag', activeFilter)
      }
      
      if (search || searchQuery) {
        params.set('search', search || searchQuery)
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
      setIsSearching(false)
    }
  }, [activeFilter, offset, searchQuery])

  // Initial load and filter change
  useEffect(() => {
    setPosts([])
    setOffset(0)
    setHasMore(true)
    fetchPosts(true)
  }, [activeFilter])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(() => {
      setPosts([])
      setOffset(0)
      setHasMore(true)
      fetchPosts(true, value)
    }, 500)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setPosts([])
    setOffset(0)
    setHasMore(true)
    fetchPosts(true, '')
  }

  // Intersection observer for lazy loading
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(false)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading, fetchPosts])

  const handleRefresh = () => {
    fetchPosts(true)
  }

  const handlePostCreated = (post: VibePost) => {
    // Add new post to the top of the feed
    setPosts(prev => [post, ...prev])
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleFilterChange = (filter: VibeTag | 'all') => {
    setActiveFilter(filter)
  }

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <PostComposer
        onPostCreated={handlePostCreated}
        placeholder="Share with the Vibe Tribe..."
        userId={userId}
      />

      {/* Search and Filter Bar */}
      <Card className="p-3 md:p-4">
        {/* Search with Refresh */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-full pl-10 pr-10 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* All Filter */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              border-2 transition-all duration-200
              ${activeFilter === 'all'
                ? 'bg-white text-black border-white'
                : 'text-white border-white/50 hover:border-white'
              }
            `}
          >
            All
          </button>

          {/* Tag Filters */}
          {VIBE_TAGS.map((tag) => {
            const config = VIBE_TAG_CONFIG[tag]
            const Icon = ICON_MAP[tag]
            const isActive = activeFilter === tag
            
            return (
              <button
                key={tag}
                onClick={() => handleFilterChange(tag)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  border-2 transition-all duration-200
                `}
                style={{
                  borderColor: config.color,
                  backgroundColor: isActive ? config.color : 'transparent',
                  color: isActive ? '#000' : config.color,
                }}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handlePostDeleted}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          ))}

          {/* Lazy Load Trigger */}
          <div ref={loadMoreRef} className="py-4">
            {loadingMore && (
              <div className="flex justify-center">
                <Spinner size="md" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-neutral-500 text-sm">
                You've reached the end
              </p>
            )}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
            {searchQuery ? (
              <Search className="w-8 h-8 text-neutral-500" />
            ) : (
              <Sparkles className="w-8 h-8 text-neutral-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery 
              ? 'No posts found'
              : activeFilter !== 'all' 
                ? `No ${VIBE_TAG_CONFIG[activeFilter].label.toLowerCase()} posts yet`
                : 'No posts yet'
            }
          </h3>
          <p className="text-neutral-400 max-w-md mx-auto">
            {searchQuery
              ? 'Try a different search term or clear the search'
              : 'Be the first to share something with the Vibe Tribe!'
            }
          </p>
        </Card>
      )}
    </div>
  )
}
