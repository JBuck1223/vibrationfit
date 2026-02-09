'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, Button, DeleteConfirmationDialog } from '@/lib/design-system'
import { Heart, MessageCircle, Trash2, MoreHorizontal, Play, Pencil, Pin, X } from 'lucide-react'
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
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

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
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
          {/* Mobile: Name on row 1, Tag + Time on row 2 */}
          {/* Desktop: All on one row */}
          
          {/* Row 1: Name + Menu */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Link 
              href={`/snapshot/${post.user_id}`}
              className="text-sm md:text-base font-bold text-white hover:text-primary-400 transition-colors leading-none"
            >
              {post.user?.full_name || 'Anonymous'}
            </Link>
            {/* Tag + Time - hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center gap-2">
              <VibeTagBadge tag={post.vibe_tag} size="sm" />
              {isPinned && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#BF00FF]/20 text-[#BF00FF]">
                  <Pin className="w-3 h-3" />
                  <span className="text-xs font-medium">Pinned</span>
                </div>
              )}
              <span className="text-sm text-neutral-500 leading-none">{timeDisplay}</span>
            </div>
            
            {/* Menu */}
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
          
          {/* Row 2 (mobile only): Tag + Pinned + Time */}
          <div className="flex md:hidden items-center gap-1.5 mt-0.5">
            <VibeTagBadge tag={post.vibe_tag} size="sm" />
            {isPinned && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#BF00FF]/20 text-[#BF00FF]">
                <Pin className="w-2.5 h-2.5" />
                <span className="text-[10px] font-medium">Pinned</span>
              </div>
            )}
            <span className="text-xs text-neutral-500 leading-none">{timeDisplay}</span>
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
              <p className="text-sm md:text-base text-white whitespace-pre-wrap leading-normal mt-1.5">
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
                  className="relative aspect-square bg-neutral-800 cursor-pointer"
                  onClick={() => !isVideo(url) && openLightbox(index)}
                >
                  {isVideo(url) ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <Image
                      src={url}
                      alt="Post media"
                      fill
                      className="object-cover hover:opacity-90 transition-opacity"
                    />
                  )}
                  {index === 3 && post.media_urls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
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

      {/* Image Lightbox */}
      {lightboxOpen && post.media_urls && post.media_urls.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Main content area */}
          <div 
            className="flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image area */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <div className="relative w-full h-full max-h-[70vh] md:max-h-full flex items-center justify-center">
                <Image
                  src={post.media_urls[lightboxImageIndex]}
                  alt="Full size image"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
              </div>
            </div>

            {/* Sidebar with engagement */}
            <div className="w-full md:w-96 bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col max-h-[40vh] md:max-h-full overflow-hidden">
              {/* Post info header */}
              <div className="p-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
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
                  </div>
                  <div>
                    <p className="font-bold text-white">{post.user?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-neutral-500">{timeDisplay}</p>
                  </div>
                </div>
                {post.content && (
                  <p className="text-white mt-3 text-sm whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>

              {/* Engagement buttons */}
              <div className="p-4 border-b border-neutral-800">
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleHeartToggle}
                    disabled={isHeartLoading}
                    className={`flex items-center gap-2 transition-colors ${
                      hearted ? 'text-[#39FF14]' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Heart className="w-6 h-6" fill={hearted ? 'currentColor' : 'none'} />
                    <span className="font-medium">{heartsCount}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowComments(true)}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-medium">{commentsCount}</span>
                  </button>
                </div>
              </div>

              {/* Comments section */}
              <div className="flex-1 overflow-y-auto p-4">
                <CommentSection 
                  postId={post.id} 
                  onCommentAdded={handleCommentAdded}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>

          {/* Navigation arrows for multiple images */}
          {post.media_urls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxImageIndex((prev) => 
                    prev === 0 ? post.media_urls.length - 1 : prev - 1
                  )
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxImageIndex((prev) => 
                    prev === post.media_urls.length - 1 ? 0 : prev + 1
                  )
                }}
                className="absolute right-4 md:right-[400px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
