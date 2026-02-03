'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button, Spinner } from '@/lib/design-system'
import { Heart, Trash2, Send, Reply, X } from 'lucide-react'
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
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

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

  // Submit a top-level comment
  const handleSubmitTopLevel = async (e: React.FormEvent) => {
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

  // Submit a reply to a comment
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/vibe-tribe/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyText.trim(),
          parent_comment_id: parentCommentId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Helper to add reply to the correct parent (works for nested replies too)
        const addReplyToParent = (comments: VibeComment[], parentId: string, reply: VibeComment): VibeComment[] => {
          return comments.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), reply] }
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReplyToParent(c.replies, parentId, reply) }
            }
            return c
          })
        }
        
        setComments(prev => addReplyToParent(prev, parentCommentId, data.comment))
        setReplyText('')
        setReplyingToId(null)
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/vibe-tribe/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Helper to remove comment from tree
        const removeFromTree = (comments: VibeComment[], targetId: string): VibeComment[] => {
          return comments
            .filter(c => c.id !== targetId)
            .map(c => ({
              ...c,
              replies: c.replies ? removeFromTree(c.replies, targetId) : []
            }))
        }
        
        setComments(prev => removeFromTree(prev, commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleHeartComment = async (comment: VibeComment) => {
    const method = comment.has_hearted ? 'DELETE' : 'POST'
    
    // Helper to update a comment in the tree
    const updateComment = (comments: VibeComment[], targetId: string, updates: Partial<VibeComment>): VibeComment[] => {
      return comments.map(c => {
        if (c.id === targetId) {
          return { ...c, ...updates }
        }
        if (c.replies) {
          return { ...c, replies: updateComment(c.replies, targetId, updates) }
        }
        return c
      })
    }

    // Optimistic update
    setComments(prev => updateComment(prev, comment.id, {
      has_hearted: !comment.has_hearted,
      hearts_count: comment.has_hearted ? comment.hearts_count - 1 : comment.hearts_count + 1,
    }))

    try {
      const response = await fetch(`/api/vibe-tribe/comments/${comment.id}/heart`, {
        method,
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => updateComment(prev, comment.id, {
          hearts_count: data.hearts_count,
        }))
      }
    } catch (error) {
      // Revert on error
      setComments(prev => updateComment(prev, comment.id, {
        has_hearted: comment.has_hearted,
        hearts_count: comment.hearts_count,
      }))
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
      {/* Top-level Comment Input */}
      <form onSubmit={handleSubmitTopLevel} className="mb-4">
        <div className="flex items-center gap-2">
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
        </div>
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
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={() => handleDeleteComment(comment.id)}
              onHeart={() => handleHeartComment(comment)}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitReply}
              submitting={submitting}
              onDeleteComment={handleDeleteComment}
              onHeartComment={handleHeartComment}
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
  currentUserId?: string
  isAdmin?: boolean
  onDelete: () => void
  onHeart: () => void
  replyingToId: string | null
  setReplyingToId: (id: string | null) => void
  replyText: string
  setReplyText: (text: string) => void
  onSubmitReply: (parentId: string) => void
  submitting: boolean
  onDeleteComment: (id: string, parentId?: string) => void
  onHeartComment: (comment: VibeComment) => void
  isReply?: boolean
}

function CommentItem({ 
  comment, 
  canDelete, 
  currentUserId,
  isAdmin,
  onDelete, 
  onHeart,
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  onSubmitReply,
  submitting,
  onDeleteComment,
  onHeartComment,
  isReply = false,
}: CommentItemProps) {
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
  const isReplying = replyingToId === comment.id

  // Focus input when replying
  useEffect(() => {
    if (isReplying && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isReplying])

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  const handleReplyClick = () => {
    if (isReplying) {
      setReplyingToId(null)
      setReplyText('')
    } else {
      setReplyingToId(comment.id)
      setReplyText('')
    }
  }

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitReply(comment.id)
  }

  return (
    <div className={isReply ? 'ml-8' : ''}>
      <div className="flex items-start gap-3">
        {/* Avatar - Links to user snapshot */}
        <Link 
          href={`/snapshot/${comment.user_id}`}
          className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-500 transition-all`}
        >
          {comment.user?.profile_picture_url ? (
            <img
              src={comment.user.profile_picture_url}
              alt={comment.user.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-medium">
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
            
            <button
              onClick={handleReplyClick}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isReplying ? 'text-[#39FF14]' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Reply className="w-3 h-3" />
              {isReplying ? 'Cancel' : 'Reply'}
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

          {/* Inline Reply Input */}
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-3 ml-2">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.user?.full_name || 'Anonymous'}...`}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14]"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyText.trim() || submitting}
                  className="rounded-full px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              canDelete={currentUserId === reply.user_id || isAdmin}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={() => onDeleteComment(reply.id)}
              onHeart={() => onHeartComment(reply)}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              onDeleteComment={onDeleteComment}
              onHeartComment={onHeartComment}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
