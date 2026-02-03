'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Spinner } from '@/lib/design-system'
import { Heart, Trash2, Send } from 'lucide-react'
import { VibeComment } from '@/lib/vibe-tribe/types'
import { UserBadgeIndicator } from '@/components/badges'
import { formatDistanceToNow } from 'date-fns'

interface CommentSectionProps {
  postId: string
  onCommentAdded?: () => void
  currentUserId?: string
  isAdmin?: boolean
}

export function CommentSection({ 
  postId, 
  onCommentAdded,
  currentUserId,
  isAdmin = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<VibeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/vibe-tribe/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleHeartComment = async (comment: VibeComment) => {
    const method = comment.has_hearted ? 'DELETE' : 'POST'
    
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === comment.id 
        ? { 
            ...c, 
            has_hearted: !c.has_hearted,
            hearts_count: c.has_hearted ? c.hearts_count - 1 : c.hearts_count + 1,
          }
        : c
    ))

    try {
      const response = await fetch(`/api/vibe-tribe/comments/${comment.id}/heart`, {
        method,
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(c => 
          c.id === comment.id 
            ? { ...c, hearts_count: data.hearts_count }
            : c
        ))
      }
    } catch (error) {
      // Revert on error
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { 
              ...c, 
              has_hearted: comment.has_hearted,
              hearts_count: comment.hearts_count,
            }
          : c
      ))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4 mt-4 border-t border-neutral-800">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-neutral-800">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newComment.trim() || submitting}
          className="rounded-full px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-2">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={currentUserId === comment.user_id || isAdmin}
              onDelete={() => handleDeleteComment(comment.id)}
              onHeart={() => handleHeartComment(comment)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: VibeComment
  canDelete: boolean
  onDelete: () => void
  onHeart: () => void
}

function CommentItem({ comment, canDelete, onDelete, onHeart }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false)
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <div className="flex items-start gap-3">
      {/* Avatar - Links to user snapshot */}
      <Link 
        href={`/snapshot/${comment.user_id}`}
        className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-500 transition-all"
      >
        {comment.user?.profile_picture_url ? (
          <img
            src={comment.user.profile_picture_url}
            alt={comment.user.full_name || 'User'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm font-medium">
            {comment.user?.full_name?.[0] || '?'}
          </div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0">
          <div className="bg-neutral-800 rounded-2xl px-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={`/snapshot/${comment.user_id}`}
              className="text-sm font-semibold text-white hover:text-primary-400 transition-colors"
            >
              {comment.user?.full_name || 'Anonymous'}
            </Link>
            <UserBadgeIndicator userId={comment.user_id} size="xs" />
            <span className="text-xs text-neutral-500">{timeAgo}</span>
          </div>
          <p className="text-sm text-neutral-300 whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
        
        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-1 ml-2">
          <button
            onClick={onHeart}
            className={`
              flex items-center gap-1 text-xs transition-colors
              ${comment.has_hearted 
                ? 'text-[#39FF14]' 
                : 'text-neutral-500 hover:text-white'
              }
            `}
          >
            <Heart 
              className="w-3 h-3" 
              fill={comment.has_hearted ? 'currentColor' : 'none'}
            />
            {comment.hearts_count > 0 && (
              <span>{comment.hearts_count}</span>
            )}
          </button>
          
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-neutral-500 hover:text-red-500 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
