'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Spinner } from '@/lib/design-system'
import { Heart, Trash2, Send, Reply, X, Pencil } from 'lucide-react'
import { VibeComment } from '@/lib/vibe-tribe/types'
import { UserBadgeIndicator } from '@/components/badges'
import { format, isToday, isYesterday } from 'date-fns'
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete'
import { MentionDropdown } from './MentionDropdown'
import { EmojiPickerButton } from './EmojiPickerButton'
import { renderContentWithMentions } from '@/lib/vibe-tribe/render-mentions'

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
  const topCommentRef = useRef<HTMLTextAreaElement>(null)

  const topMention = useMentionAutocomplete({
    value: newComment,
    onChange: setNewComment,
    textareaRef: topCommentRef,
  })

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

  const handleEditComment = async (commentId: string, newContent: string) => {
    const updateInTree = (comments: VibeComment[], targetId: string, updates: Partial<VibeComment>): VibeComment[] => {
      return comments.map(c => {
        if (c.id === targetId) return { ...c, ...updates }
        if (c.replies) return { ...c, replies: updateInTree(c.replies, targetId, updates) }
        return c
      })
    }

    try {
      const response = await fetch(`/api/vibe-tribe/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => updateInTree(prev, commentId, {
          content: data.comment.content,
          edited_at: data.comment.edited_at,
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Error editing comment:', error)
      return false
    }
  }

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>()
    const traverse = (items: VibeComment[]) => {
      for (const c of items) {
        if (c.user?.full_name) {
          map.set(c.user.full_name, c.user_id)
        }
        if (c.replies) traverse(c.replies)
      }
    }
    traverse(comments)
    return map
  }, [comments])

  if (loading) {
    return (
      <div className="flex justify-center py-4 mt-4 border-t border-neutral-800">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* Top-level Comment Input - hidden when replying to someone */}
      {!replyingToId && (
        <form onSubmit={handleSubmitTopLevel} className="mb-4">
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 relative">
              <MentionDropdown
                results={topMention.mentionResults}
                activeIndex={topMention.mentionActiveIndex}
                onSelect={topMention.mentionSelectMember}
                isOpen={topMention.isMentionOpen}
              />
              <textarea
                ref={topCommentRef}
                value={newComment}
                onChange={(e) => {
                  topMention.mentionHandleChange(e)
                  e.target.style.height = 'auto'
                  const maxH = Math.min(window.innerHeight * 0.4, 300)
                  const newH = Math.min(e.target.scrollHeight, maxH)
                  e.target.style.height = `${newH}px`
                  e.target.style.overflowY = e.target.scrollHeight > maxH ? 'auto' : 'hidden'
                }}
                onKeyDown={topMention.mentionHandleKeyDown}
                placeholder="Add a comment..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none min-h-[36px]"
                style={{ overflowY: 'hidden' }}
                rows={1}
              />
            </div>
            <EmojiPickerButton
              textareaRef={topCommentRef}
              onInsert={(val) => setNewComment(val)}
              iconSize="w-4 h-4"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Comments List - with gray line above */}
      <div className="pt-4 border-t border-neutral-800 space-y-4">
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
              canEdit={currentUserId === comment.user_id}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={() => handleDeleteComment(comment.id)}
              onHeart={() => handleHeartComment(comment)}
              onEdit={handleEditComment}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitReply}
              submitting={submitting}
              onDeleteComment={handleDeleteComment}
              onHeartComment={handleHeartComment}
              onEditComment={handleEditComment}
              userNameMap={userNameMap}
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
  canEdit: boolean
  currentUserId?: string
  isAdmin?: boolean
  onDelete: () => void
  onHeart: () => void
  onEdit: (commentId: string, newContent: string) => Promise<boolean>
  replyingToId: string | null
  setReplyingToId: (id: string | null) => void
  replyText: string
  setReplyText: (text: string) => void
  onSubmitReply: (parentId: string) => void
  submitting: boolean
  onDeleteComment: (id: string, parentId?: string) => void
  onHeartComment: (comment: VibeComment) => void
  onEditComment: (commentId: string, newContent: string) => Promise<boolean>
  isReply?: boolean
  replyToAuthor?: { name: string; userId: string }
  nestingLevel?: number
  userNameMap: Map<string, string>
}

function CommentItem({ 
  comment, 
  canDelete,
  canEdit,
  currentUserId,
  isAdmin,
  onDelete, 
  onHeart,
  onEdit,
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  onSubmitReply,
  submitting,
  onDeleteComment,
  onHeartComment,
  onEditComment,
  isReply = false,
  replyToAuthor,
  nestingLevel = 0,
  userNameMap,
}: CommentItemProps) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [originalText, setOriginalText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const replyMention = useMentionAutocomplete({
    value: replyText,
    onChange: setReplyText,
    textareaRef: replyInputRef,
  })
  
  // Format time: show time for today, "Yesterday" for yesterday, or date for older
  const commentDate = new Date(comment.created_at)
  const timeDisplay = isToday(commentDate) 
    ? format(commentDate, 'h:mm a')
    : isYesterday(commentDate)
      ? 'Yesterday'
      : format(commentDate, 'MMM d')
  
  const isReplying = replyingToId === comment.id

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [isReplying])

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.setSelectionRange(editText.length, editText.length)
      editInputRef.current.style.height = 'auto'
      const maxH = Math.min(window.innerHeight * 0.4, 300)
      const newH = Math.min(editInputRef.current.scrollHeight, maxH)
      editInputRef.current.style.height = `${newH}px`
      editInputRef.current.style.overflowY = editInputRef.current.scrollHeight > maxH ? 'auto' : 'hidden'
    }
  }, [editing])

  const handleSaveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === originalText || saving) return
    setEditError(false)
    setSaving(true)
    try {
      const success = await onEdit(comment.id, trimmed)
      if (success) {
        setOriginalText(trimmed)
        setEditing(false)
      } else {
        setEditError(true)
      }
    } catch (error) {
      console.error('Error saving edit:', error)
      setEditError(true)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText(comment.content)
    setOriginalText(comment.content)
    setEditError(false)
  }

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
      // Auto-fill with @ mention
      const authorName = comment.user?.full_name || 'Anonymous'
      setReplyText(`@${authorName} `)
    }
  }

  const indentClass = nestingLevel === 0 ? '' : nestingLevel === 1 ? 'ml-6 md:ml-10' : 'ml-4 md:ml-8'

  const allMentionedUsers = useMemo(() => {
    const map = new Map<string, string>()
    for (const [name, id] of userNameMap.entries()) {
      map.set(name, id)
    }
    if (comment.mentioned_users) {
      for (const u of comment.mentioned_users) {
        map.set(u.full_name, u.id)
      }
    }
    return Array.from(map.entries()).map(([full_name, id]) => ({ id, full_name }))
  }, [userNameMap, comment.mentioned_users])


  return (
    <div className={`relative ${indentClass}`}>
      <div className="flex items-start gap-2 md:gap-3">
        {/* Avatar - Links to user snapshot */}
        <Link 
          href={`/snapshot/${comment.user_id}`}
          className={`rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-500 transition-all ${
            nestingLevel > 0 ? 'w-7 h-7 md:w-10 md:h-10' : 'w-10 h-10'
          }`}
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
          {/* User info row */}
          <div className="flex items-center gap-2">
            <Link 
              href={`/snapshot/${comment.user_id}`}
              className="text-sm font-bold text-white hover:text-primary-400 transition-colors"
            >
              {comment.user?.full_name || 'Anonymous'}
            </Link>
            {(comment.user?.role === 'admin' || comment.user?.role === 'super_admin') && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#BF00FF]/15 text-[10px] font-bold text-[#BF00FF] tracking-wide uppercase">
                Guide
              </span>
            )}
            <span className="text-xs text-neutral-500">{timeDisplay}</span>
          </div>
          {/* Comment content or edit input */}
          {editing ? (
            <div className="mt-1">
              <textarea
                ref={editInputRef}
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value)
                  e.target.style.height = 'auto'
                  const maxH = Math.min(window.innerHeight * 0.4, 300)
                  const newH = Math.min(e.target.scrollHeight, maxH)
                  e.target.style.height = `${newH}px`
                  e.target.style.overflowY = e.target.scrollHeight > maxH ? 'auto' : 'hidden'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] resize-none"
                style={{ overflowY: 'hidden' }}
                rows={1}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editText.trim() || editText.trim() === originalText}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                {editError && (
                  <span className="text-xs text-red-400">Failed to save. Try again.</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-200 whitespace-pre-wrap min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
              {renderContentWithMentions(comment.content, allMentionedUsers)}
              {comment.edited_at && (
                <span className="text-xs text-neutral-500 ml-2">(edited)</span>
              )}
            </p>
          )}
          
          {/* Comment Actions */}
          {!editing && (
            <div className="flex items-center gap-4 mt-2">
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
                  className="w-3.5 h-3.5" 
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
                <Reply className="w-3.5 h-3.5" />
                {isReplying ? 'Cancel' : 'Reply'}
              </button>

              {canEdit && (
                <button
                  onClick={() => { setEditing(true); setEditText(comment.content); setOriginalText(comment.content); setEditError(false) }}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
              
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
          )}

          {/* Inline Reply Input */}
          {isReplying && (
            <div className="mt-3">
              <div className="flex items-center gap-2 relative">
                <div className="flex-1 relative">
                  <MentionDropdown
                    results={replyMention.mentionResults}
                    activeIndex={replyMention.mentionActiveIndex}
                    onSelect={replyMention.mentionSelectMember}
                    isOpen={replyMention.isMentionOpen}
                  />
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => {
                      replyMention.mentionHandleChange(e)
                      e.target.style.height = 'auto'
                      const maxH = Math.min(window.innerHeight * 0.4, 300)
                      const newH = Math.min(e.target.scrollHeight, maxH)
                      e.target.style.height = `${newH}px`
                      e.target.style.overflowY = e.target.scrollHeight > maxH ? 'auto' : 'hidden'
                    }}
                    onKeyDown={replyMention.mentionHandleKeyDown}
                    placeholder={`Reply to ${comment.user?.full_name || 'Anonymous'}...`}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] resize-none min-h-[36px]"
                    style={{ overflowY: 'hidden' }}
                    rows={1}
                  />
                </div>
                <EmojiPickerButton
                  textareaRef={replyInputRef}
                  onInsert={(val) => setReplyText(val)}
                  iconSize="w-4 h-4"
                />
                <button
                  type="button"
                  disabled={!replyText.trim() || submitting}
                  onClick={() => onSubmitReply(comment.id)}
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
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
              canDelete={currentUserId === reply.user_id || !!isAdmin}
              canEdit={currentUserId === reply.user_id}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={() => onDeleteComment(reply.id)}
              onHeart={() => onHeartComment(reply)}
              onEdit={onEditComment}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              onDeleteComment={onDeleteComment}
              onHeartComment={onHeartComment}
              onEditComment={onEditComment}
              isReply={true}
              replyToAuthor={{ 
                name: comment.user?.full_name || 'Anonymous', 
                userId: comment.user_id 
              }}
              nestingLevel={nestingLevel + 1}
              userNameMap={userNameMap}
            />
          ))}
        </div>
      )}
    </div>
  )
}
