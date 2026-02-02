'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, Button } from '@/lib/design-system'
import { Heart, MessageCircle, Trash2, MoreHorizontal, Play } from 'lucide-react'
import { VibePost, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { VibeTagBadge } from './VibeTagBadge'
import { CommentSection } from './CommentSection'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: VibePost
  compact?: boolean
  onDelete?: (postId: string) => void
  currentUserId?: string
  isAdmin?: boolean
}

export function PostCard({ 
  post, 
  compact = false,
  onDelete,
  currentUserId,
  isAdmin = false,
}: PostCardProps) {
  const [hearted, setHearted] = useState(post.has_hearted || false)
  const [heartsCount, setHeartsCount] = useState(post.hearts_count)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [isHeartLoading, setIsHeartLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = currentUserId === post.user_id || isAdmin

  const handleHeartToggle = async () => {
    if (isHeartLoading) return
    
    setIsHeartLoading(true)
    const method = hearted ? 'DELETE' : 'POST'
    
    // Optimistic update
    setHearted(!hearted)
    setHeartsCount(prev => hearted ? prev - 1 : prev + 1)
    
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${post.id}/heart`, {
        method,
      })
      
      if (response.ok) {
        const data = await response.json()
        setHeartsCount(data.hearts_count)
      } else {
        // Revert on error
        setHearted(hearted)
        setHeartsCount(post.hearts_count)
      }
    } catch (error) {
      // Revert on error
      setHearted(hearted)
      setHeartsCount(post.hearts_count)
    } finally {
      setIsHeartLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleting || !onDelete) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${post.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(post.id)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeleting(false)
      setShowMenu(false)
    }
  }

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1)
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url)

  if (compact) {
    return (
      <Link href={`/vibe-tribe/posts/${post.id}`}>
        <Card className="p-4 hover:border-neutral-500 transition-all cursor-pointer h-full">
          <div className="flex items-start gap-3 mb-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
              {post.user?.profile_picture_url ? (
                <Image
                  src={post.user.profile_picture_url}
                  alt={post.user.full_name || 'User'}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm font-medium">
                  {post.user?.full_name?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">
                  {post.user?.full_name || 'Anonymous'}
                </span>
                <VibeTagBadge tag={post.vibe_tag} size="sm" showLabel={false} />
              </div>
              <span className="text-xs text-neutral-500">{timeAgo}</span>
            </div>
          </div>
          
          {post.content && (
            <p className="text-sm text-neutral-300 line-clamp-2 mb-2">
              {post.content}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {heartsCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {commentsCount}
            </span>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Card className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
            {post.user?.profile_picture_url ? (
              <Image
                src={post.user.profile_picture_url}
                alt={post.user.full_name || 'User'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-lg font-medium">
                {post.user?.full_name?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">
                {post.user?.full_name || 'Anonymous'}
              </span>
              <VibeTagBadge tag={post.vibe_tag} size="sm" />
            </div>
            <span className="text-sm text-neutral-500">{timeAgo}</span>
          </div>
        </div>
        
        {/* Menu */}
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 py-1 z-10">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-neutral-700 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-white whitespace-pre-wrap mb-4">
          {post.content}
        </p>
      )}

      {/* Life Categories */}
      {post.life_categories && post.life_categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.life_categories.map((categoryKey) => {
            const category = VISION_CATEGORIES.find(c => c.key === categoryKey)
            if (!category) return null
            return (
              <span
                key={categoryKey}
                className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full"
              >
                {category.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`
          mb-4 rounded-lg overflow-hidden
          ${post.media_urls.length === 1 ? '' : 'grid gap-1'}
          ${post.media_urls.length === 2 ? 'grid-cols-2' : ''}
          ${post.media_urls.length >= 3 ? 'grid-cols-2' : ''}
        `}>
          {post.media_urls.slice(0, 4).map((url, index) => (
            <div 
              key={index} 
              className={`relative bg-neutral-800 ${
                post.media_urls.length === 1 ? 'max-h-[500px]' : 'aspect-square'
              }`}
            >
              {isVideo(url) ? (
                <div className="relative w-full h-full">
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
              ) : (
                <Image
                  src={url}
                  alt="Post media"
                  fill={post.media_urls.length > 1}
                  width={post.media_urls.length === 1 ? 800 : undefined}
                  height={post.media_urls.length === 1 ? 600 : undefined}
                  className={`
                    ${post.media_urls.length === 1 ? 'w-full h-auto max-h-[500px] object-contain' : 'object-cover'}
                  `}
                />
              )}
              {index === 3 && post.media_urls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    +{post.media_urls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-neutral-800">
        <button
          onClick={handleHeartToggle}
          disabled={isHeartLoading}
          className={`
            flex items-center gap-2 py-2 px-3 rounded-full transition-all
            ${hearted 
              ? 'text-[#39FF14] bg-[#39FF14]/10' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }
          `}
        >
          <Heart 
            className="w-5 h-5" 
            fill={hearted ? 'currentColor' : 'none'}
          />
          <span className="text-sm font-medium">{heartsCount}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className={`
            flex items-center gap-2 py-2 px-3 rounded-full transition-all
            ${showComments 
              ? 'text-[#00FFFF] bg-[#00FFFF]/10' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }
          `}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={post.id} 
          onCommentAdded={handleCommentAdded}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </Card>
  )
}
