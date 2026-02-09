'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, Button, DeleteConfirmationDialog } from '@/lib/design-system'
import { Heart, MessageCircle, Trash2, MoreHorizontal, Play, Pencil, Pin } from 'lucide-react'
import { VibePost, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'
import { UserBadgeIndicator } from '@/components/badges'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { VibeTagBadge } from './VibeTagBadge'
import { CommentSection } from './CommentSection'
import { format, isToday, isYesterday } from 'date-fns'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isPinned, setIsPinned] = useState(post.is_pinned ?? false)
  const [isPinning, setIsPinning] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const canDelete = currentUserId === post.user_id || isAdmin
  const canEdit = currentUserId === post.user_id
  const canPin = isAdmin

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

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

  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleEditClick = () => {
    setShowMenu(false)
    setEditContent(post.content || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(post.content || '')
  }

  const handleSaveEdit = async () => {
    if (isSavingEdit || !editContent.trim()) return
    
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      
      if (response.ok) {
        // Update the local post content
        post.content = editContent.trim()
        setIsEditing(false)
      } else {
        console.error('Edit failed:', await response.text())
      }
    } catch (error) {
      console.error('Error editing post:', error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleting || !onDelete) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${post.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setShowDeleteConfirm(false)
        onDelete(post.id)
      } else {
        console.error('Delete failed:', await response.text())
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1)
  }

  const handlePinToggle = async () => {
    if (isPinning || !isAdmin) return
    
    setIsPinning(true)
    const method = isPinned ? 'DELETE' : 'POST'
    
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${post.id}/pin`, {
        method,
      })
      
      if (response.ok) {
        setIsPinned(!isPinned)
      } else {
        console.error('Pin toggle failed:', await response.text())
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    } finally {
      setIsPinning(false)
      setShowMenu(false)
    }
  }

  // Format time: show time for today, "Yesterday" for yesterday, or date for older
  const postDate = new Date(post.created_at)
  const timeDisplay = isToday(postDate) 
    ? format(postDate, 'h:mm a')
    : isYesterday(postDate)
      ? 'Yesterday'
      : format(postDate, 'MMM d')

  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url)

  if (compact) {
    return (
      <Link href={`/vibe-tribe/posts/${post.id}`}>
        <Card className="p-4 hover:border-neutral-500 transition-all cursor-pointer h-full">
          <div className="flex items-start gap-3 mb-3">
          {/* Avatar - Links to user snapshot */}
          <Link 
            href={`/snapshot/${post.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-500 transition-all"
          >
            {post.user?.profile_picture_url ? (
              <img
                src={post.user.profile_picture_url}
                alt={post.user.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm font-medium">
                {post.user?.full_name?.[0] || '?'}
              </div>
            )}
          </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/snapshot/${post.user_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-white truncate hover:text-primary-400 transition-colors"
                >
                  {post.user?.full_name || 'Anonymous'}
                </Link>
                <UserBadgeIndicator userId={post.user_id} size="xs" />
                <VibeTagBadge tag={post.vibe_tag} size="sm" showLabel={false} />
              </div>
              <span className="text-xs text-neutral-500">{timeDisplay}</span>
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
    <div className="py-4">
      {/* Post Row */}
      <div className="flex items-start gap-3">
        {/* Avatar - Links to user snapshot */}
        <Link 
          href={`/snapshot/${post.user_id}`}
          className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-500 transition-all"
        >
          {post.user?.profile_picture_url ? (
            <img
              src={post.user.profile_picture_url}
              alt={post.user.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm font-medium">
              {post.user?.full_name?.[0] || '?'}
            </div>
          )}
        </Link>
        
        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Name + Tag + Time - fixed height for consistency */}
          <div className="flex items-center gap-2 h-6">
            <Link 
              href={`/snapshot/${post.user_id}`}
              className="font-bold text-white hover:text-primary-400 transition-colors leading-none"
            >
              {post.user?.full_name || 'Anonymous'}
            </Link>
            <VibeTagBadge tag={post.vibe_tag} size="sm" />
            {isPinned && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#BF00FF]/20 text-[#BF00FF]">
                <Pin className="w-3 h-3" />
                <span className="text-xs font-medium">Pinned</span>
              </div>
            )}
            <span className="text-sm text-neutral-500 leading-none">{timeDisplay}</span>
            
            {/* Menu - always in same position */}
            {(canEdit || canDelete || canPin) && (
              <div ref={menuRef} className="relative ml-auto -mr-1">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 py-1 z-10 min-w-[100px]">
                    {canPin && (
                      <button
                        onClick={handlePinToggle}
                        disabled={isPinning}
                        className="flex items-center gap-2 px-4 py-2 text-[#BF00FF] hover:bg-neutral-700 w-full text-left disabled:opacity-50"
                      >
                        <Pin className="w-4 h-4" />
                        {isPinning ? 'Loading...' : isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 text-white hover:bg-neutral-700 w-full text-left"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={handleDeleteClick}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-neutral-700 w-full text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Content - directly under name line */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="px-4 py-1.5 bg-[#39FF14] text-black rounded-full text-sm font-medium hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-neutral-700 text-white rounded-full text-sm font-medium hover:bg-neutral-600 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            post.content && (
              <p className="text-white whitespace-pre-wrap leading-normal">
                {post.content}
              </p>
            )
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`
              mt-2 rounded-lg overflow-hidden
              ${post.media_urls.length === 1 ? '' : 'grid gap-1'}
              ${post.media_urls.length === 2 ? 'grid-cols-2' : ''}
              ${post.media_urls.length >= 3 ? 'grid-cols-2' : ''}
            `}>
              {post.media_urls.slice(0, 4).map((url, index) => (
                <div 
                  key={index} 
                  className={`relative bg-neutral-800 ${
                    post.media_urls.length === 1 ? 'max-h-[400px]' : 'aspect-square'
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
                        ${post.media_urls.length === 1 ? 'w-full h-auto max-h-[400px] object-contain' : 'object-cover'}
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

          {/* Engagement Row - Hearts and Comments */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleHeartToggle}
              disabled={isHeartLoading}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                hearted ? 'text-[#39FF14]' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" fill={hearted ? 'currentColor' : 'none'} />
              {heartsCount > 0 && <span>{heartsCount}</span>}
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                showComments ? 'text-[#C8E600]' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
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
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemName={post.content?.substring(0, 30) || 'this post'}
        itemType="Post"
        isLoading={deleting}
        loadingText="Deleting..."
      />
    </div>
  )
}
