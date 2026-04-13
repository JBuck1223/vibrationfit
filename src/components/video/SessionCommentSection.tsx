'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Spinner, Button } from '@/lib/design-system'
import { FileUpload } from '@/lib/design-system/components/forms/FileUpload'
import { Heart, Send, Reply, Pencil, MessageCircle, X, Film, Upload } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'

function isVideoUrl(url: string): boolean {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
  return ['mp4', 'mov', 'webm', 'avi'].includes(ext || '')
}

interface SessionComment {
  id: string
  session_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  media_urls?: string[]
  hearts_count: number
  is_deleted: boolean
  created_at: string
  edited_at: string | null
  user?: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
    role?: string | null
  }
  has_hearted?: boolean
  replies?: SessionComment[]
}

interface SessionCommentSectionProps {
  sessionId: string
  currentUserId?: string
  isAdmin?: boolean
}

function MediaThumbnails({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group w-20 h-20 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 block"
        >
          {isVideoUrl(url) ? (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900">
              <Film className="w-6 h-6 text-neutral-400" />
            </div>
          ) : (
            <img src={url} alt="" className="w-full h-full object-cover" />
          )}
        </a>
      ))}
    </div>
  )
}

export function SessionCommentSection({
  sessionId,
  currentUserId,
  isAdmin = false,
}: SessionCommentSectionProps) {
  const [comments, setComments] = useState<SessionComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [showReplyUploader, setShowReplyUploader] = useState(false)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const topCommentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchComments()
  }, [sessionId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/video/sessions/${sessionId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching session comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return []
    setUploading(true)
    try {
      const results = await uploadMultipleUserFiles('sessionComments', files)
      return results
        .filter((r: { url: string; key: string; error?: string }) => !r.error && r.url)
        .map((r: { url: string; key: string; error?: string }) => r.url)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitTopLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && pendingFiles.length === 0) || submitting) return

    setSubmitting(true)
    try {
      const mediaUrls = await uploadFiles(pendingFiles)

      const response = await fetch(`/api/video/sessions/${sessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        setPendingFiles([])
        setShowUploader(false)
      }
    } catch (error) {
      console.error('Error posting session comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: string) => {
    if ((!replyText.trim() && replyFiles.length === 0) || submitting) return

    setSubmitting(true)
    try {
      const mediaUrls = await uploadFiles(replyFiles)

      const response = await fetch(`/api/video/sessions/${sessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_comment_id: parentCommentId,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const addReplyToParent = (items: SessionComment[], parentId: string, reply: SessionComment): SessionComment[] => {
          return items.map(c => {
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
        setReplyFiles([])
        setShowReplyUploader(false)
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/video/session-comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const removeFromTree = (items: SessionComment[], targetId: string): SessionComment[] => {
          return items
            .filter(c => c.id !== targetId)
            .map(c => ({
              ...c,
              replies: c.replies ? removeFromTree(c.replies, targetId) : [],
            }))
        }
        setComments(prev => removeFromTree(prev, commentId))
      }
    } catch (error) {
      console.error('Error deleting session comment:', error)
    }
  }

  const handleHeartComment = async (comment: SessionComment) => {
    const method = comment.has_hearted ? 'DELETE' : 'POST'

    const updateComment = (items: SessionComment[], targetId: string, updates: Partial<SessionComment>): SessionComment[] => {
      return items.map(c => {
        if (c.id === targetId) return { ...c, ...updates }
        if (c.replies) return { ...c, replies: updateComment(c.replies, targetId, updates) }
        return c
      })
    }

    setComments(prev =>
      updateComment(prev, comment.id, {
        has_hearted: !comment.has_hearted,
        hearts_count: comment.has_hearted ? comment.hearts_count - 1 : comment.hearts_count + 1,
      })
    )

    try {
      const response = await fetch(`/api/video/session-comments/${comment.id}/heart`, { method })
      if (response.ok) {
        const data = await response.json()
        setComments(prev => updateComment(prev, comment.id, { hearts_count: data.hearts_count }))
      }
    } catch {
      setComments(prev =>
        updateComment(prev, comment.id, {
          has_hearted: comment.has_hearted,
          hearts_count: comment.hearts_count,
        })
      )
    }
  }

  const handleEditComment = async (commentId: string, newContent: string): Promise<boolean> => {
    const updateInTree = (items: SessionComment[], targetId: string, updates: Partial<SessionComment>): SessionComment[] => {
      return items.map(c => {
        if (c.id === targetId) return { ...c, ...updates }
        if (c.replies) return { ...c, replies: updateInTree(c.replies, targetId, updates) }
        return c
      })
    }

    try {
      const response = await fetch(`/api/video/session-comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev =>
          updateInTree(prev, commentId, {
            content: data.comment.content,
            edited_at: data.comment.edited_at,
          })
        )
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const totalComments = useMemo(() => {
    let count = 0
    const countAll = (items: SessionComment[]) => {
      for (const c of items) {
        count++
        if (c.replies) countAll(c.replies)
      }
    }
    countAll(comments)
    return count
  }, [comments])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#00FFFF]" />
        <h3 className="text-sm font-semibold text-white">Discussion</h3>
        {totalComments > 0 && (
          <span className="text-xs text-neutral-500">{totalComments}</span>
        )}
      </div>

      {/* New comment input */}
      {!replyingToId && (
        <form onSubmit={handleSubmitTopLevel}>
          <div className="flex items-end gap-2">
            <textarea
              ref={topCommentRef}
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value)
                e.target.style.height = 'auto'
                const maxH = Math.min(window.innerHeight * 0.4, 300)
                const newH = Math.min(e.target.scrollHeight, maxH)
                e.target.style.height = `${newH}px`
                e.target.style.overflowY = e.target.scrollHeight > maxH ? 'auto' : 'hidden'
              }}
              placeholder="Share a thought, question, or win..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none min-h-[36px]"
              style={{ overflowY: 'hidden' }}
              rows={1}
            />
            <button
              type="submit"
              disabled={(!newComment.trim() && pendingFiles.length === 0) || submitting || uploading}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Upload toggle for new comments */}
      {!replyingToId && (
        !showUploader ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowUploader(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        ) : (
          <FileUpload
            dragDrop
            accept="image/*,video/*"
            multiple
            maxFiles={5}
            maxSize={500}
            value={pendingFiles}
            onChange={setPendingFiles}
            onUpload={setPendingFiles}
            isUploading={uploading}
            dragDropText="Click to upload or drag and drop"
            dragDropSubtext="Images or videos (max 5 files, 500MB each)"
            previewSize="md"
          />
        )
      )}

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
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
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              showReplyUploader={showReplyUploader}
              setShowReplyUploader={setShowReplyUploader}
              onSubmitReply={handleSubmitReply}
              submitting={submitting}
              uploading={uploading}
              onDeleteComment={handleDeleteComment}
              onHeartComment={handleHeartComment}
              onEditComment={handleEditComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: SessionComment
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
  replyFiles: File[]
  setReplyFiles: (files: File[]) => void
  showReplyUploader: boolean
  setShowReplyUploader: (show: boolean) => void
  onSubmitReply: (parentId: string) => void
  submitting: boolean
  uploading: boolean
  onDeleteComment: (id: string) => void
  onHeartComment: (comment: SessionComment) => void
  onEditComment: (commentId: string, newContent: string) => Promise<boolean>
  nestingLevel?: number
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
  replyFiles,
  setReplyFiles,
  showReplyUploader,
  setShowReplyUploader,
  onSubmitReply,
  submitting,
  uploading,
  onDeleteComment,
  onHeartComment,
  onEditComment,
  nestingLevel = 0,
}: CommentItemProps) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [originalText, setOriginalText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

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
    } catch {
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
      setReplyFiles([])
      setShowReplyUploader(false)
    } else {
      setReplyingToId(comment.id)
      const authorName = comment.user?.full_name || 'Anonymous'
      setReplyText(`@${authorName} `)
    }
  }

  const indentClass = nestingLevel === 0 ? '' : nestingLevel === 1 ? 'ml-6 md:ml-10' : 'ml-4 md:ml-8'

  return (
    <div className={`relative ${indentClass}`}>
      <div className="flex items-start gap-2 md:gap-3">
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
            <>
              {comment.content && (
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                  {comment.content}
                  {comment.edited_at && (
                    <span className="text-xs text-neutral-500 ml-2">(edited)</span>
                  )}
                </p>
              )}
              <MediaThumbnails urls={comment.media_urls || []} />
            </>
          )}

          {!editing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={onHeart}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.has_hearted ? 'text-[#39FF14]' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" fill={comment.has_hearted ? 'currentColor' : 'none'} />
                {comment.hearts_count > 0 && <span>{comment.hearts_count}</span>}
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
                  onClick={() => {
                    setEditing(true)
                    setEditText(comment.content)
                    setOriginalText(comment.content)
                    setEditError(false)
                  }}
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
            <div className="mt-3 space-y-2">
              <div className="flex items-end gap-2">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => {
                    setReplyText(e.target.value)
                    e.target.style.height = 'auto'
                    const maxH = Math.min(window.innerHeight * 0.4, 300)
                    const newH = Math.min(e.target.scrollHeight, maxH)
                    e.target.style.height = `${newH}px`
                    e.target.style.overflowY = e.target.scrollHeight > maxH ? 'auto' : 'hidden'
                  }}
                  placeholder={`Reply to ${comment.user?.full_name || 'Anonymous'}...`}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] resize-none min-h-[36px]"
                  style={{ overflowY: 'hidden' }}
                  rows={1}
                />
                <button
                  type="button"
                  disabled={(!replyText.trim() && replyFiles.length === 0) || submitting || uploading}
                  onClick={() => onSubmitReply(comment.id)}
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {!showReplyUploader ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowReplyUploader(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              ) : (
                <FileUpload
                  dragDrop
                  accept="image/*,video/*"
                  multiple
                  maxFiles={5}
                  maxSize={500}
                  value={replyFiles}
                  onChange={setReplyFiles}
                  onUpload={setReplyFiles}
                  isUploading={uploading}
                  dragDropText="Click to upload or drag and drop"
                  dragDropSubtext="Images or videos (max 5 files, 500MB each)"
                  previewSize="sm"
                />
              )}
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
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              showReplyUploader={showReplyUploader}
              setShowReplyUploader={setShowReplyUploader}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              uploading={uploading}
              onDeleteComment={onDeleteComment}
              onHeartComment={onHeartComment}
              onEditComment={onEditComment}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
