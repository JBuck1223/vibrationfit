'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Spinner } from '@/lib/design-system'
import { Search, Pin, ChevronDown, Image as ImageIcon, ArrowUp, ArrowRight, X, Trophy, Heart, Sparkles, Lightbulb, Send, User, FileText, MessageCircle } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { PostCard } from './PostCard'
import { StickyPostComposer } from './StickyPostComposer'
import { HowToVibeCard } from './HowToVibeCard'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

interface UserProfile {
  id: string
  full_name: string | null
  profile_picture_url: string | null
}

interface VibeTribeFeedLayoutProps {
  userId: string
  isAdmin?: boolean
  initialFilter?: VibeTag | 'all'
  userProfile?: UserProfile | null
  hasPostedBefore?: boolean
}

export function VibeTribeFeedLayout({ userId, isAdmin = false, initialFilter = 'all', userProfile, hasPostedBefore = true }: VibeTribeFeedLayoutProps) {
  const [posts, setPosts] = useState<VibePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState<VibeTag | 'all'>(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [activityFilter, setActivityFilter] = useState<'off' | 'posts' | 'hearts' | 'comments'>('off')
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const LIMIT = 20

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      if (showPinned) {
        params.set('pinned', 'true')
      }

      // Apply activity filter
      if (activityFilter === 'posts') {
        params.set('user_id', userId)
      } else if (activityFilter === 'hearts') {
        params.set('hearted', 'true')
      } else if (activityFilter === 'comments') {
        params.set('commented', 'true')
      }

      const response = await fetch(`/api/vibe-tribe/posts?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        // Reverse posts so oldest appears at top, newest at bottom (chat-like)
        const reversedPosts = [...(data.posts || [])].reverse()
        
        if (reset || currentOffset === 0) {
          setPosts(reversedPosts)
        } else {
          // Prepend older posts to the top
          setPosts(prev => [...reversedPosts, ...prev])
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
  }, [activeFilter, offset, searchQuery, showPinned, activityFilter, userId])

  // Initial load and filter change
  useEffect(() => {
    setPosts([])
    setOffset(0)
    setHasMore(true)
    fetchPosts(true)
  }, [activeFilter, showPinned, activityFilter])

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

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
    setShowSearch(false)
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

  const handlePostCreated = (post: VibePost) => {
    // Add new post to the bottom (end of array)
    setPosts(prev => [...prev, post])
    // Scroll to the new post after it renders
    setTimeout(() => {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleFilterSelect = (filter: VibeTag | 'all') => {
    setActiveFilter(filter)
    setShowFilterDropdown(false)
  }

  const getFilterLabel = () => {
    if (activeFilter === 'all') return 'All'
    return VIBE_TAG_CONFIG[activeFilter].label
  }

  return (
    <div className="flex flex-col h-full min-h-screen md:min-h-0 md:h-full bg-black">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-black border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Left side - Profile Picture + Title/Name */}
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-full pl-4 pr-10 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
                {isSearching && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <button
                onClick={clearSearch}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Profile Picture + Vibe Tribe Title + User Name */}
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 ring-2 ring-neutral-600">
                  <img
                    src={userProfile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                    alt={userProfile?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Title and User Name */}
                <div className="flex flex-col">
                  <h1 className="text-base font-bold text-white leading-tight">Vibe Tribe</h1>
                  {userProfile?.full_name && (
                    <Link 
                      href={`/snapshot/${userProfile.id}`}
                      className="text-xs font-medium text-[#39FF14] leading-tight hover:underline"
                    >
                      {userProfile.full_name}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right side - Search, My Posts, Filter dropdown and Pin */}
              <div className="flex items-center gap-2">
                {/* Search Icon */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* My Activity Icon */}
                <button
                  onClick={() => setActivityFilter(activityFilter === 'off' ? 'posts' : 'off')}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                    activityFilter !== 'off'
                      ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10' 
                      : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  }`}
                  title={activityFilter !== 'off' ? 'Show all posts' : 'Show my activity'}
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Filter Dropdown - Pill shaped */}
                <div ref={filterDropdownRef} className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors"
                  >
                    {getFilterLabel()}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg overflow-hidden z-50">
                      <button
                        onClick={() => handleFilterSelect('all')}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                          activeFilter === 'all' 
                            ? 'bg-neutral-800 text-white' 
                            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      {VIBE_TAGS.map((tag) => {
                        const config = VIBE_TAG_CONFIG[tag]
                        const Icon = ICON_MAP[tag]
                        return (
                          <button
                            key={tag}
                            onClick={() => handleFilterSelect(tag)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                              activeFilter === tag 
                                ? 'bg-neutral-800' 
                                : 'hover:bg-neutral-800'
                            }`}
                            style={{ color: config.color }}
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Pin Icon - Circle with dark background */}
                <button
                  onClick={() => setShowPinned(!showPinned)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                    showPinned 
                      ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10' 
                      : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  }`}
                >
                  <Pin className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity Filter Bar - shows when activity filter is active */}
      {activityFilter !== 'off' && (
        <div className="bg-black border-b border-neutral-800 px-4 py-2">
          <div className="flex items-center gap-2 max-w-2xl mx-auto overflow-x-auto pb-1">
            <button
              onClick={() => setActivityFilter('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                activityFilter === 'posts'
                  ? 'bg-[#39FF14] text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              My Posts
            </button>
            <button
              onClick={() => setActivityFilter('hearts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                activityFilter === 'hearts'
                  ? 'bg-[#39FF14] text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Heart className="w-4 h-4" />
              Hearts
            </button>
            <button
              onClick={() => setActivityFilter('comments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                activityFilter === 'comments'
                  ? 'bg-[#39FF14] text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Comments
            </button>
            <button
              onClick={() => setActivityFilter('off')}
              className="ml-auto p-2 text-neutral-400 hover:text-white transition-colors"
              title="Close filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Banner - shows when user hasn't posted yet */}
      {!hasPostedBefore && (
        <div className="bg-gradient-to-r from-[#39FF14]/10 to-[#BF00FF]/10 border-b border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Link 
              href="/vibe-tribe/new"
              className="flex items-center justify-between gap-4 group"
            >
              <div>
                <p className="text-white font-medium">Welcome to Vibe Tribe</p>
                <p className="text-sm text-neutral-400">Make your first post to unlock the full experience</p>
              </div>
              <div className="flex items-center gap-2 text-[#39FF14] group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">Start Here</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className={`flex-1 overflow-y-auto ${hasPostedBefore ? 'pb-40 md:pb-24' : 'pb-8'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* How to Vibe Guide - only show for users who have posted */}
          {hasPostedBefore && (
            <div className="mb-4">
              <HowToVibeCard />
            </div>
          )}
          {(loading || refreshing) ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {/* Load Older Posts Trigger - at top */}
              <div ref={loadMoreRef} className="py-2">
                {loadingMore && (
                  <div className="flex justify-center">
                    <Spinner size="md" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-neutral-500 text-sm">
                    Beginning of feed
                  </p>
                )}
              </div>

              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handlePostDeleted}
                  currentUserId={userId}
                  isAdmin={isAdmin}
                />
              ))}

              {/* Scroll target for new posts */}
              <div ref={feedEndRef} />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                {searchQuery ? (
                  <Search className="w-8 h-8 text-neutral-500" />
                ) : activityFilter === 'posts' ? (
                  <FileText className="w-8 h-8 text-neutral-500" />
                ) : activityFilter === 'hearts' ? (
                  <Heart className="w-8 h-8 text-neutral-500" />
                ) : activityFilter === 'comments' ? (
                  <MessageCircle className="w-8 h-8 text-neutral-500" />
                ) : showPinned ? (
                  <Pin className="w-8 h-8 text-neutral-500" />
                ) : (
                  <Sparkles className="w-8 h-8 text-neutral-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery 
                  ? 'No posts found'
                  : activityFilter === 'posts'
                    ? 'No posts yet'
                    : activityFilter === 'hearts'
                      ? 'No hearted posts'
                      : activityFilter === 'comments'
                        ? 'No commented posts'
                        : showPinned
                          ? 'No pinned posts'
                          : activeFilter !== 'all' 
                            ? `No ${VIBE_TAG_CONFIG[activeFilter].label.toLowerCase()} posts yet`
                            : 'No posts yet'
                }
              </h3>
              <p className="text-neutral-400 max-w-md mx-auto">
                {searchQuery
                  ? 'Try a different search term or clear the search'
                  : activityFilter === 'posts'
                    ? 'Share something with the Vibe Tribe to see your posts here!'
                    : activityFilter === 'hearts'
                      ? 'Heart some posts to see them here!'
                      : activityFilter === 'comments'
                        ? 'Comment on posts to see them here!'
                        : showPinned
                          ? 'Pinned posts will appear here'
                          : 'Be the first to share something with the Vibe Tribe!'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Composer - only show if user has posted before */}
      {hasPostedBefore && (
        <StickyPostComposer 
          userId={userId} 
          onPostCreated={handlePostCreated} 
        />
      )}
    </div>
  )
}
